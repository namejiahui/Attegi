import { For, Show } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import {
  changeLocale,
  t,
  getLocales,
  getActiveLocale,
  resolveTargetUrl,
  type LocaleItem,
} from "../lib/i18n";

export default function LanguageSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const locales = () => getLocales();

  const currentLocale = () => getActiveLocale(location.pathname, locales());

  const handleSelect = (item: LocaleItem) => {
    const cur = currentLocale();
    if (item.code === cur.code) return;

    changeLocale(item.code);
    const targetUrl = resolveTargetUrl(item, location.pathname, locales());
    const queryAndHash = location.search + location.hash;
    navigate(`${targetUrl}${queryAndHash}`);
  };

  return (
    <div class="lang-selector">
      <DropdownMenu placement="bottom-end" gutter={8}>
        <DropdownMenu.Trigger
          class="lang-trigger"
          aria-label={t("Language") || "语言选择"}
        >
          <i class="icon icon-globe" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </i>
          <span class="lang-current-label">{currentLocale().name}</span>
          <i class="icon icon-chevron" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </i>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content class="lang-popover">
            <div class="lang-menu">
              <For each={locales()}>
                {(item) => {
                  const isActive = () => item.code === currentLocale().code;
                  return (
                    <DropdownMenu.Item
                      class={`lang-menu-item ${isActive() ? "is-active" : ""}`}
                      onSelect={() => handleSelect(item)}
                      onClick={() => handleSelect(item)}
                    >
                      <span>{item.name}</span>
                      <Show when={isActive()}>
                        <i class="icon icon-check" aria-hidden="true">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </i>
                      </Show>
                    </DropdownMenu.Item>
                  );
                }}
              </For>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
    </div>
  );
}
