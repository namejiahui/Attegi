import { Title, Meta } from "@solidjs/meta";
import { useParams, createAsync, A } from "@solidjs/router";
import { Show, For, Suspense, createSignal, createEffect, onCleanup } from "solid-js";
import { fetchPostOrPage } from "../lib/server/ghost-data";
import { setupCodeHighlight } from "../lib/highlight.js";
import ShareButtons from "./ShareButtons";
import PostNav from "./PostNav";
import ImageLightbox, { type LightboxImage } from "./ImageLightbox";
import TableOfContents from "./TableOfContents";
import { t, formatDate, formatIsoDateOnly, getLocales, getDefaultLocale } from "../lib/i18n";

interface PostViewProps {
  lang?: string;
}

export default function PostView(props: PostViewProps) {
  const currentLocale = () => {
    if (props.lang) {
      return getLocales().find((l) => l.code === props.lang) || getDefaultLocale();
    }
    return getDefaultLocale();
  };
  const isRoot = () => currentLocale().isRoot;
  const prefix = () => (isRoot() ? "" : currentLocale().prefix);
  const homeUrl = () => (isRoot() ? "/" : currentLocale().prefix);

  const params = useParams<{ slug: string }>();
  const data = createAsync(() => fetchPostOrPage(params.slug, currentLocale().code));
  const post = () => data()?.item;

  const [contentEl, setContentEl] = createSignal<HTMLElement | null>(null);

  const [lightboxImages, setLightboxImages] = createSignal<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = createSignal(0);
  const [isLightboxOpen, setIsLightboxOpen] = createSignal(false);

  const handleContentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const img = target.closest("img") as HTMLImageElement | null;
    if (!img) return;

    const link = img.closest("a");
    if (link && link.href && !/\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(link.href)) {
      return;
    }

    e.preventDefault();

    const gallery = img.closest(".kg-gallery-card");
    const container = gallery || contentEl();
    if (!container) return;

    const allImgs = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
    if (allImgs.length === 0) return;

    const images: LightboxImage[] = allImgs.map((el) => ({
      src: el.currentSrc || el.src,
      alt: el.alt || undefined,
    }));

    const clickedIdx = allImgs.indexOf(img);
    setLightboxImages(images);
    setLightboxIndex(clickedIdx >= 0 ? clickedIdx : 0);
    setIsLightboxOpen(true);
  };

  createEffect(() => {
    if (typeof document !== "undefined") {
      const hasCover = Boolean(post()?.feature_image);
      document.documentElement.classList.toggle("cover-active", hasCover);
    }
  });

  createEffect(() => {
    const el = contentEl();
    if (post()?.html && el) {
      setupCodeHighlight(el);
    }
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("cover-active");
    }
  });

  return (
    <Suspense
      fallback={
        <div class="inner inner-reading view-status-container">
          <p>{t("Loading...") || "正在加载文章内容..."}</p>
        </div>
      }
    >
      <Show
        when={post()}
        fallback={
          <div class="inner inner-reading view-status-container">
            <h1>404</h1>
            <p>{t("Not Found") || "未找到该文章或页面"}</p>
            <A href={homeUrl()} class="status-action-link">{t("Return to Home")}</A>
          </div>
        }
      >
        <Title>{post()!.title}</Title>
        <Meta name="description" content={post()!.custom_excerpt || post()!.excerpt || ""} />
        <Show when={post()!.og_title}>
          <Meta property="og:title" content={post()!.og_title!} />
        </Show>
        <Show when={post()!.og_description}>
          <Meta property="og:description" content={post()!.og_description!} />
        </Show>

        <header class={`post-header ${post()!.feature_image ? "has-cover" : ""}`}>
          <div class="inner inner-reading">
            <h1 class="post-title">{post()!.title}</h1>
            <div class="post-meta">
              <Show when={post()!.authors && post()!.authors!.length > 0}>
                <div class="post-meta-avatars">
                  <For each={post()!.authors}>
                    {(author) => (
                      <figure class="post-meta-avatar avatar" aria-label={author.name}>
                        <A href={`${prefix()}/author/${author.slug}/`} class="author-avatar" aria-label={author.name}>
                          <Show
                            when={author.profile_image}
                            fallback={
                              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            }
                          >
                            <img
                              class="author-profile-image"
                              src={author.profile_image!}
                              alt={author.name}
                              loading="lazy"
                              decoding="async"
                            />
                          </Show>
                        </A>
                      </figure>
                    )}
                  </For>
                </div>
                <p class="post-meta-author">
                  <For each={post()!.authors}>
                    {(author, i) => (
                      <>
                        {i() > 0 ? ", " : ""}
                        <A href={`${prefix()}/author/${author.slug}/`}>{author.name}</A>
                      </>
                    )}
                  </For>
                </p>
              </Show>

              <span class="post-meta-details">
                <time datetime={formatIsoDateOnly(post()!.published_at)}>
                  {formatDate(post()!.published_at, "MMM DD, YYYY")}
                </time>
                <Show when={post()!.reading_time}>
                  <span class="post-meta-sep" aria-hidden="true">•</span>
                  <span class="post-meta-reading">
                    {t("% min read", { minutes: post()!.reading_time })}
                  </span>
                </Show>
              </span>
            </div>

            <Show when={post()!.feature_image}>
              <div class="post-cover cover">
                <picture>
                  <img
                    src={post()!.feature_image!}
                    alt={post()!.feature_image_alt || post()!.title}
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </div>
            </Show>
          </div>
        </header>

        <div class="content">
          <article class="post">
            <div class="inner inner-reading">
              <Show when={post()!.feature_image_caption}>
                <figcaption class="post-cover-credit" innerHTML={post()!.feature_image_caption!} />
              </Show>

              <section
                ref={setContentEl}
                class="post-content"
                onClick={handleContentClick}
                innerHTML={post()!.html}
              />

              <section class="post-footer">
                <div class="post-footer-meta">
                  <Show when={post()!.tags && post()!.tags!.length > 0}>
                    <aside class="post-tags">
                      <span class="post-info-label">{t("Topic")}</span>
                      <For each={post()!.tags?.filter(t => !t.name.startsWith("#"))}>
                        {(tag) => (
                          <A href={`${prefix()}/tag/${tag.slug}`} class="post-tag-chip">
                            {tag.name}
                          </A>
                        )}
                      </For>
                    </aside>
                  </Show>
                  <ShareButtons
                    title={post()!.title}
                    url={data()?.settings?.url ? `${data()!.settings!.url.replace(/\/$/, "")}${prefix()}/${post()!.slug}/` : `${prefix()}/${post()!.slug}/`}
                  />
                </div>
              </section>

              <Show when={!data()?.isPage}>
                <PostNav
                  prevPost={data()?.prevPost}
                  nextPost={data()?.nextPost}
                  siteDescription={data()?.settings?.description}
                />
              </Show>
            </div>
          </article>

          {/* Table of Contents (Desktop sidebar + Mobile floating trigger & drawer) */}
          <TableOfContents contentEl={contentEl()} html={post()?.html} />

          {/* Lightbox Modal */}
          <ImageLightbox
            images={lightboxImages()}
            currentIndex={lightboxIndex()}
            isOpen={isLightboxOpen()}
            onClose={() => setIsLightboxOpen(false)}
            onIndexChange={(idx) => setLightboxIndex(idx)}
          />
        </div>
      </Show>
    </Suspense>
  );
}
