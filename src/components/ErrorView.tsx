import { Show, For, onSettled, createMemo } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchHomeFeedData } from "../lib/server/ghost-data";
import { t, getLocales, getDefaultLocale, getActiveLocale, formatDate, formatIsoDateOnly } from "../lib/i18n";
import type { GhostPost } from "../lib/ghost/types";

interface ErrorViewProps {
  lang?: string;
  title?: string;
  description?: string;
}

export default function ErrorView(props: ErrorViewProps) {
  const location = useLocation();
  const currentLocale = () => {
    if (props.lang) {
      return getLocales().find((l) => l.code === props.lang) || getDefaultLocale();
    }
    return getActiveLocale(location.pathname);
  };
  const isRoot = () => currentLocale().isRoot;
  const prefix = () => (isRoot() ? "" : currentLocale().prefix);
  const homeUrl = () => (isRoot() ? "/" : currentLocale().prefix);

  const homeData = createMemo(() => fetchHomeFeedData(currentLocale().code, 1));
  const recentPosts = () => (homeData()?.posts || []).slice(0, 3);

  onSettled(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("is-error-page");
      return () => {
        document.documentElement.classList.remove("is-error-page");
      };
    }
  });

  const title = () => props.title || t("Page Not Found");
  const description = () =>
    props.description ||
    t("The page you're looking for has drifted into the void. Perhaps it was moved, deleted, or never existed in the first place.");

  const postUrl = (p: GhostPost) => `${prefix()}/${p.slug}/`;

  return (
    <>
      <Title>{`${title()} - ${homeData()?.settings?.title || "Attegi"}`}</Title>
      <div class="error-page">
        <div class="inner">
          <div class="error-content">
            {/* Creative 404 Illustration - Space Theme */}
            <div class="error-illustration" aria-hidden="true">
              <div class="error-number">
                <span class="digit digit-4">4</span>
                <span class="digit digit-0">
                  <span class="planet" />
                </span>
                <span class="digit digit-4">4</span>
              </div>
              <div class="stars">
                <div class="star" />
                <div class="star" />
                <div class="star" />
                <div class="star" />
                <div class="star" />
                <div class="star" />
                <div class="star" />
                <div class="star" />
              </div>
            </div>

            {/* Error Message Card */}
            <div class="error-card">
              <h1 class="error-title">{title()}</h1>
              <p class="error-description">{description()}</p>
              <a href={homeUrl()} class="error-button">
                <i class="icon icon-arrow-left" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </i>
                <span>{t("Return Home")}</span>
              </a>
            </div>

            {/* Recent Posts Recommendations */}
            <Show when={recentPosts().length > 0}>
              <div class="error-recommendations">
                <h2 class="recommendations-title">{t("Maybe try these instead")}</h2>
                <div class="recommendations-grid">
                  <For each={recentPosts()}>
                    {(post) => {
                      const firstTag = () => post.tags?.find((tagItem: { name: string }) => !tagItem.name.startsWith("#"));
                      return (
                        <article class="recommendation-card">
                          <a href={postUrl(post)} class="recommendation-link">
                            <Show when={post.feature_image}>
                              <div class="recommendation-image">
                                <img
                                  src={post.feature_image!}
                                  alt={post.feature_image_alt || post.title}
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                            </Show>
                            <div class="recommendation-content">
                              <Show when={firstTag()}>
                                <div class="recommendation-tags">
                                  <span class="recommendation-tag">{firstTag()!.name}</span>
                                </div>
                              </Show>
                              <h3 class="recommendation-title">{post.title}</h3>
                              <time
                                class="recommendation-date"
                                datetime={formatIsoDateOnly(post.published_at)}
                              >
                                {formatDate(post.published_at, "MMM DD, YYYY")}
                              </time>
                            </div>
                          </a>
                        </article>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}
