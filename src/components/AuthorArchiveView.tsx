import { Title, Meta } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Show, For, Loading, createEffect, createMemo } from "solid-js";
import { fetchAuthorData } from "../lib/server/ghost-data";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import ErrorView from "./ErrorView";
import { t, getLocales, getDefaultLocale } from "../lib/i18n";

interface AuthorArchiveViewProps {
  lang?: string;
}

export default function AuthorArchiveView(props: AuthorArchiveViewProps) {
  const currentLocale = () => {
    if (props.lang) {
      return getLocales().find((l) => l.code === props.lang) || getDefaultLocale();
    }
    return getDefaultLocale();
  };
  const isRoot = () => currentLocale().isRoot;
  const prefix = () => (isRoot() ? "" : currentLocale().prefix);

  const params = useParams<{ slug: string }>();
  const data = createMemo(() => fetchAuthorData(params.slug, currentLocale().code));
  const author = () => data()?.author;
  const posts = () => data()?.posts || [];
  const total = () => data()?.meta?.pagination?.total ?? posts().length;

  createEffect(
    () => Boolean(author()?.cover_image),
    (hasCover) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("cover-active", hasCover);
        return () => {
          document.documentElement.classList.remove("cover-active");
        };
      }
    }
  );

  const postCountText = () => {
    const count = total();
    if (count === 0) return t("No Posts");
    if (count === 1) return t("% Post", { count: 1 });
    return t("% Posts", { count });
  };

  return (
    <Loading
      fallback={
        <div class="inner inner-reading view-status-container">
          <p>{t("Loading...") || "正在加载作者主页..."}</p>
        </div>
      }
    >
      <Show
        when={author()}
        fallback={<ErrorView lang={props.lang} title={t("Author not found") || t("Page Not Found")} />}
      >
        <Title>{`${author()!.name} - ${data()?.settings?.title || "Attegi"}`}</Title>
        <Meta
          name="description"
          content={author()!.bio || `${t("Posts by")} ${author()!.name}`}
        />

        <header class={`blog-header ${author()!.cover_image ? "has-cover" : ""}`}>
          <div class="inner">
            <div class="archive archive-author box archive-box">
              <span class="archive-info">
                <span class="archive-type">{t("Author")}</span>
                <span class="archive-count">{postCountText()}</span>
              </span>

              <figure class={`archive-avatar ${!author()!.profile_image ? "avatar" : ""}`}>
                <Show
                  when={author()!.profile_image}
                  fallback={
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  }
                >
                  <picture>
                    <img
                      src={author()!.profile_image!}
                      alt={author()!.name}
                      loading="eager"
                      decoding="async"
                    />
                  </picture>
                </Show>
              </figure>

              <h1 class="archive-title">{author()!.name}</h1>
              <span class={`archive-description ${!author()!.bio ? "archive-description-fallback" : ""}`}>
                {author()!.bio || `${t("Posts by")} ${author()!.name}`}
              </span>

              <Show when={author()!.website || author()!.twitter || author()!.facebook}>
                <span class="archive-links">
                  <Show when={author()!.website}>
                    <a target="_blank" rel="noopener noreferrer" href={author()!.website!} title={t("Website")}>
                      <i class="icon icon-globe" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      </i>
                      <span class="sr-only">{t("Website")}</span>
                    </a>
                  </Show>
                  <Show when={author()!.twitter}>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        author()!.twitter!.startsWith("http")
                          ? author()!.twitter!
                          : `https://twitter.com/${author()!.twitter!.replace(/^@/, "")}`
                      }
                      title="X"
                      aria-label="X"
                    >
                      <i class="icon icon-x" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                      </i>
                      <span class="sr-only">X</span>
                    </a>
                  </Show>
                  <Show when={author()!.facebook}>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        author()!.facebook!.startsWith("http")
                          ? author()!.facebook!
                          : `https://facebook.com/${author()!.facebook!.replace(/^@/, "")}`
                      }
                      title="Facebook"
                      aria-label="Facebook"
                    >
                      <i class="icon icon-facebook" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </i>
                      <span class="sr-only">Facebook</span>
                    </a>
                  </Show>
                </span>
              </Show>
            </div>

            <Show when={author()!.cover_image}>
              <div class="blog-cover cover">
                <picture>
                  <img
                    src={author()!.cover_image!}
                    alt={author()!.name}
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </div>
            </Show>
          </div>
        </header>

        <div id="index" class="container">
          <div class="content">
            <Show
              when={posts().length > 0}
              fallback={<p class="feed-status-message">{t("No posts found") || "暂无该作者文章"}</p>}
            >
              <For each={posts()}>
                {(post) => <PostCard post={post} />}
              </For>

              <Pagination
                pagination={data()?.meta?.pagination}
                basePath={`${prefix()}/author/${params.slug}`}
              />
            </Show>
          </div>
        </div>
      </Show>
    </Loading>
  );
}
