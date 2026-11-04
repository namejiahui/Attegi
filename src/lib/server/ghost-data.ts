"use server";
import { ghost } from "../ghost/index.js";
import { getGhostFilterForLocale } from "../i18n.js";

export const fetchHomeFeedData = async (localeCode?: string, page = 1) => {
  const filter = getGhostFilterForLocale(localeCode);
  const [postsRes, settings] = await Promise.all([
    ghost.posts.browse({ page, limit: 8, include: "tags,authors", filter: filter || undefined }),
    ghost.settings.browse(),
  ]);
  return {
    posts: postsRes.posts,
    settings,
    meta: postsRes.meta,
  };
};

export const fetchPostOrPage = async (slug: string, localeCode?: string) => {
  const langFilter = getGhostFilterForLocale(localeCode);
  const filterSuffix = langFilter ? `+${langFilter}` : "";

  try {
    const [post, settings] = await Promise.all([
      ghost.posts.read({ slug }, { include: "tags,authors" }),
      ghost.settings.browse(),
    ]);

    if (post) {
      const dateStr = new Date(post.published_at).toISOString().replace("T", " ").substring(0, 19);
      const [prevRes, nextRes] = await Promise.all([
        ghost.posts.browse({
          filter: `published_at:<='${dateStr}'+slug:-${post.slug}${filterSuffix}`,
          order: "published_at desc",
          limit: 1,
          fields: "title,slug,excerpt,published_at",
        }).catch(() => ({ posts: [] })),
        ghost.posts.browse({
          filter: `published_at:>='${dateStr}'+slug:-${post.slug}${filterSuffix}`,
          order: "published_at asc",
          limit: 1,
          fields: "title,slug,excerpt,published_at",
        }).catch(() => ({ posts: [] })),
      ]);

      return {
        item: post,
        isPage: false,
        prevPost: prevRes.posts?.[0] || null,
        nextPost: nextRes.posts?.[0] || null,
        settings,
      };
    }
  } catch {
    // If not a post, try page
  }

  try {
    const [page, settings] = await Promise.all([
      ghost.pages.read({ slug }, { include: "tags,authors" }),
      ghost.settings.browse(),
    ]);
    if (page) {
      return {
        item: page,
        isPage: true,
        prevPost: null,
        nextPost: null,
        settings,
      };
    }
  } catch {
    // Not found
  }

  return null;
};

export const fetchTagData = async (slug: string, localeCode?: string, page = 1) => {
  const langFilter = getGhostFilterForLocale(localeCode);
  const filter = langFilter ? `tag:${slug}+${langFilter}` : `tag:${slug}`;

  try {
    const [tag, postsRes, settings] = await Promise.all([
      ghost.tags.read({ slug }),
      ghost.posts.browse({ filter, page, limit: 8, include: "tags,authors" }),
      ghost.settings.browse(),
    ]);
    return {
      tag,
      posts: postsRes.posts,
      meta: postsRes.meta,
      settings,
    };
  } catch (err) {
    console.error("Failed to fetch tag data:", err);
    return null;
  }
};

export const fetchAuthorData = async (slug: string, localeCode?: string, page = 1) => {
  const langFilter = getGhostFilterForLocale(localeCode);
  const filter = langFilter ? `author:${slug}+${langFilter}` : `author:${slug}`;

  try {
    const [author, postsRes, settings] = await Promise.all([
      ghost.authors.read({ slug }),
      ghost.posts.browse({ filter, page, limit: 8, include: "tags,authors" }),
      ghost.settings.browse(),
    ]);
    return {
      author,
      posts: postsRes.posts,
      meta: postsRes.meta,
      settings,
    };
  } catch (err) {
    console.error("Failed to fetch author data:", err);
    return null;
  }
};
