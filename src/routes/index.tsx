import { Title, Meta } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { ghost } from "../lib/ghost/index.js";
import PostCard from "../components/PostCard";

const fetchHomeData = async () => {
  "use server";
  const [postsRes, settings] = await Promise.all([
    ghost.posts.browse({ limit: 15, include: "tags,authors" }),
    ghost.settings.browse(),
  ]);
  return {
    posts: postsRes.posts,
    settings,
    meta: postsRes.meta,
  };
};

export default function Home() {
  const data = createAsync(() => fetchHomeData());

  return (
    <>
      <Title>{data()?.settings?.title || "Attegi Blog"}</Title>
      <Meta
        name="description"
        content={data()?.settings?.description || "A Ghost blog powered by SolidStart"}
      />

      <header class={`blog-header ${data()?.settings?.cover_image ? "has-cover" : ""}`}>
        <div class="inner">
          <div class="box blog-box">
            <h1 class="blog-name">{data()?.settings?.title || "bblog"}</h1>
            <Show when={data()?.settings?.description}>
              <p class="blog-description">{data()?.settings?.description}</p>
            </Show>
          </div>
          <Show when={data()?.settings?.cover_image}>
            <div class="blog-cover cover">
              <picture>
                <img
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
          <Suspense fallback={<p style={{ padding: "3rem 0", "text-align": "center" }}>正在加载文章列表...</p>}>
            <Show
              when={data()?.posts && data()!.posts.length > 0}
              fallback={<p style={{ padding: "3rem 0", "text-align": "center" }}>暂无已发布文章</p>}
            >
              <For each={data()?.posts}>
                {(post) => <PostCard post={post} />}
              </For>
            </Show>
          </Suspense>
        </div>
      </div>
    </>
  );
}
