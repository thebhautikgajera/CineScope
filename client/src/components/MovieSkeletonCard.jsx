const MovieSkeletonCard = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-56 w-full animate-pulse bg-slate-200" />
      <div className="space-y-2 px-3 py-3">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-2 h-7 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
};

export default MovieSkeletonCard;

