import { Title, Meta } from "@solidjs/meta";
import { useParams, createAsync, A } from "@solidjs/router";
import { Show, For, Suspense } from "solid-js";
import { ghost } from "../lib/ghost/index.js";
import type { GhostPost } from "../lib/ghost/types.js";

const fetchPostOrPage = async (slug: string) => {
  "use server";
  try {
    const post = await ghost.posts.read({ slug }, { include: "tags,authors" });
    if (post) {
      return { item: post, isPage: false };
    }
  } catch {
    // If not a post, try page
  }

  try {
    const page = await ghost.pages.read({ slug }, { include: "tags,authors" });
    if (page) {
      return { item: page, isPage: true };
    }
  } catch {
    // Not found
  }

  return null;
};

function formatDate(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

export default function PostDetail() {
  const params = useParams<{ slug: string }>();
  const data = createAsync(() => fetchPostOrPage(params.slug));

  const post = () => data()?.item;

  return (
    <Suspense
      fallback={
        <div class="inner inner-reading" style={{ padding: "8rem 0", "text-align": "center" }}>
          <p>正在加载文章内容...</p>
        </div>
      }
    >
      <Show
        when={post()}
        fallback={
          <div class="inner inner-reading" style={{ padding: "8rem 0", "text-align": "center" }}>
            <h1>404</h1>
            <p>未找到该文章或页面</p>
            <A href="/" style={{ color: "var(--ghost-accent-color)" }}>返回首页</A>
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
                      <figure class="post-meta-avatar">
                        <Show
                          when={author.profile_image}
                          fallback={
                            <div class="author-avatar avatar">
                              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
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
                      </figure>
                    )}
                  </For>
                </div>
                <p class="post-meta-author">
                  <For each={post()!.authors}>
                    {(author, i) => (
                      <>
                        {i() > 0 ? ", " : ""}
                        <span>{author.name}</span>
                      </>
                    )}
                  </For>
                </p>
              </Show>

              <span class="post-meta-details">
                <time datetime={post()!.published_at}>
                  {formatDate(post()!.published_at)}
                </time>
                <Show when={post()!.reading_time}>
                  <span class="post-meta-sep" aria-hidden="true">•</span>
                  <span class="post-meta-reading">
                    {post()!.reading_time} 分钟阅读
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

              <section class="post-content" innerHTML={post()!.html} />

              <section class="post-footer">
                <Show when={post()!.tags && post()!.tags!.length > 0}>
                  <div class="post-footer-meta">
                    <aside class="post-tags">
                      <span class="post-info-label">标签</span>
                      <For each={post()!.tags}>
                        {(tag) => (
                          <A href={`/tag/${tag.slug}`} class="post-tag-chip" style={{ "margin-right": "0.6rem" }}>
                            {tag.name}
                          </A>
                        )}
                      </For>
                    </aside>
                  </div>
                </Show>
              </section>
            </div>
          </article>
        </div>
      </Show>
    </Suspense>
  );
}
