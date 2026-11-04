import { Show, For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import type { GhostPost } from "../lib/ghost/types.js";
import { t, formatDate, formatIsoDateOnly, getActiveLocale } from "../lib/i18n";

interface PostCardProps {
  post: GhostPost;
}

export default function PostCard(props: PostCardProps) {
  const post = () => props.post;
  const location = useLocation();
  const cur = () => getActiveLocale(location.pathname);
  const prefix = () => (cur().isRoot ? "" : cur().prefix);

  return (
    <article class={`post ${post().featured ? "featured" : ""}`}>
      <div class="inner">
        <div class="box post-box">
          <div class="post-box-header">
            <div class="post-box-title-wrap">
              <h2 class="post-title">
                <A href={`${prefix()}/${post().slug}`}>{post().title}</A>
              </h2>
            </div>

            <div class="post-tags-inline">
              <Show when={post().featured}>
                <span class="post-feature-tag">#{t("Featured")}</span>
              </Show>
              <Show when={post().tags && post().tags!.length > 0}>
                <For each={post().tags?.filter(t => !t.name.startsWith("#")).slice(0, 3)}>
                  {(tag) => (
                    <A href={`${prefix()}/tag/${tag.slug}`} class="post-tag-chip">
                      {tag.name}
                    </A>
                  )}
                </For>
              </Show>
            </div>
          </div>

          <div class="post-box-link">
            <span class="post-meta">
              <time datetime={formatIsoDateOnly(post().published_at)}>
                {formatDate(post().published_at, "MMMM D, YYYY")}
              </time>
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
