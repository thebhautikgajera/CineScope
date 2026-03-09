import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-14 border-t border-white/10 pt-10">
      <div className="glass-soft rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-highlight shadow-[0_0_18px_color-mix(in_oklab,var(--color-highlight)_55%,transparent)]" />
              <span className="text-sm font-semibold tracking-tight text-white/95">CineScope</span>
            </div>
            <p className="max-w-md text-sm text-white/70">
              A premium, cinematic movie platform UI - built with glassmorphism, smooth motion, and production-grade architecture.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Quick links</p>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-white/80">
                <Link className="hover:text-white" to="/dashboard">
                  Dashboard
                </Link>
                <Link className="hover:text-white" to="/watchlist">
                  Watchlist
                </Link>
                <Link className="hover:text-white" to="/history">
                  History
                </Link>
                <Link className="hover:text-white" to="/profile">
                  Profile
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Social</p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  className="glass-soft inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/8 hover:text-white"
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  className="glass-soft inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/8 hover:text-white"
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  className="glass-soft inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/8 hover:text-white"
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CineScope. All rights reserved.</p>
          <p className="text-white/40">Built for a Netflix / Apple TV-grade experience.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

