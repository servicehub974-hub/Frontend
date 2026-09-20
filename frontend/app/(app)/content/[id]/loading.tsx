export default function Loading() {
  return (
    <div className="mx-auto max-w-[1800px] px-4 py-4">
      <div className="lg:flex lg:gap-6">
        <div className="min-w-0 flex-1 lg:max-w-[calc(100%-424px)]">
          <div className="skeleton aspect-video w-full rounded-xl" />
          <div className="skeleton mt-4 h-6 w-3/4 rounded" />
          <div className="mt-4 flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton ml-auto h-9 w-24 rounded-full" />
          </div>
          <div className="skeleton mt-4 h-24 w-full rounded-xl" />
        </div>
        <div className="mt-6 hidden w-[400px] shrink-0 lg:mt-0 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-3 flex gap-2">
              <div className="skeleton aspect-video w-40 shrink-0 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton mt-2 h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
