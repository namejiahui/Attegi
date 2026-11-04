import { Title, Meta, Link } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { For, Show, Suspense, createEffect, onCleanup } from "solid-js";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import { fetchHomeFeedData } from "../lib/server/ghost-data";
import { t, getLocales, getDefaultLocale } from "../lib/i18n";

interface HomeFeedProps {
  lang?: string;
  page?: number;
}

export default function HomeFeed(props: HomeFeedProps) {
  const currentLocale = () => {
    if (props.lang) {
      return getLocales().find((l) => l.code === props.lang) || getDefaultLocale();
    }
    return getDefaultLocale();
  };
  const isRoot = () => currentLocale().isRoot;
  const pageNumber = () => props.page || 1;
  const data = createAsync(() => fetchHomeFeedData(currentLocale().code, pageNumber()));

  createEffect(() => {
    if (typeof document !== "undefined") {
      const hasCover = Boolean(data()?.settings?.cover_image);
      document.documentElement.classList.toggle("cover-active", hasCover);
    }
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("cover-active");
    }
  });

  const coverSrcset = () => {
    const img = data()?.settings?.cover_image;
    if (!img) return "";
    return `${img} 320w, ${img} 640w, ${img} 960w`;
  };

  const title = () => {
    const baseTitle = data()?.settings?.title || "Attegi";
    if (pageNumber() > 1) {
      return `${baseTitle} - ${t("Page %", { page: pageNumber() })}`;
    }
    return baseTitle;
  };

  return (
    <>
      <Title>{title()}</Title>
      <Meta
        name="description"
        content={data()?.settings?.description || "A Ghost blog powered by SolidStart"}
      />
      <Show when={data()?.settings?.url}>
        <Link rel="canonical" href={data()!.settings!.url!} />
        <Meta property="og:url" content={data()!.settings!.url!} />
      </Show>

      <Meta property="og:site_name" content={data()?.settings?.title || "Attegi"} />
      <Meta property="og:type" content="website" />
      <Meta property="og:title" content={title()} />
      <Meta property="og:description" content={data()?.settings?.description || ""} />
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={title()} />
      <Meta name="twitter:description" content={data()?.settings?.description || ""} />

      <Show when={data()?.settings?.cover_image}>
        <Meta property="og:image" content={data()!.settings!.cover_image!} />
        <Meta name="twitter:image" content={data()!.settings!.cover_image!} />
        <Link
          rel="preload"
          as="image"
          href={data()!.settings!.cover_image!}
          imagesrcset={coverSrcset()}
          imagesizes="(max-width: 1100px) 100vw, 1100px"
        />
      </Show>

      <header class={`blog-header ${data()?.settings?.cover_image ? "has-cover" : ""}`}>
        <div class="inner">
          <div class="box blog-box">
            <h1 class="blog-name">{data()?.settings?.title || "Attegi"}</h1>
            <Show when={data()?.settings?.description}>
              <p class="blog-description">{data()?.settings?.description}</p>
            </Show>
          </div>
          <Show when={data()?.settings?.cover_image}>
            <div class="blog-cover cover">
              <picture>
                <source
                  srcset={coverSrcset()}
                  sizes="(max-width: 1100px) 100vw, 1100px"
                />
                <img
                  srcset={coverSrcset()}
                  sizes="(max-width: 1100px) 100vw, 1100px"
                  src={data()!.settings!.cover_image!}
                  alt=""
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
          <Suspense fallback={<p class="feed-status-message">{t("Loading...") || "正在加载文章列表..."}</p>}>
            <Show
              when={data()?.posts && data()!.posts.length > 0}
              fallback={<p class="feed-status-message">{t("No Posts")}</p>}
            >
              <For each={data()?.posts}>
                {(post) => <PostCard post={post} />}
              </For>

              <Pagination
                pagination={data()?.meta?.pagination}
                basePath={isRoot() ? "" : currentLocale().prefix}
              />
            </Show>
          </Suspense>
        </div>
      </div>
    </>
  );
}
