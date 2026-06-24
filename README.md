# 🚗 Car History Viewer

A Next.js (App Router) + React + Tailwind app that looks up a **VIN** and shows:

- **Vehicle specs** — make, model, year, engine, drivetrain, body, etc.
- **Health & issues** — a computed health score from real safety **recalls** and owner **complaints**
- **Owner history** — number of owners & ownership types
- **KM / odometer history** — mileage timeline with a chart
- **Photos** — representative images of the make/model/year

Everything is fetched from live APIs through server-side route handlers.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — app runs without keys
npm run dev
```

Open http://localhost:3000 and try a sample VIN (e.g. `1HGCM82633A004352`).

---

## How the data is sourced

| Data | Source | Key needed? |
|------|--------|-------------|
| VIN decode / specs | [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) | ❌ Free |
| Recalls | [NHTSA Recalls API](https://api.nhtsa.gov/) | ❌ Free |
| Complaints | [NHTSA Complaints API](https://api.nhtsa.gov/) | ❌ Free |
| Photos | [carimagery.com](https://www.carimagery.com/) (free) or imagin.studio | ❌ / optional |
| **Owner history** | VinAudit / CarsXE / ClearVIN | ✅ **Paid** |
| **Odometer (KM) history** | VinAudit / CarsXE / ClearVIN | ✅ **Paid** |

> Ownership & odometer records are **private data** — there is no free public API for
> them. The app ships with a clean adapter (`lib/providers.ts`); add `HISTORY_API_KEY`
> to `.env.local` and the Owner/KM sections light up automatically.

### Recommended providers for the paid parts

- **VinAudit** — https://www.vinaudit.com/ (US history + odometer, the adapter is pre-wired for this shape)
- **CarsXE** — https://api.carsxe.com/ (specs, history, images, plate lookups)
- **ClearVIN** — https://www.clearvin.com/ (full history reports)
- **Auto.dev** — https://www.auto.dev/ (listings, VIN, photos)

To switch providers, edit the `fetch` URL and field mapping inside
`getOwnership()` / `getOdometer()` in [`lib/providers.ts`](lib/providers.ts).

---

## Project structure

```
app/
  layout.tsx                  # shell, header/footer
  page.tsx                    # home + VIN search
  vehicle/[vin]/page.tsx      # full report (server component)
  vehicle/[vin]/loading.tsx   # skeleton while fetching
  api/vehicle/[vin]/route.ts  # JSON API endpoint (GET) returning a VehicleReport
components/
  SearchForm.tsx              # client-side VIN input + validation
  report.tsx                  # presentational sections (specs, health, charts…)
lib/
  nhtsa.ts                    # free NHTSA API client (specs, recalls, complaints)
  providers.ts                # paid history + photo adapters (env-key gated)
  types.ts                    # shared TypeScript types
  vin.ts                      # VIN validation + sample VINs
```

## The JSON API

There's also a real API endpoint you can call from anywhere:

```bash
curl http://localhost:3000/api/vehicle/1HGCM82633A004352
```

Returns the full `VehicleReport` (see `lib/types.ts`).

---

## Notes / caveats

- NHTSA recalls & complaints are matched by **make + model + year** (NHTSA does
  not expose them per-VIN), so they reflect the model, not the individual car.
- The health **score** is a simple heuristic (100 minus weighted penalties) —
  tune the weights in `summarizeHealth()` in `lib/nhtsa.ts`.
- NHTSA data is US-focused. For other regions, swap in a regional provider.
