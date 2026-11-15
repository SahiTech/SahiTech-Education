export default function PlatformLoading() {
  return (
    <div className="min-h-screen bg-[#f4f6f4] p-4 sm:p-7" aria-label="Loading Global Owner Console" aria-busy="true">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-emerald-950/15" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
