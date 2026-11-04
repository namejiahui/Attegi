import { Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import type { GhostPost } from "../lib/ghost/types.js";
import { t, formatDate, formatIsoDateOnly, getActiveLocale } from "../lib/i18n";

interface PostNavProps {
  prevPost?: GhostPost | null;
  nextPost?: GhostPost | null;
  siteDescription?: string;
}

export default function PostNav(props: PostNavProps) {
  const location = useLocation();
  const cur = () => getActiveLocale(location.pathname);
  const prefix = () => (cur().isRoot ? "" : cur().prefix);
  const homeUrl = () => (prefix() || "/");
  const defaultExcerpt = () => props.siteDescription || "Thoughts, stories and ideas.";

  return (
    <aside class="post-nav">
      {/* Left side: Next (newer) post, or Return to Home */}
      <Show
        when={props.nextPost}
        fallback={
          <A class="post-nav-home" href={homeUrl()}>
            <section class="post-nav-teaser">
              <i class="icon icon-home" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </i>
              <h2 class="post-nav-title">{t("Return to Home")}</h2>
              <p class="post-nav-excerpt">{defaultExcerpt()}</p>
            </section>
          </A>
        }
      >
        <A class="post-nav-next" href={`${prefix()}/${props.nextPost!.slug}`}>
          <section class="post-nav-teaser">
            <i class="icon icon-arrow-left" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </i>
            <h2 class="post-nav-title">{props.nextPost!.title}</h2>
            <p class="post-nav-excerpt">{props.nextPost!.custom_excerpt || props.nextPost!.excerpt}</p>
            <p class="post-nav-meta">
              <time datetime={formatIsoDateOnly(props.nextPost!.published_at)}>
                {formatDate(props.nextPost!.published_at, "MMMM D, YYYY")}
              </time>
            </p>
          </section>
        </A>
      </Show>

      {/* Right side: Prev (older) post, or Return to Home */}
      <Show
        when={props.prevPost}
        fallback={
          <A class="post-nav-home" href={homeUrl()}>
            <section class="post-nav-teaser">
              <i class="icon icon-home" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </i>
              <h2 class="post-nav-title">{t("Return to Home")}</h2>
              <p class="post-nav-excerpt">{defaultExcerpt()}</p>
            </section>
          </A>
        }
      >
        <A class="post-nav-prev" href={`${prefix()}/${props.prevPost!.slug}`}>
          <section class="post-nav-teaser">
            <i class="icon icon-arrow-right" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </i>
            <h2 class="post-nav-title">{props.prevPost!.title}</h2>
            <p class="post-nav-excerpt">{props.prevPost!.custom_excerpt || props.prevPost!.excerpt}</p>
            <p class="post-nav-meta">
              <time datetime={formatIsoDateOnly(props.prevPost!.published_at)}>
                {formatDate(props.prevPost!.published_at, "MMMM D, YYYY")}
              </time>
            </p>
          </section>
        </A>
      </Show>

      <div class="clear" />
    </aside>
  );
}
