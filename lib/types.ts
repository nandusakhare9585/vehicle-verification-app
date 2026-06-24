// Shared types for the whole app. The API route returns a `VehicleReport`.

export interface VehicleSpecs {
  vin: string;
  make: string | null;
  model: string | null;
  modelYear: string | null;
  trim: string | null;
  bodyClass: string | null;
  vehicleType: string | null;
  driveType: string | null;
  fuelType: string | null;
  engineCylinders: string | null;
  displacementL: string | null;
  transmission: string | null;
  doors: string | null;
  plantCountry: string | null;
  manufacturer: string | null;
}

export interface Recall {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportedDate: string | null;
}

export interface Complaint {
  odiNumber: string | number;
  component: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  injured: number;
  dateOfIncident: string | null;
}

// Owner + odometer/KM history come from a PAID provider (see lib/providers.ts).
export interface OwnershipRecord {
  ownerNumber: number;
  type: string; // e.g. "Personal", "Commercial", "Lease"
  region: string | null;
  purchasedDate: string | null;
  estimatedLengthOfOwnership: string | null;
}

export interface OdometerReading {
  date: string;
  kilometers: number;
  source: string | null; // e.g. "Service", "Registration", "Inspection"
}

export interface HealthSummary {
  recallCount: number;
  complaintCount: number;
  openRecalls: number;
  // simple 0-100 score: 100 = clean, lowered by recalls/complaints
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
}

export interface ProviderStatus {
  enabled: boolean;
  name: string;
  note: string;
}

export interface VehicleReport {
  specs: VehicleSpecs;
  health: HealthSummary;
  recalls: Recall[];
  complaints: Complaint[];
  ownership: {
    status: ProviderStatus;
    records: OwnershipRecord[];
    ownerCount: number | null;
  };
  odometer: {
    status: ProviderStatus;
    readings: OdometerReading[];
    lastKnownKm: number | null;
  };
  images: string[];
  fetchedAt: string;
}
