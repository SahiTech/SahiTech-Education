export default function PortalsLoading() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading portal" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </main>
  );
}
