// Adapters for data that is NOT available from free government APIs:
//   - Ownership history  (private records -> paid provider)
//   - Odometer / KM history (private records -> paid provider)
//   - Vehicle photos     (free image API, optional paid upgrade)
//
// Each adapter checks for an env key. If the key is missing it returns a clear
// "not configured" status instead of crashing, so the app runs out-of-the-box.
//
// Recommended real providers (sign up + paste the key into .env.local):
//   VinAudit   https://www.vinaudit.com/         (US history + odometer)
//   CarsXE     https://api.carsxe.com/            (specs, history, images, plates)
//   ClearVIN   https://www.clearvin.com/          (full history reports)
//   Auto.dev   https://www.auto.dev/              (listings, VIN, photos)

import type {
  OdometerReading,
  OwnershipRecord,
  ProviderStatus,
  VehicleSpecs,
} from "./types";

// ---------------------------------------------------------------------------
// License plate / car number -> VIN
// ---------------------------------------------------------------------------
// A number plate carries no vehicle data on its own, so we resolve it to a VIN
// through a provider, then the normal pipeline takes over. Needs a paid key.
//   CarsXE   : https://api.carsxe.com/  (platedecoder endpoint, wired below)
//   Auto.dev : https://www.auto.dev/
// Set PLATE_API_KEY in .env.local to enable. `region` is the US state code
// (e.g. "CA") or country, depending on the provider.

export interface PlateLookupResult {
  vin: string | null;
  status: ProviderStatus;
}

export async function plateToVin(
  plate: string,
  region: string
): Promise<PlateLookupResult> {
  const key = process.env.PLATE_API_KEY;
  if (!key) {
    if (DEMO()) {
      // In demo mode any plate resolves to a known-good VIN so the full report
      // (real NHTSA data) renders. Replace with a real provider for live plates.
      return {
        vin: "WBA3A5C50CF256920",
        status: { enabled: true, name: "Demo data", note: "Sample plate lookup." },
      };
    }
    return {
      vin: null,
      status: {
        enabled: false,
        name: "Plate lookup",
        note: "Set PLATE_API_KEY in .env.local to search by car number (e.g. CarsXE platedecoder / Auto.dev).",
      },
    };
  }

  try {
    // EXAMPLE wiring for CarsXE platedecoder. Adjust URL + field path per provider.
    const url =
      `https://api.carsxe.com/platedecoder?key=${key}` +
      `&plate=${encodeURIComponent(plate)}&state=${encodeURIComponent(region)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`plate upstream ${res.status}`);
    const data: any = await res.json();

    // CarsXE returns the VIN at data.vin (some providers nest it differently).
    const vin: string | null = data?.vin ?? data?.input?.vin ?? null;
    if (!vin) throw new Error("no VIN found for that plate/region");

    return { vin, status: { enabled: true, name: "CarsXE", note: "Live data" } };
  } catch (err) {
    return {
      vin: null,
      status: {
        enabled: false,
        name: "Plate lookup",
        note: `Lookup failed: ${(err as Error).message}`,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// DEMO MODE
// ---------------------------------------------------------------------------
// Set DEMO_MODE=true in .env.local to return realistic SAMPLE data for the
// paid features (owner history, KM history, plate->VIN) WITHOUT any provider
// key — handy for checking the UI/flow before you buy real data.
const DEMO = () => process.env.DEMO_MODE === "true";

function demoOwnership() {
  const records: OwnershipRecord[] = [
    { ownerNumber: 1, type: "Personal", region: "CA", purchasedDate: "2012-04-18", estimatedLengthOfOwnership: "4 yrs 2 mo" },
    { ownerNumber: 2, type: "Personal", region: "NV", purchasedDate: "2016-06-30", estimatedLengthOfOwnership: "3 yrs 8 mo" },
    { ownerNumber: 3, type: "Lease", region: "AZ", purchasedDate: "2020-02-11", estimatedLengthOfOwnership: "ongoing" },
  ];
  return {
    status: { enabled: true, name: "Demo data", note: "Sample data — set HISTORY_API_KEY for real records." },
    records,
    ownerCount: records.length,
  };
}

function demoOdometer() {
  const readings: OdometerReading[] = [
    { date: "2012-05-01", kilometers: 120, source: "Registration" },
    { date: "2013-08-12", kilometers: 21500, source: "Service" },
    { date: "2015-03-22", kilometers: 54300, source: "Inspection" },
    { date: "2017-07-09", kilometers: 91200, source: "Service" },
    { date: "2019-11-30", kilometers: 128400, source: "Service" },
    { date: "2022-06-15", kilometers: 167900, source: "Inspection" },
  ];
  return {
    status: { enabled: true, name: "Demo data", note: "Sample data — set HISTORY_API_KEY for real readings." },
    readings,
    lastKnownKm: readings[readings.length - 1].kilometers,
  };
}

// ---------------------------------------------------------------------------
// Vehicle photos
// ---------------------------------------------------------------------------
// carimagery.com is a free, no-key image API. It returns a single best-match
// image URL for a text search like "2020 Toyota Camry". We also build an
// imagin.studio CDN URL if you provide a customer key (sharper studio renders).

export async function getImages(specs: VehicleSpecs): Promise<string[]> {
  const term = [specs.modelYear, specs.make, specs.model]
    .filter(Boolean)
    .join(" ");
  if (!term) return [];

  const images: string[] = [];

  // 1) Optional: imagin.studio studio renders (set IMAGIN_CUSTOMER in env).
  const imaginCustomer = process.env.IMAGIN_CUSTOMER;
  if (imaginCustomer && specs.make) {
    const angles = ["01", "09", "23"];
    for (const angle of angles) {
      const u = new URL("https://cdn.imagin.studio/getImage");
      u.searchParams.set("customer", imaginCustomer);
      u.searchParams.set("make", specs.make.toLowerCase());
      if (specs.model) u.searchParams.set("modelFamily", specs.model.toLowerCase());
      if (specs.modelYear) u.searchParams.set("modelYear", specs.modelYear);
      u.searchParams.set("angle", angle);
      images.push(u.toString());
    }
  }

  // 2) Free fallback: carimagery.com (no key required).
  try {
    const res = await fetch(
      `https://www.carimagery.com/api.asmx/GetImageUrl?searchTerm=${encodeURIComponent(term)}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (res.ok) {
      const xml = await res.text();
      // Response is <string ...>http://...jpg</string>
      const match = xml.match(/>(https?:\/\/[^<]+)</i);
      if (match?.[1]) images.push(match[1]);
    }
  } catch {
    /* ignore — photos are best-effort */
  }

  return images;
}

