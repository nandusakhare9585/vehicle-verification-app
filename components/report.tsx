import type {
  Complaint,
  HealthSummary,
  OdometerReading,
  OwnershipRecord,
  ProviderStatus,
  Recall,
  VehicleSpecs,
} from "@/lib/types";

// --- small building blocks ------------------------------------------------

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ProviderNotice({ status }: { status: ProviderStatus }) {
  if (status.enabled) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      🔒 <span className="font-medium">{status.name} not configured.</span>{" "}
      {status.note}
    </div>
  );
}

// --- specs -----------------------------------------------------------------

export function SpecsGrid({ specs }: { specs: VehicleSpecs }) {
  const rows: [string, string | null][] = [
    ["VIN", specs.vin],
    ["Make", specs.make],
    ["Model", specs.model],
    ["Year", specs.modelYear],
    ["Trim / Series", specs.trim],
    ["Body", specs.bodyClass],
    ["Vehicle type", specs.vehicleType],
    ["Drive type", specs.driveType],
    ["Fuel", specs.fuelType],
    ["Engine", specs.displacementL ? `${specs.displacementL} L` : null],
    ["Cylinders", specs.engineCylinders],
    ["Transmission", specs.transmission],
    ["Doors", specs.doors],
    ["Manufacturer", specs.manufacturer],
    ["Built in", specs.plantCountry],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-right text-sm font-medium">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// --- health ----------------------------------------------------------------

const RATING_COLORS: Record<HealthSummary["rating"], string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-lime-500",
  Fair: "bg-amber-500",
  Poor: "bg-red-500",
};

export function HealthCard({ health }: { health: HealthSummary }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${health.score}, 100`}
            strokeLinecap="round"
            className={
              health.score >= 85
                ? "text-emerald-500"
                : health.score >= 65
                ? "text-lime-500"
                : health.score >= 40
                ? "text-amber-500"
                : "text-red-500"
            }
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold">{health.score}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">score</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium text-white ${RATING_COLORS[health.rating]}`}>
            {health.rating}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Recalls" value={health.recallCount} danger={health.recallCount > 0} />
          <Stat label="Open recalls" value={health.openRecalls} danger={health.openRecalls > 0} />
          <Stat label="Complaints" value={health.complaintCount} danger={health.complaintCount > 5} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className={`text-2xl font-bold ${danger ? "text-red-600" : "text-slate-800"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// --- recalls & complaints --------------------------------------------------

export function RecallsList({ recalls }: { recalls: Recall[] }) {
  if (recalls.length === 0)
    return <p className="text-sm text-emerald-600">✓ No recalls found for this make/model/year.</p>;
  return (
    <ul className="space-y-3">
      {recalls.map((r) => (
        <li key={r.campaignNumber} className="rounded-lg border border-red-100 bg-red-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-red-700">{r.component}</span>
            <span className="text-xs text-slate-400">{r.campaignNumber}</span>
          </div>
          {r.summary && <p className="mt-1 text-sm text-slate-700">{r.summary}</p>}
          {r.remedy && <p className="mt-2 text-sm text-slate-500"><span className="font-medium">Remedy:</span> {r.remedy}</p>}
        </li>
      ))}
    </ul>
  );
}

export function ComplaintsList({ complaints }: { complaints: Complaint[] }) {
  if (complaints.length === 0)
    return <p className="text-sm text-emerald-600">✓ No complaints reported.</p>;
  return (
    <ul className="space-y-3">
      {complaints.slice(0, 25).map((c) => (
        <li key={String(c.odiNumber)} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{c.component}</span>
            {c.crash && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">crash</span>}
            {c.fire && <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">fire</span>}
            {c.injured > 0 && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{c.injured} injured</span>}
          </div>
          {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}
        </li>
      ))}
    </ul>
  );
}

// --- ownership -------------------------------------------------------------

export function OwnershipPanel({
  status,
  records,
  ownerCount,
}: {
  status: ProviderStatus;
  records: OwnershipRecord[];
  ownerCount: number | null;
}) {
  if (!status.enabled) return <ProviderNotice status={status} />;
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        Estimated owners:{" "}
        <span className="font-semibold text-slate-900">{ownerCount ?? "—"}</span>
      </p>
      <ol className="space-y-2">
        {records.map((o) => (
          <li key={o.ownerNumber} className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm">
            <span className="font-medium">Owner #{o.ownerNumber} · {o.type}</span>
            <span className="text-slate-500">
              {[o.region, o.purchasedDate, o.estimatedLengthOfOwnership].filter(Boolean).join(" · ") || "—"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// --- odometer / KM ---------------------------------------------------------

export function OdometerPanel({
  status,
  readings,
  lastKnownKm,
}: {
  status: ProviderStatus;
  readings: OdometerReading[];
  lastKnownKm: number | null;
}) {
  if (!status.enabled) return <ProviderNotice status={status} />;
  if (readings.length === 0)
    return <p className="text-sm text-slate-500">No odometer readings available.</p>;

  const max = Math.max(...readings.map((r) => r.kilometers));
  const min = Math.min(...readings.map((r) => r.kilometers));
  const w = 600;
  const h = 160;
  const pad = 10;
  const points = readings.map((r, i) => {
    const x = pad + (i / Math.max(1, readings.length - 1)) * (w - pad * 2);
    const y = h - pad - ((r.kilometers - min) / Math.max(1, max - min)) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        Last known reading:{" "}
        <span className="font-semibold text-slate-900">
          {lastKnownKm ? `${lastKnownKm.toLocaleString()} km` : "—"}
        </span>
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-lg bg-slate-50">
        <polyline points={points.join(" ")} fill="none" stroke="#2563eb" strokeWidth="2" />
        {points.map((p, i) => {
          const [x, y] = p.split(",");
          return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
        })}
      </svg>
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {readings.map((r, i) => (
          <li key={i} className="flex justify-between py-2">
            <span className="text-slate-500">{r.date}{r.source ? ` · ${r.source}` : ""}</span>
            <span className="font-medium">{r.kilometers.toLocaleString()} km</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- photo gallery ---------------------------------------------------------

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0)
    return <p className="text-sm text-slate-500">No photos available for this vehicle.</p>;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={`${alt} photo ${i + 1}`}
          className="h-44 w-full rounded-lg border border-slate-200 bg-white object-contain"
          loading="lazy"
        />
      ))}
    </div>
  );
}
