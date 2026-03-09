import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const GenreFilter = memo(({ value, genres, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const label = useMemo(() => {
    if (value == null) return 'All genres';
    const match = (genres ?? []).find((g) => Number(g.id) === Number(value));
    return match?.name ?? 'All genres';
  }, [value, genres]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (genreId) => {
    const parsed =
      genreId == null || genreId === ''
        ? null
        : typeof genreId === 'number'
        ? genreId
        : Number(genreId);

    onChange(parsed);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={[
          'flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-semibold',
          'glass-soft text-white/90',
          'border border-white/10 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="max-w-[85%] truncate text-left">{label}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-2 max-h-64 w-60 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/90 p-1 text-sm shadow-xl backdrop-blur"
          role="listbox"
          onWheel={(e) => {
            const target = e.currentTarget;
            if (target.scrollHeight > target.clientHeight) {
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            className={[
              'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-white/80',
              !value ? 'bg-white/10 text-white' : 'hover:bg-white/5',
            ].join(' ')}
            onClick={() => handleSelect(null)}
          >
            All genres
          </button>
          {(genres ?? []).map((g) => {
            const isActive = value != null && Number(value) === Number(g.id);
            return (
              <button
                key={g.id}
                type="button"
                className={[
                  'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-white/80',
                  isActive ? 'bg-[color:var(--color-accent)]/80 text-black' : 'hover:bg-white/5',
                ].join(' ')}
                onClick={() => handleSelect(g.id)}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

GenreFilter.displayName = 'GenreFilter';

export default GenreFilter;

