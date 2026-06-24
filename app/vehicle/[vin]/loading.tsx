export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
