import { createSignal, createEffect, onMount, onCleanup, Show, For } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { t } from "../lib/i18n";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentEl?: HTMLElement | null;
  html?: string;
}

function parseHeadingsFromHtml(html: string): TocItem[] {
  if (!html) return [];
  const headingRegex = /<h([23])(?:\s+[^>]*?)?(?:id="([^"]*)")?(?:\s+[^>]*?)?>(.*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  const stripTags = (str: string) => str.replace(/<[^>]+>/g, "").trim();

  while ((match = headingRegex.exec(html)) !== null) {
    idx++;
    const level = parseInt(match[1], 10);
    const existingId = match[2];
    const text = stripTags(match[3]);
    if (!text) continue;

    const id = existingId || text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "") || `section-${idx}`;
    items.push({ id, text, level });
  }

  return items;
}

export default function TableOfContents(props: TableOfContentsProps) {
  // Parse directly from HTML for instant SSR rendering
  const initialHeadings = props.html ? parseHeadingsFromHtml(props.html) : [];
  const [headings, setHeadings] = createSignal<TocItem[]>(initialHeadings);
  const [activeId, setActiveId] = createSignal<string>(initialHeadings[0]?.id || "");
  const [isSidebarVisible, setIsSidebarVisible] = createSignal(false);
  const [isTriggerVisible, setIsTriggerVisible] = createSignal(false);
  const [readingProgress, setReadingProgress] = createSignal(0);
  const [isMobileOpen, setIsMobileOpen] = createSignal(false);

  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66

  const syncHeadingDomIds = () => {
    if (typeof document === "undefined") return;
    const target = props.contentEl || document.querySelector<HTMLElement>(".post-content");
    if (!target) return;

    const elements = Array.from(target.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    if (elements.length < 2) return;

    // Ensure matching IDs on the DOM elements
    elements.forEach((el, idx) => {
      const currentList = headings();
      if (currentList[idx]) {
        el.id = currentList[idx].id;
      } else if (!el.id) {
        const slug = el.textContent
          ?.trim()
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/^-|-$/g, "");
        el.id = slug || `section-${idx + 1}`;
      }
    });

    document.documentElement.classList.add("has-toc");
  };

  createEffect(() => {
    if (props.html) {
      const items = parseHeadingsFromHtml(props.html);
      setHeadings(items);
      if (items.length > 0 && !activeId()) {
        setActiveId(items[0].id);
      }
    }
  });

  createEffect(() => {
    // Whenever contentEl or headings change, sync IDs to the DOM
    if (props.contentEl || headings().length > 0) {
      setTimeout(syncHeadingDomIds, 50);
    }
  });

  // Keep the active link centered in the desktop sidebar when scrolling
  createEffect(() => {
    const current = activeId();
    if (!current || typeof document === "undefined") return;

    const sidebar = document.querySelector<HTMLElement>(".toc-sidebar");
    const activeLink = sidebar?.querySelector<HTMLElement>(`.toc-link[href="#${current}"]`);
    if (sidebar && activeLink) {
      const sidebarRect = sidebar.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const linkTop = linkRect.top - sidebarRect.top + sidebar.scrollTop;
      const targetScroll = linkTop - sidebarRect.height / 2 + linkRect.height / 2;
      sidebar.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }
  });

  onMount(() => {
    syncHeadingDomIds();

    // Scroll spy using IntersectionObserver
    let observer: IntersectionObserver | null = null;
    const setupObserver = () => {
      const target = props.contentEl || document.querySelector<HTMLElement>(".post-content");
      if (!target) return;

      const elements = target.querySelectorAll("h2, h3");
      if (elements.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
              break;
            }
          }
        },
        {
          rootMargin: "-70px 0px -65% 0px",
          threshold: 0.1,
        }
      );

      elements.forEach((el) => observer?.observe(el));
    };

    setTimeout(setupObserver, 100);

    // Scroll listener for reading progress and visibility
    const handleScroll = () => {
      const target = props.contentEl || document.querySelector<HTMLElement>(".post-content");
      if (!target) return;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const rect = target.getBoundingClientRect();
      const contentTop = rect.top + scrollY;
      const contentHeight = target.offsetHeight;
      const contentBottom = contentTop + contentHeight;
      const windowHeight = window.innerHeight;

      // Desktop TOC sidebar visibility based on article reading boundary
      const showStart = contentTop - 100;
      const showEnd = contentBottom - windowHeight + 100;
      setIsSidebarVisible(scrollY >= showStart && scrollY <= showEnd);

      // Mobile floating trigger visibility (starts after 180px scroll)
      setIsTriggerVisible(scrollY > 180);

      // Compute reading progress
      const totalScrollable = contentHeight - windowHeight + 100;
      if (totalScrollable > 0) {
        const currentScroll = scrollY - contentTop + 100;
        const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    onCleanup(() => {
      observer?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("has-toc");
      }
    });
  });

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
      setIsMobileOpen(false);
    }
  };

  const strokeDashoffset = () => circumference * (1 - readingProgress());

  return (
    <Show when={headings().length >= 2}>
      {/* 1. Desktop TOC Sidebar */}
      <aside
        class={`toc-sidebar ${isSidebarVisible() ? "is-visible" : ""}`}
        aria-label={t("Table of Contents")}
      >
        <div class="toc-container">
          <div class="toc-header">
            <h3 class="toc-title">{t("On this page")}</h3>
          </div>
          <nav class="toc-list" aria-label={t("Table of Contents")}>
            <ol class="toc-list">
              <For each={headings()}>
                {(item) => (
                  <li class={`toc-item toc-item-h${item.level}`}>
                    <a
                      href={`#${item.id}`}
                      class={`toc-link node-name--H${item.level} ${
                        activeId() === item.id ? "is-active is-active-link" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToHeading(item.id);
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                )}
              </For>
            </ol>
          </nav>
        </div>
      </aside>

      {/* 2. Mobile TOC Trigger (Circular Reading Progress Button) */}
      <button
        type="button"
        class={`toc-mobile-trigger ${isTriggerVisible() ? "is-visible" : ""} ${
          isMobileOpen() ? "is-hidden" : ""
        }`}
        onClick={() => setIsMobileOpen(true)}
        aria-label={t("Open table of contents")}
        aria-expanded={isMobileOpen()}
        aria-haspopup="dialog"
      >
        <svg class="toc-progress-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="toc-progress-ring__bg" cx="22" cy="22" r={radius} />
          <circle
            class="toc-progress-ring__progress"
            cx="22"
            cy="22"
            r={radius}
            stroke-dasharray={`${circumference} ${circumference}`}
            stroke-dashoffset={strokeDashoffset()}
          />
        </svg>
        <svg
          class="toc-trigger-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      {/* 3. Mobile TOC Drawer (Kobalte Dialog) */}
      <Dialog open={isMobileOpen()} onOpenChange={setIsMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="toc-mobile-overlay" />
          <Dialog.Content class="toc-mobile-drawer">
            <div class="toc-mobile-header">
              <Dialog.Title class="toc-mobile-title" id="toc-mobile-title">
                {t("On this page")}
              </Dialog.Title>
              <Dialog.CloseButton
                class="toc-mobile-close"
                aria-label={t("Close table of contents")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Dialog.CloseButton>
            </div>
            <div class="toc-mobile-content">
              <nav class="toc-mobile-list" aria-label={t("Table of Contents")}>
                <ol class="toc-list">
                  <For each={headings()}>
                    {(item) => (
                      <li class={`toc-mobile-item toc-item-h${item.level}`}>
                        <a
                          href={`#${item.id}`}
                          class={`toc-mobile-link ${
                            activeId() === item.id ? "is-active is-active-link" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToHeading(item.id);
                          }}
                        >
                          {item.text}
                        </a>
                      </li>
                    )}
                  </For>
                </ol>
              </nav>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Show>
  );
}
