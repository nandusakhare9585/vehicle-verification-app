import { NextResponse } from "next/server";
import {
  decodeVin,
  getComplaints,
  getRecalls,
  summarizeHealth,
} from "@/lib/nhtsa";
import { getImages, getOdometer, getOwnership } from "@/lib/providers";
import { isValidVin } from "@/lib/vin";
import type { VehicleReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: rawVin } = await params;
  const vin = decodeURIComponent(rawVin || "").trim();

  if (!isValidVin(vin)) {
    return NextResponse.json(
      { error: "Invalid VIN. Expected 17 characters (letters/numbers, no I, O, Q)." },
      { status: 400 }
    );
  }

  try {
    // 1) Decode the VIN first — recalls/complaints/photos all depend on it.
    const specs = await decodeVin(vin);

    // 2) Fan out the remaining lookups in parallel.
    const [recalls, complaints, images, ownership, odometer] = await Promise.all([
      getRecalls(specs.make, specs.model, specs.modelYear),
      getComplaints(specs.make, specs.model, specs.modelYear),
      getImages(specs),
      getOwnership(vin),
      getOdometer(vin),
    ]);

    const report: VehicleReport = {
      specs,
      health: summarizeHealth(recalls, complaints),
      recalls,
      complaints,
      ownership,
      odometer,
      images,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: `Lookup failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
