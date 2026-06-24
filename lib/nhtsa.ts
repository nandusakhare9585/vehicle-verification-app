// Real, free, no-key government APIs from the US National Highway Traffic
// Safety Administration (NHTSA). These power the vehicle specs + "car health".
//
//   VIN decode : https://vpic.nhtsa.dot.gov/api/  (vPIC)
//   Recalls    : https://api.nhtsa.gov/recalls/recallsByVehicle
//   Complaints : https://api.nhtsa.gov/complaints/complaintsByVehicle
//
// Note: recalls/complaints are looked up by make + model + year (NHTSA does not
// expose them per-VIN), so we first decode the VIN, then query by vehicle.

import type {
  Complaint,
  HealthSummary,
  Recall,
  VehicleSpecs,
} from "./types";

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";
const NHTSA = "https://api.nhtsa.gov";

async function getJson<T>(
  url: string,
  // `cache: false` skips Next's data cache — used for large payloads (popular
  // models return multi-MB complaint lists that exceed the 2MB cache limit).
  opts: { cache?: boolean } = { cache: true }
): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    ...(opts.cache === false
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 * 60 * 24 } }),
  });
  if (!res.ok) {
    throw new Error(`Upstream ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "not applicable") return null;
  return s;
}

export async function decodeVin(vin: string): Promise<VehicleSpecs> {
  type Row = Record<string, string>;
  const data = await getJson<{ Results: Row[] }>(
    `${VPIC}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`
  );
  const r = data.Results?.[0] ?? ({} as Row);
  return {
    vin: vin.toUpperCase(),
    make: clean(r.Make),
    model: clean(r.Model),
    modelYear: clean(r.ModelYear),
    trim: clean(r.Trim) ?? clean(r.Series),
    bodyClass: clean(r.BodyClass),
    vehicleType: clean(r.VehicleType),
    driveType: clean(r.DriveType),
    fuelType: clean(r.FuelTypePrimary),
    engineCylinders: clean(r.EngineCylinders),
    displacementL: clean(r.DisplacementL),
    transmission: clean(r.TransmissionStyle),
    doors: clean(r.Doors),
    plantCountry: clean(r.PlantCountry),
    manufacturer: clean(r.Manufacturer),
  };
}

export async function getRecalls(
  make: string | null,
  model: string | null,
  year: string | null
): Promise<Recall[]> {
  if (!make || !model || !year) return [];
  type Row = {
    NHTSACampaignNumber?: string;
    Component?: string;
    Summary?: string;
    Consequence?: string;
    Remedy?: string;
    ReportReceivedDate?: string;
  };
  const url =
    `${NHTSA}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  try {
    const data = await getJson<{ results: Row[] }>(url);
    return (data.results ?? []).map((r) => ({
      campaignNumber: r.NHTSACampaignNumber ?? "—",
      component: r.Component ?? "Unknown",
      summary: r.Summary ?? "",
      consequence: r.Consequence ?? "",
      remedy: r.Remedy ?? "",
      reportedDate: r.ReportReceivedDate ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getComplaints(
  make: string | null,
  model: string | null,
  year: string | null
): Promise<Complaint[]> {
  if (!make || !model || !year) return [];
  type Row = {
    odiNumber?: number;
    components?: string;
    summary?: string;
    crash?: boolean;
    fire?: boolean;
    numberOfInjuries?: number;
    dateOfIncident?: string;
  };
  const url =
    `${NHTSA}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  try {
    const data = await getJson<{ results: Row[] }>(url, { cache: false });
    return (data.results ?? []).map((c) => ({
      odiNumber: c.odiNumber ?? "—",
      component: c.components ?? "Unknown",
      summary: c.summary ?? "",
      crash: Boolean(c.crash),
      fire: Boolean(c.fire),
      injured: c.numberOfInjuries ?? 0,
      dateOfIncident: c.dateOfIncident ?? null,
    }));
  } catch {
    return [];
  }
}

export function summarizeHealth(
  recalls: Recall[],
  complaints: Complaint[]
): HealthSummary {
  const recallCount = recalls.length;
  const complaintCount = complaints.length;
  // Treat every recall as "open" unless we get remedy data per-VIN (we don't,
  // for free) — so this is a conservative upper bound.
  const openRecalls = recallCount;

  // Start at 100, subtract *capped* penalties, floor at 0.
  // NHTSA recalls/complaints are model-wide aggregates, so a popular model can
  // have thousands of complaints — we dampen complaint volume logarithmically
  // and cap each penalty so the score stays meaningful instead of bottoming out.
  const severeCount = complaints.filter((c) => c.fire || c.crash).length;
  const recallPenalty = Math.min(45, recallCount * 4);
  const complaintPenalty = Math.min(15, Math.log10(complaintCount + 1) * 5);
  const severePenalty = Math.min(10, severeCount * 0.5);

  let score = 100 - recallPenalty - complaintPenalty - severePenalty;
  score = Math.max(0, Math.round(score));

  const rating: HealthSummary["rating"] =
    score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 40 ? "Fair" : "Poor";

  return { recallCount, complaintCount, openRecalls, score, rating };
}
