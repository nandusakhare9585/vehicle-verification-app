import SearchForm from "@/components/SearchForm";

const FEATURES = [
  { icon: "🔧", title: "Vehicle specs", desc: "Make, model, year, engine, drivetrain & more, decoded from the VIN." },
  { icon: "🩺", title: "Health & issues", desc: "Real safety recalls and owner-reported complaints from NHTSA." },
  { icon: "📈", title: "KM / odometer history", desc: "Mileage timeline over the vehicle's life (provider key required)." },
  { icon: "👤", title: "Owner history", desc: "Number of owners and ownership types (provider key required)." },
  { icon: "🖼️", title: "Photos", desc: "Representative images of the make/model/year." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Know a car before you trust it
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Enter a VIN to pull together its specs, health/issue history, ownership,
          kilometre history and photos — all from live APIs.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchForm />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
