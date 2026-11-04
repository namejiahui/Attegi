import { Show, For, createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { Dialog } from "@kobalte/core/dialog";
import type { GhostSettings } from "../lib/ghost/types.js";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { t, getActiveLocale } from "../lib/i18n";

interface HeaderProps {
  settings?: GhostSettings;
}

export default function Header(props: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);
  const location = useLocation();
  const cur = () => getActiveLocale(location.pathname);
  const homeUrl = () => (cur().isRoot ? "/" : cur().prefix);
  const navItems = () => props.settings?.navigation || [];
  const resolveNavUrl = (url: string) => (!cur().isRoot && url === "/" ? cur().prefix : url);

  return (
    <header class="nav-header">
      <div class="nav-bar">
        <div class="nav-brand">
          <Show
            when={props.settings?.logo}
            fallback={
              <A class="wordmark" href={homeUrl()}>
                {props.settings?.title || "Attegi"}
              </A>
            }
          >
            <A class="logo" href={homeUrl()} title={t("Home")}>
              <img src={props.settings!.logo!} alt={props.settings?.title || "Logo"} />
            </A>
          </Show>
        </div>

        <nav class="site-nav" aria-label={t("Main")}>
          <ul>
            <For each={navItems()}>
              {(item) => {
                const slug = item.label.toLowerCase().replace(/[^a-z0-9]/g, "");
                return (
                  <li class={`nav-${slug}`}>
                    <A href={resolveNavUrl(item.url)}>
                      <span>{t(item.label)}</span>
                    </A>
                  </li>
                );
              }}
            </For>
          </ul>
        </nav>

        <div class="nav-actions">
          <LanguageSwitcher />
          <ThemeToggle />
          <a class="nav-search" href="#search" role="button" aria-label={t("Search")}>
            <i class="icon icon-search" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </i>
          </a>
          <button
            type="button"
            class="nav-menu"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t("Menu")}
            aria-expanded={isMobileMenuOpen()}
          >
            {t("Menu")}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer (Kobalte Dialog) */}
      <Dialog open={isMobileMenuOpen()} onOpenChange={setIsMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Content
            class={`site-menu ${isMobileMenuOpen() ? "is-open" : ""}`}
          >
            <div class="site-menu-bar">
              <Dialog.CloseButton class="site-menu-close" aria-label={t("Close")}>
                <i class="icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </i>
              </Dialog.CloseButton>
            </div>
            <nav class="site-menu-nav" aria-label={t("Main")}>
              <ul>
                <For each={navItems()}>
                  {(item) => (
                    <li>
                      <A href={resolveNavUrl(item.url)} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>{t(item.label)}</span>
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
            <div class="site-menu-members">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </header>
  );
}
