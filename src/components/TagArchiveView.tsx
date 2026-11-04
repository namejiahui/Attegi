import { Title, Meta } from "@solidjs/meta";
import { useParams, createAsync, A } from "@solidjs/router";
import { Show, For, Suspense, createEffect, onCleanup } from "solid-js";
import { fetchTagData } from "../lib/server/ghost-data";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import { t, getLocales, getDefaultLocale } from "../lib/i18n";

interface TagArchiveViewProps {
  lang?: string;
}

export default function TagArchiveView(props: TagArchiveViewProps) {
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
  const data = createAsync(() => fetchTagData(params.slug, currentLocale().code));
  const tag = () => data()?.tag;
  const posts = () => data()?.posts || [];
  const total = () => data()?.meta?.pagination?.total ?? posts().length;

  createEffect(() => {
    if (typeof document !== "undefined") {
      const hasCover = Boolean(tag()?.feature_image);
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
          <p>{t("Loading...") || "正在加载专栏内容..."}</p>
        </div>
      }
    >
      <Show
        when={tag()}
        fallback={
          <div class="inner inner-reading view-status-container">
            <h1>404</h1>
            <p>{t("Not Found") || "未找到该专栏或标签"}</p>
            <A href={homeUrl()} class="status-action-link">{t("Return to Home")}</A>
          </div>
        }
      >
        <Title>{`${tag()!.name} - ${data()?.settings?.title || "Attegi"}`}</Title>
        <Meta
          name="description"
          content={tag()!.description || `${t("Posts tagged with")} "${tag()!.name}"`}
        />

        <header class={`blog-header ${tag()!.feature_image ? "has-cover" : ""}`}>
          <div class="inner">
            <div class="archive archive-tag box archive-box">
              <span class="archive-info">
                <span class="archive-type">{t("Topic")}</span>
                <span class="archive-count">{postCountText()}</span>
              </span>
              <h1 class="archive-title">{tag()!.name}</h1>
              <span class={`archive-description ${!tag()!.description ? "archive-description-fallback" : ""}`}>
                {tag()!.description || `${t("Posts tagged with")} "${tag()!.name}"`}
              </span>
            </div>

            <Show when={tag()!.feature_image}>
              <div class="blog-cover cover">
                <picture>
                  <img
                    src={tag()!.feature_image!}
                    alt={tag()!.name}
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
              fallback={<p class="feed-status-message">{t("No posts found") || "暂无该话题文章"}</p>}
            >
              <For each={posts()}>
                {(post) => <PostCard post={post} />}
              </For>

              <Pagination
                pagination={data()?.meta?.pagination}
                basePath={`${prefix()}/tag/${params.slug}`}
              />
            </Show>
          </div>
        </div>
      </Show>
    </Suspense>
  );
}
