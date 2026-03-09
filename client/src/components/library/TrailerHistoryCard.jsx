import { memo } from 'react';
import { Play } from 'lucide-react';
import { formatDate } from '../../utils/date';

const formatTime = (ts) => {
  return formatDate(ts);
};

const TrailerHistoryCard = memo(({ title, thumbnail, timestamp, onPlay }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <button type="button" onClick={onPlay} className="block w-full text-left">
        <div className="relative aspect-video w-full bg-white/5">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="glass-soft inline-flex h-12 w-12 items-center justify-center rounded-full text-white/90 transition group-hover:scale-105">
              <Play className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="space-y-1 px-3 pb-3 pt-2">
          <p className="line-clamp-2 text-sm font-semibold text-white/90">{title}</p>
          <p className="text-xs text-white/60">{formatTime(timestamp)}</p>
        </div>
      </button>
    </div>
  );
});

TrailerHistoryCard.displayName = 'TrailerHistoryCard';

export default TrailerHistoryCard;

