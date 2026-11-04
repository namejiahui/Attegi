import { ofetch, type $Fetch } from 'ofetch';
import type {
  GhostPost,
  GhostTag,
  GhostAuthor,
  GhostSettings,
  GhostBrowseOptions,
  GhostResponse,
} from './types.js';

export interface GhostClientConfig {
  url: string;
  key: string;
  version?: string;
}

export class GhostContentClient {
  private fetch: $Fetch;
  readonly siteUrl: string;

  constructor(config: GhostClientConfig) {
    if (!config.url || !config.key) {
      console.warn('[GhostContentClient] Missing url or key configuration.');
    }
    this.siteUrl = config.url ? config.url.replace(/\/+$/, '') : '';
    const baseURL = `${this.siteUrl}/ghost/api/content/`;

    this.fetch = ofetch.create({
      baseURL,
      params: { key: config.key },
      retry: 2,
      timeout: 10000,
    });
  }

  readonly posts = {
    browse: async (options?: GhostBrowseOptions) => {
      const res = await this.fetch<GhostResponse<GhostPost[]>>('posts/', {
        params: options,
      });
      return {
        posts: (res.posts || []) as GhostPost[],
        meta: res.meta,
      };
    },
    read: async (
      lookup: { slug?: string; id?: string },
      options?: { include?: string; fields?: string }
    ) => {
      const endpoint = lookup.slug
        ? `posts/slug/${encodeURIComponent(lookup.slug)}/`
        : `posts/${lookup.id}/`;
      const res = await this.fetch<{ posts: GhostPost[] }>(endpoint, {
        params: options,
      });
      return res.posts?.[0] ?? null;
    },
  };

  readonly pages = {
    browse: async (options?: GhostBrowseOptions) => {
      const res = await this.fetch<GhostResponse<GhostPost[]>>('pages/', {
        params: options,
      });
      return {
        pages: (res.pages || []) as GhostPost[],
        meta: res.meta,
      };
    },
    read: async (
      lookup: { slug?: string; id?: string },
      options?: { include?: string; fields?: string }
    ) => {
      const endpoint = lookup.slug
        ? `pages/slug/${encodeURIComponent(lookup.slug)}/`
        : `pages/${lookup.id}/`;
      const res = await this.fetch<{ pages: GhostPost[] }>(endpoint, {
        params: options,
      });
      return res.pages?.[0] ?? null;
    },
  };

  readonly tags = {
    browse: async (options?: GhostBrowseOptions) => {
      const res = await this.fetch<GhostResponse<GhostTag[]>>('tags/', {
        params: options,
      });
      return {
        tags: (res.tags || []) as GhostTag[],
        meta: res.meta,
      };
    },
    read: async (lookup: { slug?: string; id?: string }) => {
      const endpoint = lookup.slug
        ? `tags/slug/${encodeURIComponent(lookup.slug)}/`
        : `tags/${lookup.id}/`;
      const res = await this.fetch<{ tags: GhostTag[] }>(endpoint);
      return res.tags?.[0] ?? null;
    },
  };

  readonly authors = {
    browse: async (options?: GhostBrowseOptions) => {
      const res = await this.fetch<GhostResponse<GhostAuthor[]>>('authors/', {
        params: options,
      });
      return {
        authors: (res.authors || []) as GhostAuthor[],
        meta: res.meta,
      };
    },
    read: async (lookup: { slug?: string; id?: string }) => {
      const endpoint = lookup.slug
        ? `authors/slug/${encodeURIComponent(lookup.slug)}/`
        : `authors/${lookup.id}/`;
      const res = await this.fetch<{ authors: GhostAuthor[] }>(endpoint);
      return res.authors?.[0] ?? null;
    },
  };

  readonly settings = {
    browse: async () => {
      const res = await this.fetch<{ settings: GhostSettings }>('settings/');
      return res.settings;
    },
  };
}
