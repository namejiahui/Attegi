import { Show, For, Suspense } from "solid-js";
import { A, createAsync, useLocation } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";
import { fetchTagsPageData } from "../lib/server/ghost-data";
import { t, formatDate, getLocales, getDefaultLocale, getActiveLocale } from "../lib/i18n";
import type { GhostTag, GhostPost } from "../lib/ghost/types";

interface TagsViewProps {
  lang?: string;
}

export default function TagsView(props: TagsViewProps) {
  const location = useLocation();
  const currentLocale = () => {
    if (props.lang) {
      return getLocales().find((l) => l.code === props.lang) || getDefaultLocale();
    }
    return getActiveLocale(location.pathname);
  };
  const isRoot = () => currentLocale().isRoot;
  const prefix = () => (isRoot() ? "" : currentLocale().prefix);

  const data = createAsync(() => fetchTagsPageData(currentLocale().code));
  const tags = () => data()?.tags || [];
  const posts = () => data()?.posts || [];
  const settings = () => data()?.settings;

  const title = () => `${t("Topics")} - ${settings()?.title || "Attegi"}`;
  const description = () =>
    t("Explore all topics and discover content that interests you") ||
    "探索所有主题，发现你感兴趣的内容";

  return (
    <>
      <Title>{title()}</Title>
      <Meta name="description" content={description()} />

      <header class="blog-header">
        <div class="inner">
          <div class="tags-page-header">
            <span class="tags-page-label">{t("Browse")}</span>
            <h1 class="tags-page-title">{t("Topics")}</h1>
            <p class="tags-page-description">{description()}</p>
          </div>
        </div>
      </header>

      <div id="tags-index" class="container">
        <div class="content">
          <div class="inner">
            <Suspense
              fallback={
                <div class="view-status-container inner inner-reading">
                  <p>{t("Loading...") || "正在加载专栏..."}</p>
                </div>
              }
            >
              <div class="tags-grid">
                <For each={tags()}>
                  {(tag) => {
                    const tagPosts = () =>
                      posts().filter((p) =>
                        p.tags?.some((t) => t.slug === tag.slug || t.id === tag.id)
                      );
                    const postCount = tag.count?.posts ?? tagPosts().length;
                    const tagUrl = `${prefix()}/tag/${tag.slug}`;

                    return (
                      <article
                        class={`tag-card ${tag.feature_image ? "has-image" : ""} ${
                          tag.accent_color ? "has-accent" : ""
                        }`}
                        data-tag-slug={tag.slug}
                        style={
                          tag.accent_color ? { "--tag-accent-color": tag.accent_color } : undefined
                        }
                      >
                        <Show
                          when={tag.feature_image}
                          fallback={
                            <A href={tagUrl} class="tag-card-link">
                              <div class="tag-card-header">
                                <div
                                  class="tag-card-icon"
                                  style={
                                    tag.accent_color
                                      ? {
                                          background: `linear-gradient(135deg, ${tag.accent_color}26, ${tag.accent_color}12)`,
                                          "border-color": `${tag.accent_color}33`,
                                        }
                                      : undefined
                                  }
                                >
                                  <svg
                                    class="tag-icon-default"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    style={tag.accent_color ? { color: tag.accent_color } : undefined}
                                  >
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                  </svg>
                                </div>
                                <div class="tag-card-info">
                                  <h2 class="tag-card-name">{tag.name}</h2>
                                  <span class="tag-card-count">
                                    {postCount === 0
                                      ? t("No Posts")
                                      : postCount === 1
                                      ? t("% Post", { count: 1 })
                                      : t("% Posts", { count: postCount })}
                                  </span>
                                </div>
                              </div>
                              <Show when={tag.description}>
                                <p class="tag-card-description">{tag.description}</p>
                              </Show>
                            </A>
                          }
                        >
                          <A href={tagUrl} class="tag-card-bg">
                            <img
                              src={tag.feature_image!}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                            <div class="tag-card-header">
                              <div class="tag-card-image">
                                <img
                                  src={tag.feature_image!}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                              <div class="tag-card-info">
                                <h2 class="tag-card-name">{tag.name}</h2>
                                <span class="tag-card-count">
                                  {postCount === 0
                                    ? t("No Posts")
                                    : postCount === 1
                                    ? t("% Post", { count: 1 })
                                    : t("% Posts", { count: postCount })}
                                </span>
                              </div>
                            </div>
                          </A>
                        </Show>

                        <Show when={tagPosts().length > 0}>
                          <div class="tag-card-posts">
                            <For each={tagPosts().slice(0, 5)}>
                              {(p: GhostPost) => (
                                <A href={`${prefix()}/${p.slug}`} class="tag-post-preview">
                                  <span class="tag-post-title">{p.title}</span>
                                  <span class="tag-post-date">
                                    {formatDate(p.published_at, "MMM D")}
                                  </span>
                                </A>
                              )}
                            </For>
                          </div>
                        </Show>
                      </article>
                    );
                  }}
                </For>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
