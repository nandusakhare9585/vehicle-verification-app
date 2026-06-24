"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidVin, SAMPLE_VINS } from "@/lib/vin";

type Mode = "vin" | "plate";

export default function SearchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("vin");

  // VIN state
  const [vin, setVin] = useState("");

  // Plate / car number state
  const [plate, setPlate] = useState("");
  const [region, setRegion] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submitVin(value: string) {
    const v = value.trim().toUpperCase();
    if (!isValidVin(v)) {
      setError("Please enter a valid 17-character VIN.");
      return;
    }
    setError(null);
    router.push(`/vehicle/${v}`);
  }

  async function submitPlate() {
    const p = plate.trim();
    if (!p) {
      setError("Please enter a car number / plate.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/plate?plate=${encodeURIComponent(p)}&region=${encodeURIComponent(region)}`
      );
      const data = await res.json();
      if (!res.ok || !data.vin) {
        setError(data.error || "Could not find a vehicle for that car number.");
        return;
      }
      router.push(`/vehicle/${data.vin}`);
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabClasses = (active: boolean) =>
    `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div className="w-full">
      {/* mode switcher */}
      <div className="mb-4 flex gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("vin");
            setError(null);
          }}
          className={tabClasses(mode === "vin")}
        >
          🔑 By VIN
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("plate");
            setError(null);
          }}
          className={tabClasses(mode === "plate")}
        >
          🚘 By Car Number
        </button>
      </div>

      {mode === "vin" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitVin(vin);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter 17-character VIN (e.g. 1HGCM82633A004352)"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            maxLength={17}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700"
          >
            Look up
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitPlate();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Car number / plate (e.g. 7ABC123)"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            autoComplete="off"
            spellCheck={false}
          />
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value.toUpperCase())}
            placeholder="State / region (e.g. CA)"
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-44"
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Look up"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {mode === "vin" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Try:</span>
          {SAMPLE_VINS.filter((s) => isValidVin(s.vin)).map((s) => (
            <button
              key={s.vin}
              onClick={() => {
                setVin(s.vin);
                submitVin(s.vin);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:border-brand-400 hover:text-brand-600"
              title={s.label}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Car-number lookup resolves the plate to a VIN via a provider, then
          shows the full report. Requires a provider key (see README).
        </p>
      )}
    </div>
  );
}
