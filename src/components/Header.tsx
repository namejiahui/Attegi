import { Show, For } from "solid-js";
import { A } from "@solidjs/router";
import type { GhostSettings } from "../lib/ghost/types.js";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  settings?: GhostSettings;
}

export default function Header(props: HeaderProps) {
  const settings = () => props.settings;
  const navItems = () => settings()?.navigation || [{ label: "Home", url: "/" }];

  return (
    <header class="nav-header">
      <div class="nav-bar">
        <div class="nav-brand">
          <Show
            when={settings()?.logo}
            fallback={
              <A class="wordmark" href="/">
                {settings()?.title || "Attegi"}
              </A>
            }
          >
            <A class="logo" href="/" title="Home">
              <img src={settings()!.logo!} alt={settings()?.title || "Logo"} />
            </A>
          </Show>
        </div>

        <nav class="site-nav" aria-label="Main">
          <ul>
            <For each={navItems()}>
              {(item) => (
                <li>
                  <A href={item.url}>{item.label}</A>
                </li>
              )}
            </For>
          </ul>
        </nav>

        <div class="nav-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
