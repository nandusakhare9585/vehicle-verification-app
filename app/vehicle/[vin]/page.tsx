import Link from "next/link";
import { notFound } from "next/navigation";
import {
  decodeVin,
  getComplaints,
  getRecalls,
  summarizeHealth,
} from "@/lib/nhtsa";
import { getImages, getOdometer, getOwnership } from "@/lib/providers";
import { isValidVin } from "@/lib/vin";
import {
  ComplaintsList,
  Gallery,
  HealthCard,
  OdometerPanel,
  OwnershipPanel,
  RecallsList,
  Section,
  SpecsGrid,
} from "@/components/report";
import type { VehicleReport } from "@/lib/types";

export const dynamic = "force-dynamic";

async function buildReport(vin: string): Promise<VehicleReport> {
  const specs = await decodeVin(vin);
  const [recalls, complaints, images, ownership, odometer] = await Promise.all([
    getRecalls(specs.make, specs.model, specs.modelYear),
    getComplaints(specs.make, specs.model, specs.modelYear),
    getImages(specs),
    getOwnership(vin),
    getOdometer(vin),
  ]);
  return {
    specs,
    health: summarizeHealth(recalls, complaints),
    recalls,
    complaints,
    ownership,
    odometer,
    images,
    fetchedAt: new Date().toISOString(),
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin: rawVin } = await params;
  const vin = decodeURIComponent(rawVin).toUpperCase();
  if (!isValidVin(vin)) notFound();

  const report = await buildReport(vin);
  const title = [
    report.specs.modelYear,
    report.specs.make,
    report.specs.model,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown vehicle";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          ← New search
        </Link>
        <span className="text-xs text-slate-400">
          Fetched {new Date(report.fetchedAt).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="font-mono text-sm text-slate-500">{report.specs.vin}</p>
      </div>

      <Section title="Health & issues" subtitle="From NHTSA recalls + owner complaints">
        <HealthCard health={report.health} />
      </Section>

      <Section title="Photos">
        <Gallery images={report.images} alt={title} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Specifications" subtitle="Decoded from the VIN (NHTSA vPIC)">
          <SpecsGrid specs={report.specs} />
        </Section>

        <div className="flex flex-col gap-6">
          <Section title="Owner history">
            <OwnershipPanel
              status={report.ownership.status}
              records={report.ownership.records}
              ownerCount={report.ownership.ownerCount}
            />
          </Section>

          <Section title="KM / odometer history">
            <OdometerPanel
              status={report.odometer.status}
              readings={report.odometer.readings}
              lastKnownKm={report.odometer.lastKnownKm}
            />
          </Section>
        </div>
      </div>

      <Section
        title={`Recalls (${report.recalls.length})`}
        subtitle="Official safety recalls for this make/model/year"
      >
        <RecallsList recalls={report.recalls} />
      </Section>

      <Section
        title={`Complaints (${report.complaints.length})`}
        subtitle="Issues reported by owners to NHTSA"
      >
        <ComplaintsList complaints={report.complaints} />
      </Section>
    </div>
  );
}
