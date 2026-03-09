const Card = ({ label, value, sublabel, icon }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-4 text-sm text-white/90 backdrop-blur transition hover:bg-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/60">{label}</span>
          <span className="text-sm font-semibold">{value}</span>
        </div>
      </div>
      {sublabel && <span className="text-xs text-white/60">{sublabel}</span>}
    </div>
  );
};

const HeroRatings = ({ rating, popularity, videosCount, photosCount }) => {
  const imdbRating = rating ? Number(rating).toFixed(1) : null;

  return (
    <aside className="flex flex-col gap-3 rounded-2xl bg-black/35 p-3 ring-1 ring-white/10 backdrop-blur-md md:p-4">
      <Card
        label="IMDb Rating"
        value={imdbRating ? `${imdbRating} / 10` : 'N/A'}
        sublabel="⭐ Top rated"
        icon="⭐"
      />
      <Card
        label="Your Rating"
        value="Rate"
        sublabel="☆ Add your score"
        icon="☆"
      />
      <Card
        label="Popularity"
        value={popularity ? Math.round(popularity) : '—'}
        sublabel="🔥 Trending"
        icon="🔥"
      />
      <Card
        label="Videos"
        value={`${videosCount || 0} Videos`}
        icon="▶"
      />
      <Card
        label="Photos"
        value={`${photosCount > 99 ? '99+' : photosCount || 0} Photos`}
        icon="🖼"
      />
    </aside>
  );
};

export default HeroRatings;

