import { Title, Meta } from "@solidjs/meta";
import { useParams, createAsync, A } from "@solidjs/router";
import { Show, For, Suspense, createEffect, onCleanup } from "solid-js";
import { fetchAuthorData } from "../lib/server/ghost-data";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
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
  const homeUrl = () => (isRoot() ? "/" : currentLocale().prefix);

  const params = useParams<{ slug: string }>();
  const data = createAsync(() => fetchAuthorData(params.slug, currentLocale().code));
  const author = () => data()?.author;
  const posts = () => data()?.posts || [];
  const total = () => data()?.meta?.pagination?.total ?? posts().length;

  createEffect(() => {
    if (typeof document !== "undefined") {
      const hasCover = Boolean(author()?.cover_image);
      document.documentElement.classList.toggle("cover-active", hasCover);
    }
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("cover-active");
    }
  });

  const postCountText = () => {
    const count = total();
    if (count === 0) return t("No Posts");
    if (count === 1) return t("% Post", { count: 1 });
    return t("% Posts", { count });
  };

  return (
    <Suspense
      fallback={
        <div class="inner inner-reading view-status-container">
          <p>{t("Loading...") || "正在加载作者主页..."}</p>
        </div>
      }
    >
      <Show
        when={author()}
        fallback={
          <div class="inner inner-reading view-status-container">
            <h1>404</h1>
            <p>{t("Not Found") || "未找到该作者"}</p>
            <A href={homeUrl()} class="status-action-link">{t("Return to Home")}</A>
          </div>
        }
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

              <Show when={author()!.website}>
                <span class="archive-links">
                  <a target="_blank" rel="noopener noreferrer" href={author()!.website!} title={t("Website")}>
                    <i class="icon icon-globe" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    </i>
                    <span class="sr-only">{t("Website")}</span>
                  </a>
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
    </Suspense>
  );
}
