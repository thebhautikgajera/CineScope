import { getTrailerUnavailableMessage } from '../utils/fallbacks';

const TrailerModal = ({ isOpen, youtubeKey, onClose }) => {
  if (!isOpen) return null;

  const src = youtubeKey ? `https://www.youtube.com/embed/${youtubeKey}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-black/80"
          onClick={onClose}
        >
          Close
        </button>
        {src ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={src}
              title="Movie trailer"
              className="h-full w-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-slate-900 px-6 text-center text-sm text-slate-100">
            {getTrailerUnavailableMessage()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailerModal;

