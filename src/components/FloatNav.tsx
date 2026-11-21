import { Show, For, onSettled } from "solid-js";
import { useLocation } from "@solidjs/router";
import { t, getLocales, getActiveLocale, resolveTargetUrl } from "../lib/i18n";
import type { GhostSettings } from "../lib/ghost/types";

interface FloatNavProps {
  settings?: GhostSettings;
}

export default function FloatNav(props: FloatNavProps) {
  const location = useLocation();
  const currentLocale = () => getActiveLocale(location.pathname);
  const homeUrl = () => (currentLocale().isRoot ? "/" : currentLocale().prefix);
  const navItems = () => props.settings?.navigation || [];
  const locales = () => getLocales();

  const resolveNavUrl = (url: string) =>
    !currentLocale().isRoot && url === "/" ? currentLocale().prefix : url;

  const isActive = (url: string) => {
    const cur = location.pathname.replace(/\/$/, "");
    const target = resolveNavUrl(url).replace(/\/$/, "");
    return cur === target;
  };

  onSettled(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const isOffscreen = window.scrollY > 80;
      document.documentElement.classList.toggle("nav-offscreen", isOffscreen);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const panel = document.getElementById("float-nav-panel");
    const handlePanelClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button")) {
        (panel as any)?.hidePopover?.();
      }
    };
    panel?.addEventListener("click", handlePanelClick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      panel?.removeEventListener("click", handlePanelClick);
      document.documentElement.classList.remove("nav-offscreen");
    };
  });

  return (
    <div class="float-nav">
      <button
        type="button"
        class="float-nav-trigger"
        popovertarget="float-nav-panel"
        aria-label={t("Menu") || "菜单"}
      >
        <span class="float-nav-icon" aria-hidden="true">
          <span></span>
          <span></span>
        </span>
      </button>
      <div class="float-nav-panel" id="float-nav-panel" popover="auto">
        <a class="float-nav-home" href={homeUrl()}>
          <Show when={props.settings?.icon}>
            <img src={props.settings!.icon!} alt="" width="24" height="24" />
          </Show>
          <span>{props.settings?.title || "Home"}</span>
        </a>
        <nav class="float-nav-links" aria-label={t("Main") || "主导航"}>
          <ul>
            <For each={navItems()}>
              {(item) => (
                <li class={isActive(item.url) ? "active" : ""}>
                  <a href={resolveNavUrl(item.url)}>{item.label}</a>
                </li>
              )}
            </For>
          </ul>
        </nav>
        <div class="float-nav-footer">
          <div class="float-nav-lang">
            <span class="float-nav-lang-label">
              <svg
                class="icon icon-globe"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              {t("Language")}
            </span>
            <div class="float-nav-lang-pills">
              <For each={locales()}>
                {(loc) => (
                  <a
                    href={resolveTargetUrl(loc, location.pathname)}
                    class={`float-nav-lang-pill ${
                      currentLocale().code === loc.code ? "active" : ""
                    }`}
                  >
                    {loc.name}
                  </a>
                )}
              </For>
            </div>
          </div>
          <a class="float-nav-search" href="#search" role="button" data-ghost-search>
            <svg
              class="icon icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {t("Search")}
          </a>
        </div>
      </div>
    </div>
  );
}
