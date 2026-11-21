import { Title, Meta, Link } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Show, For, Loading, createSignal, createEffect, createMemo } from "solid-js";
import { fetchPostOrPage } from "../lib/server/ghost-data";
import { setupCodeHighlight } from "../lib/highlight.js";
import {
  cleanExcerpt,
  handleToggleClick,
  setupToggleCards,
  setupGalleryCards,
  setupPoemCards,
  setupCoverBrightness,
} from "../lib/content";
import ShareButtons from "./ShareButtons";
import PostNav from "./PostNav";
import ImageLightbox, { type LightboxImage } from "./ImageLightbox";
import TableOfContents from "./TableOfContents";
import ErrorView from "./ErrorView";
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

  const params = useParams<{ slug: string }>();
  const data = createMemo(() => fetchPostOrPage(params.slug, currentLocale().code));
  const post = () => data()?.item;

  const [contentEl, setContentEl] = createSignal<HTMLElement | null>(null);
  const [headerEl, setHeaderEl] = createSignal<HTMLElement | null>(null);

  const [lightboxImages, setLightboxImages] = createSignal<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = createSignal(0);
  const [isLightboxOpen, setIsLightboxOpen] = createSignal(false);

  const handleContentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (handleToggleClick(target)) {
      return;
    }

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

  createEffect(
    () => Boolean(post()?.feature_image),
    (hasCover) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("cover-active", hasCover);
        return () => {
          document.documentElement.classList.remove("cover-active");
        };
      }
    }
  );

  createEffect(
    () => [headerEl(), post()?.feature_image] as const,
    ([el, img]) => {
      if (el && img) {
        setupCoverBrightness(el);
      }
    }
  );

  createEffect(
    () => [contentEl(), post()?.html] as const,
    ([el, html]) => {
      if (html && el) {
        setupCodeHighlight(el);
        setupToggleCards(el);
        setupGalleryCards(el);
        setupPoemCards(el);
      }
    }
  );



  return (
    <Loading
      fallback={
        <div class="inner inner-reading view-status-container">
          <p>{t("Loading...") || "正在加载文章内容..."}</p>
        </div>
      }
    >
      <Show
        when={post()}
        fallback={<ErrorView lang={props.lang} />}
      >
        <Title>{post()!.title}</Title>
        <Meta name="description" content={cleanExcerpt(post()!.custom_excerpt || post()!.excerpt || "")} />
        <Link
          rel="canonical"
          href={
            post()!.canonical_url ||
            (data()?.settings?.url
              ? `${data()!.settings!.url.replace(/\/$/, "")}${prefix()}/${post()!.slug}/`
              : `${prefix()}/${post()!.slug}/`)
          }
        />

        {/* OpenGraph */}
        <Meta property="og:site_name" content={data()?.settings?.title || "Attegi"} />
        <Meta property="og:type" content={data()?.isPage ? "website" : "article"} />
        <Meta property="og:title" content={post()!.og_title || post()!.title} />
        <Meta
          property="og:description"
          content={post()!.og_description || cleanExcerpt(post()!.custom_excerpt || post()!.excerpt || "")}
        />
        <Meta
          property="og:url"
          content={
            data()?.settings?.url
              ? `${data()!.settings!.url.replace(/\/$/, "")}${prefix()}/${post()!.slug}/`
              : `${prefix()}/${post()!.slug}/`
          }
        />
        <Show when={post()!.og_image || post()!.feature_image}>
          <Meta property="og:image" content={post()!.og_image || post()!.feature_image!} />
        </Show>
        <Show when={!data()?.isPage}>
          <Show when={post()!.published_at}>
            <Meta property="article:published_time" content={post()!.published_at} />
          </Show>
          <Show when={post()!.updated_at}>
            <Meta property="article:modified_time" content={post()!.updated_at} />
          </Show>
          <For each={post()!.tags}>
            {(tag) => <Meta property="article:tag" content={tag.name} />}
          </For>
        </Show>

        {/* Twitter Card */}
        <Meta
          name="twitter:card"
          content={post()!.twitter_image || post()!.feature_image ? "summary_large_image" : "summary"}
        />
        <Meta name="twitter:title" content={post()!.twitter_title || post()!.title} />
        <Meta
          name="twitter:description"
          content={post()!.twitter_description || cleanExcerpt(post()!.custom_excerpt || post()!.excerpt || "")}
        />
        <Show when={post()!.twitter_image || post()!.feature_image}>
          <Meta name="twitter:image" content={post()!.twitter_image || post()!.feature_image!} />
        </Show>
        <Show when={data()?.settings?.twitter}>
          <Meta name="twitter:site" content={data()!.settings!.twitter!} />
        </Show>

        {/* Per-post Code Injections */}
        <Show when={post()!.codeinjection_head}>
          <div innerHTML={post()!.codeinjection_head!} style={{ display: "none" }} />
        </Show>
        <Show when={post()!.codeinjection_foot}>
          <div innerHTML={post()!.codeinjection_foot!} style={{ display: "none" }} />
        </Show>

        <header ref={setHeaderEl} class={`post-header ${post()!.feature_image ? "has-cover" : ""}`}>
          <div class="inner inner-reading">
            <h1 class="post-title">{post()!.title}</h1>
            <div class="post-meta">
              <Show when={post()!.authors && post()!.authors!.length > 0}>
                <div class="post-meta-avatars">
                  <For each={post()!.authors}>
                    {(author) => (
                      <figure class="post-meta-avatar avatar" aria-label={author.name}>
                        <a href={`${prefix()}/author/${author.slug}/`} class="author-avatar" aria-label={author.name}>
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
                        </a>
                      </figure>
                    )}
                  </For>
                </div>
                <p class="post-meta-author">
                  <For each={post()!.authors}>
                    {(author, i) => (
                      <>
                        {i() > 0 ? ", " : ""}
                        <a href={`${prefix()}/author/${author.slug}/`}>{author.name}</a>
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
                          <a href={`${prefix()}/tag/${tag.slug}`} class="post-tag-chip">
                            {tag.name}
                          </a>
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
    </Loading>
  );
}
