import { Show, For } from "solid-js";
import { A } from "@solidjs/router";
import type { GhostPost } from "../lib/ghost/types.js";

interface PostCardProps {
  post: GhostPost;
}

function formatDate(isoString: string): string {
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

export default function PostCard(props: PostCardProps) {
  const post = () => props.post;

  return (
    <article class={`post ${post().featured ? "featured" : ""}`}>
      <div class="inner">
        <div class="box post-box">
          <div class="post-box-header">
            <div class="post-box-title-wrap">
              <h2 class="post-title">
                <A href={`/${post().slug}`}>{post().title}</A>
              </h2>
            </div>

            <div class="post-tags-inline">
              <Show when={post().featured}>
                <span class="post-feature-tag">#Featured</span>
              </Show>
              <Show when={post().tags && post().tags!.length > 0}>
                <For each={post().tags?.slice(0, 3)}>
                  {(tag) => (
                    <A href={`/tag/${tag.slug}`} class="post-tag-chip">
                      {tag.name}
                    </A>
                  )}
                </For>
              </Show>
            </div>
          </div>

          <div class="post-box-link">
            <span class="post-meta">
              <time datetime={post().published_at}>
                {formatDate(post().published_at)}
              </time>
              <Show when={post().reading_time}>
                <span style={{ "margin-left": "0.8rem" }}>
                  · {post().reading_time} 分钟阅读
                </span>
              </Show>
            </span>
            <p class="post-excerpt">
              {post().custom_excerpt || post().excerpt}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
