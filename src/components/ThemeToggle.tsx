import { onMount, createSignal } from "solid-js";

type ThemeMode = "system" | "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = createSignal<ThemeMode>("system");

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    if (typeof window === "undefined") return;

    const docEl = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = mode === "dark" || (mode === "system" && prefersDark);

    docEl.classList.remove("theme-dark", "theme-light", "theme-system");
    docEl.classList.add(dark ? "theme-dark" : "theme-light");
    if (mode === "system") {
      docEl.classList.add("theme-system");
    }

    const themeColorMeta = document.querySelectorAll('meta[name="theme-color"]');
    themeColorMeta.forEach((meta) => {
      meta.setAttribute("content", dark ? "#1D1F21" : "#FFFFFF");
    });

    try {
      localStorage.setItem("attegi_theme", mode);
    } catch {
      // ignore
    }
  };

  onMount(() => {
    try {
      const stored = localStorage.getItem("attegi_theme") as ThemeMode | null;
      if (stored === "dark" || stored === "light" || stored === "system") {
        setTheme(stored);
      }
    } catch {
      // ignore
    }
  });

  const cycleTheme = () => {
    const cur = theme();
    const next: ThemeMode = cur === "system" ? "dark" : cur === "dark" ? "light" : "system";
    applyTheme(next);
  };

  return (
    <button
      type="button"
      class="theme-toggle js-theme"
      onClick={cycleTheme}
      aria-label={`Toggle theme: ${theme()}`}
    >
      <i class="icon theme-icon-sun" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </i>
      <i class="icon theme-icon-moon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </i>
      <i class="icon theme-icon-monitor" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </i>
    </button>
  );
}