// ---------------------------------------------------------------------------
// Ownership history (paid provider)
// ---------------------------------------------------------------------------

export async function getOwnership(vin: string): Promise<{
  status: ProviderStatus;
  records: OwnershipRecord[];
  ownerCount: number | null;
}> {
  const key = process.env.HISTORY_API_KEY;
  if (!key) {
    if (DEMO()) return demoOwnership();
    return {
      status: {
        enabled: false,
        name: "History provider",
        note: "Set HISTORY_API_KEY in .env.local to enable real ownership history (e.g. VinAudit / CarsXE).",
      },
      records: [],
      ownerCount: null,
    };
  }

  // EXAMPLE wiring for VinAudit-style JSON. Adjust the URL + field mapping to
  // match the exact provider you signed up with.
  try {
    const res = await fetch(
      `https://api.vinaudit.com/v2/specifications?key=${key}&vin=${encodeURIComponent(vin)}&include=ownership`,
      { next: { revalidate: 60 * 60 } }
    );
    if (!res.ok) throw new Error(`history upstream ${res.status}`);
    const data: any = await res.json();

    const owners: any[] = data?.ownership?.records ?? [];
    const records: OwnershipRecord[] = owners.map((o, i) => ({
      ownerNumber: o.ownerNumber ?? i + 1,
      type: o.type ?? "Unknown",
      region: o.region ?? o.state ?? null,
      purchasedDate: o.purchasedDate ?? null,
      estimatedLengthOfOwnership: o.lengthOfOwnership ?? null,
    }));

    return {
      status: { enabled: true, name: "VinAudit", note: "Live data" },
      records,
      ownerCount: data?.ownership?.ownerCount ?? (records.length || null),
    };
  } catch (err) {
    return {
      status: {
        enabled: false,
        name: "History provider",
        note: `Provider call failed: ${(err as Error).message}`,
      },
      records: [],
      ownerCount: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Odometer / KM history (paid provider)
// ---------------------------------------------------------------------------

export async function getOdometer(vin: string): Promise<{
  status: ProviderStatus;
  readings: OdometerReading[];
  lastKnownKm: number | null;
}> {
  const key = process.env.HISTORY_API_KEY;
  if (!key) {
    if (DEMO()) return demoOdometer();
    return {
      status: {
        enabled: false,
        name: "Odometer provider",
        note: "Set HISTORY_API_KEY in .env.local to enable real odometer / KM history.",
      },
      readings: [],
      lastKnownKm: null,
    };
  }

  try {
    const res = await fetch(
      `https://api.vinaudit.com/v2/history?key=${key}&vin=${encodeURIComponent(vin)}`,
      { next: { revalidate: 60 * 60 } }
    );
    if (!res.ok) throw new Error(`odometer upstream ${res.status}`);
    const data: any = await res.json();

    const raw: any[] = data?.titles?.[0]?.odometers ?? data?.odometers ?? [];
    const milesToKm = (n: number) => Math.round(n * 1.60934);
    const readings: OdometerReading[] = raw
      .map((o) => ({
        date: o.date ?? o.eventDate ?? "",
        // Many US providers report miles — convert to KM.
        kilometers: o.unit === "km" ? Number(o.value) : milesToKm(Number(o.value || 0)),
        source: o.source ?? null,
      }))
      .filter((o) => o.date && o.kilometers > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      status: { enabled: true, name: "VinAudit", note: "Live data" },
      readings,
      lastKnownKm: readings.at(-1)?.kilometers ?? null,
    };
  } catch (err) {
    return {
      status: {
        enabled: false,
        name: "Odometer provider",
        note: `Provider call failed: ${(err as Error).message}`,
      },
      readings: [],
      lastKnownKm: null,
    };
  }
}
