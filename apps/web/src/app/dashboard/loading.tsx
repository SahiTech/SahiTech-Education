export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-7 space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8" aria-label="Loading dashboard" aria-busy="true">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </main>
    </div>
  );
}
