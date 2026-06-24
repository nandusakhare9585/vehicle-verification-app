import { NextResponse } from "next/server";
import { plateToVin } from "@/lib/providers";

export const dynamic = "force-dynamic";

// GET /api/plate?plate=ABC123&region=CA  ->  { vin } or { error }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plate = (searchParams.get("plate") || "").trim();
  const region = (searchParams.get("region") || "").trim();

  if (!plate) {
    return NextResponse.json({ error: "Missing plate / car number." }, { status: 400 });
  }

  const result = await plateToVin(plate, region);

  if (!result.vin) {
    // 501 when the provider isn't configured, 404 when it just found nothing.
    const code = result.status.enabled ? 404 : 501;
    return NextResponse.json({ error: result.status.note }, { status: code });
  }

  return NextResponse.json({ vin: result.vin });
}
