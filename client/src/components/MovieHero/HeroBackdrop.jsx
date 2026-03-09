const HeroBackdrop = ({ backdropUrl, parallaxOffset, blurAmount }) => {
  return (
    <>
      {backdropUrl && (
        <div
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{
            transform: `translateY(${parallaxOffset * -1}px) scale(1.03)`,
            filter: `blur(${blurAmount}px)`,
            transition: 'filter 200ms ease-out, transform 200ms ease-out',
          }}
        >
          <img
            src={backdropUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 hero-backdrop-gradient-x" />
      <div className="pointer-events-none absolute inset-0 hero-backdrop-gradient-y" />
    </>
  );
};

export default HeroBackdrop;

