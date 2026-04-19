export default function Footer() {
  return (
    <footer
      aria-label="Flashback Labs site footer"
      className="relative w-full min-h-[50vh] bg-paper border-t border-hairline"
    >
      {/* hairline dot grid — matches engineering-drawing texture on the rest of the site */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-grid-hairline opacity-[0.4]"
      />
      {/* faint hotrod hairline along the top — a thread of brand color */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 h-px w-40 bg-hotrod"
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10 py-14 md:py-16 flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
        {/* Left (desktop) / top (mobile) — Hydrogen wordmark */}
        <div
          className="w-full md:w-[55%] md:shrink-0"
          style={{ containerType: "inline-size" }}
        >
          <span
            className="block text-ink leading-none whitespace-nowrap text-center md:text-left"
            style={{
              fontFamily: "var(--font-hydrogen), sans-serif",
              fontSize: "clamp(2rem, 14cqw, 9rem)",
            }}
          >
            flashbacklabs
          </span>
        </div>

        {/* Right (desktop) / bottom (mobile) — content */}
        <div className="w-full md:flex-1 flex flex-col min-w-0">
          <p className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-steel text-center md:text-left">
            § FLASHBACK LABS
          </p>
          <div className="border-t border-hairline my-5 w-full max-w-lg mx-auto md:mx-0 md:max-w-none" />

          {/* Link grid — 2 columns, left on desktop, stacks+centers on mobile */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 justify-center md:justify-start items-center sm:items-start">
            <div className="text-center sm:text-left">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-steel mb-3">
                Product
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "Get Flashback AI", href: "#" },
                  { label: "How it works",     href: "#" },
                  { label: "Principles",       href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="font-mono text-[11px] tracking-widest text-ink-soft hover:text-ink transition-colors duration-220"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-steel mb-3">
                Company
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "About",   href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Press",   href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="font-mono text-[11px] tracking-widest text-ink-soft hover:text-ink transition-colors duration-220"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center justify-center md:justify-start gap-6 mt-10">
            <a
              href="#"
              aria-label="Flashback Labs on X (Twitter)"
              className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-steel hover:text-ink transition-colors duration-220"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.265 5.638 5.9-5.638Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </a>
            <a
              href="#"
              aria-label="Flashback Labs on LinkedIn"
              className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-steel hover:text-ink transition-colors duration-220"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          {/* Bottom row */}
          <div className="mt-12 pt-5 border-t border-hairline flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
            <p className="font-mono text-[10px] tracking-[0.15em] text-steel">
              © 2026 Flashback Labs
            </p>
            <a
              href="mailto:contact@flashbacklabs.com"
              className="font-mono text-[10px] tracking-[0.15em] text-steel hover:text-ink transition-colors duration-220"
            >
              contact@flashbacklabs.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
