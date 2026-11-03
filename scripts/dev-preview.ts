#!/usr/bin/env node

/**
 * Local Ghost theme preview server.
 * Renders the theme's Handlebars templates locally and fetches content from a
 * remote Ghost Content API, so template, CSS, and JS edits can reload together.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';
import Handlebars from 'handlebars';
import bs from 'browser-sync';
import packageConfig from '../package.json' with { type: 'json' };

const browserSync = bs.create();

const ROOT = process.cwd();
const DEFAULT_PREVIEW_PORT = 3020;
const DEFAULT_RENDER_PORT = 3021;
const DEFAULT_POSTS_PER_PAGE = 8;
const ASSET_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2'
};

loadEnvFile('.env');
loadEnvFile('.env.local');

const contentUrl = normalizeUrl(
  process.env.GHOST_CONTENT_API_URL ||
  process.env.GHOST_API_URL ||
  process.env.GHOST_DEV_URL ||
  process.env.GHOST_URL
);
const contentKey = process.env.GHOST_CONTENT_API_KEY || process.env.GHOST_API_KEY;
const previewPort = parsePort(process.env.DEV_PREVIEW_PORT, DEFAULT_PREVIEW_PORT);
const renderPort = parsePort(process.env.DEV_PREVIEW_RENDER_PORT, DEFAULT_RENDER_PORT);
const autoOpen = parseBoolean(process.env.DEV_PREVIEW_OPEN);
const localeCache = new Map<string, Record<string, string>>();

if (!contentUrl || !contentKey) {
  console.error('\n[preview] Missing Ghost Content API config.');
  console.error('[preview] Set GHOST_CONTENT_API_URL and GHOST_CONTENT_API_KEY, then run pnpm run dev:preview.\n');
  process.exit(1);
}

const api = createGhostApi(contentUrl, contentKey);
const themeCustom = (packageConfig.config as Record<string, any>)?.custom || {};
const postsPerPage = Number((packageConfig.config as Record<string, any>)?.posts_per_page) || DEFAULT_POSTS_PER_PAGE;

registerHelpers();

const renderServer = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
  handleRequest(request, response).catch((error: Error) => {
    console.error('[preview] Render failed:', error);
    sendHtml(response, 500, renderErrorPage(error));
  });
});

renderServer.listen(renderPort, '127.0.0.1', () => {
  browserSync.init(
    {
      proxy: `http://127.0.0.1:${renderPort}`,
      port: previewPort,
      open: autoOpen,
      notify: false,
      ghostMode: false,
      injectChanges: true,
      ui: false,
      files: [
        'assets/css/**/*.css',
        'assets/js/**/*.js',
        '*.hbs',
        'partials/**/*.hbs',
        'locales/**/*.json'
      ],
      reloadDebounce: 120,
      logPrefix: 'preview'
    },
    (error) => {
      if (error) {
        console.error('[preview] Failed to start BrowserSync:', error.message);
        process.exit(1);
      }
    }
  );

  console.log('\n========================================');
  console.log('  Attegi Local Preview');
  console.log('========================================');
  console.log(`  Content API: ${contentUrl}`);
  console.log(`  Preview URL: http://localhost:${previewPort}`);
  console.log(`  Renderer:    http://127.0.0.1:${renderPort}`);
  console.log('  Watching:    assets + hbs + locales');
  console.log('========================================\n');
});

function loadEnvFile(fileName: string): void {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function normalizeUrl(rawUrl: string | undefined): string {
  const value = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function parsePort(rawPort: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(rawPort || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(rawValue: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(rawValue || '').trim().toLowerCase());
}

function fillCountTemplate(template: string, value: string | number): string {
  return String(template).split('%').join(String(value));
}

function createGhostApi(siteUrl: string, key: string) {
  async function request(resource: string, params: Record<string, any> = {}): Promise<any> {
    const apiUrl = new URL(`${siteUrl}/ghost/api/content/${resource.replace(/^\/+/, '')}`);
    apiUrl.searchParams.set('key', key);
    Object.entries(params).forEach(([param, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        apiUrl.searchParams.set(param, String(value));
      }
    });

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Ghost API ${response.status} for ${apiUrl.pathname}`);
    }
    return response.json();
  }

  return {
    siteUrl,
    settings: () => request('settings/'),
    posts: (params?: Record<string, any>) => request('posts/', params),
    postBySlug: (slug: string) => request(`posts/slug/${encodeURIComponent(slug)}/`, { include: 'tags,authors' }),
    pages: (params?: Record<string, any>) => request('pages/', params),
    pageBySlug: (slug: string) => request(`pages/slug/${encodeURIComponent(slug)}/`, { include: 'tags,authors' }),
    tags: (params?: Record<string, any>) => request('tags/', params),
    tagBySlug: (slug: string) => request(`tags/slug/${encodeURIComponent(slug)}/`),
    authors: (params?: Record<string, any>) => request('authors/', params),
    authorBySlug: (slug: string) => request(`authors/slug/${encodeURIComponent(slug)}/`)
  };
}

async function handleRequest(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const requestUrl = new URL(request.url || '/', `http://localhost:${previewPort}`);
  const pathname = normalizePathname(requestUrl.pathname);

  if (pathname.startsWith('/assets/')) {
    serveAsset(pathname, response);
    return;
  }

  if (hasRequestExtension(pathname)) {
    await serveRemoteAsset(pathname, response);
    return;
  }

  const model = await buildRouteModel(pathname);
  sendHtml(response, model.status || 200, await renderRoute(model));
}

function normalizePathname(pathname: string | undefined): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function hasRequestExtension(pathname: string): boolean {
  return Boolean(path.extname(pathname));
}

function serveAsset(pathname: string, response: http.ServerResponse): void {
  const assetPath = path.normalize(path.join(ROOT, pathname));
  if (!assetPath.startsWith(path.join(ROOT, 'assets'))) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const ext = path.extname(assetPath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': ASSET_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(assetPath).pipe(response);
}

async function serveRemoteAsset(pathname: string, response: http.ServerResponse): Promise<void> {
  const remoteUrl = new URL(pathname.replace(/^\/+/, ''), withTrailingSlash(api.siteUrl));
  const remoteResponse = await fetch(remoteUrl);

  if (!remoteResponse.ok) {
    response.writeHead(remoteResponse.status || 404, { 'Cache-Control': 'no-store' });
    response.end('Not found');
    return;
  }

  response.writeHead(remoteResponse.status, {
    'Content-Type': remoteResponse.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });

  response.end(Buffer.from(await remoteResponse.arrayBuffer()));
}

async function buildRouteModel(pathname: string): Promise<any> {
  const common = await getCommonContext(pathname);

  if (pathname === '/' || pathname === '/en' || pathname === '/en/') {
    const isEn = pathname.startsWith('/en');
    const page = 1;
    const posts = await listPosts({
      page,
      limit: postsPerPage,
      filter: isEn ? 'tag:hash-en' : 'tag:-hash-en'
    });
    return {
      ...common,
      routeType: 'home',
      template: 'index',
      posts: posts.items,
      pagination: buildPagination(posts.meta.pagination, isEn ? '/en/' : '/')
    };
  }

  const pageMatch = pathname.match(/^\/(?:en\/)?page\/(\d+)$/);
  if (pageMatch) {
    const isEn = pathname.startsWith('/en');
    const page = Number(pageMatch[1]);
    const posts = await listPosts({
      page,
      limit: postsPerPage,
      filter: isEn ? 'tag:hash-en' : 'tag:-hash-en'
    });
    return {
      ...common,
      routeType: 'home',
      template: 'index',
      posts: posts.items,
      pagination: buildPagination(posts.meta.pagination, isEn ? '/en/' : '/')
    };
  }

  const tagMatch = pathname.match(/^\/(?:tag|column)\/([^/]+)(?:\/page\/(\d+))?$/);
  if (tagMatch) {
    const prefix = tagMatch[0].startsWith('/column') ? 'column' : 'tag';
    const slug = decodeURIComponent(tagMatch[1]);
    const page = Number(tagMatch[2] || 1);
    const [tagData, posts] = await Promise.all([
      api.tagBySlug(slug),
      listPosts({ filter: `tag:${slug}`, limit: postsPerPage, page })
    ]);
    return {
      ...common,
      routeType: 'tag',
      template: 'tag',
      tag: decorateTag(tagData.tags[0], common.site.url),
      posts: posts.items,
      pagination: buildPagination(posts.meta.pagination, `/${prefix}/${slug}/`)
    };
  }

  const authorMatch = pathname.match(/^\/author\/([^/]+)(?:\/page\/(\d+))?$/);
  if (authorMatch) {
    const slug = decodeURIComponent(authorMatch[1]);
    const page = Number(authorMatch[2] || 1);
    const [authorData, posts] = await Promise.all([
      api.authorBySlug(slug),
      listPosts({ filter: `author:${slug}`, limit: postsPerPage, page })
    ]);
    return {
      ...common,
      routeType: 'author',
      template: 'author',
      author: decorateAuthor(authorData.authors[0], common.site.url),
      posts: posts.items,
      pagination: buildPagination(posts.meta.pagination, `/author/${slug}/`)
    };
  }

  const slug = pathname.replace(/^\/en\//, '').replace(/^\//, '');
  const page = await maybe(() => api.pageBySlug(slug));
  if (page && page.pages && page.pages[0]) {
    const pageModel = decoratePost(page.pages[0], common.site.url, true);
    return {
      ...common,
      ...pageModel,
      routeType: 'page',
      template: selectPageTemplate(pageModel),
      post: pageModel,
      page: { show_title_and_feature_image: true }
    };
  }

  const post = await maybe(() => api.postBySlug(slug));
  if (post && post.posts && post.posts[0]) {
    const postModel = decoratePost(post.posts[0], common.site.url, false);
    postModel.comments = Boolean(common.ghost.commentsEnabled);
    const navPosts = await listPosts({ limit: 20 });
    const navIndex = navPosts.items.findIndex((item: any) => item.slug === postModel.slug);
    return {
      ...common,
      ...postModel,
      routeType: 'post',
      template: 'post',
      post: postModel,
      nextPost: navIndex >= 0 ? navPosts.items[navIndex - 1] : null,
      prevPost: navIndex >= 0 ? navPosts.items[navIndex + 1] : null,
      collections: {
        posts: navPosts.items
      }
    };
  }

  return {
    ...common,
    routeType: 'error',
    template: 'error-404',
    status: 404,
    // Ghost passes these at the top level of the error template context.
    statusCode: 404,
    message: 'Page not found'
  };
}

async function getCommonContext(pathname: string): Promise<any> {
  const settingsResponse = await api.settings();
  const ghostSettings = settingsResponse.settings || {};
  const site = buildSite(ghostSettings);
  const custom = buildCustomSettings();
  const previewUrl = `http://localhost:${previewPort}`;

  // For local development preview: provide fallback multilingual settings
  if (!custom.multilingual_locales) {
    custom.multilingual_locales = 'zh:中文, en:English';
  }

  const locales = (custom.multilingual_locales as string)
    .split(',')
    .map((s) => s.trim().split(':')[0].trim().toLowerCase())
    .filter(Boolean);

  for (const code of locales) {
    if (code && new RegExp(`^/${code}(/|$)`, 'i').test(pathname)) {
      site.locale = code;
      site.lang = code;
      break;
    }
  }

  site.url = previewUrl;
  site.navigation = decorateNavigation(site.navigation || [], pathname, previewUrl);

  return {
    site,
    custom,
    ghost: buildGhostContext(ghostSettings),
    currentPath: pathname,
    collections: {},
    member: null,
  };
}

function buildSite(settings: any): any {
  return {
    title: settings.title || 'Ghost',
    description: settings.description || settings.meta_description || '',
    url: api.siteUrl,
    locale: settings.locale || settings.lang || 'en',
    lang: settings.lang || settings.locale || 'en',
    logo: absolutizeUrl(settings.logo, api.siteUrl),
    icon: absolutizeUrl(settings.icon, api.siteUrl),
    cover_image: absolutizeUrl(settings.cover_image, api.siteUrl),
    ...Object.fromEntries(Object.keys(SOCIAL_URLS).map((key) => [key, settings[key] || ''])),
    accent_color: settings.accent_color || '',
    members_enabled: Boolean(settings.members_enabled),
    members_invite_only: Boolean(settings.members_invite_only),
    members_signup_access: settings.members_signup_access || 'all',
    recommendations_enabled: Boolean(settings.recommendations_enabled),
    donations_enabled: Boolean(settings.donations_enabled),
    navigation: settings.navigation || [],
    secondary_navigation: settings.secondary_navigation || []
  };
}

function buildGhostContext(settings: any): any {
  const siteUrl = withTrailingSlash(api.siteUrl);

  return {
    siteUrl,
    contentApiUrl: new URL('/ghost/api/content/', siteUrl).toString(),
    adminUrl: new URL('/ghost/', siteUrl).toString(),
    webmentionUrl: new URL('/webmentions/receive/', siteUrl).toString(),
    commentsCountsApiUrl: new URL('/members/api/comments/counts/', siteUrl).toString(),
    locale: settings.locale || settings.lang || 'en',
    accentColor: settings.accent_color || '',
    commentsEnabled: settings.comments_enabled || '',
    membersEnabled: Boolean(settings.members_enabled),
    membersInviteOnly: Boolean(settings.members_invite_only),
    codeinjectionHead: settings.codeinjection_head || '',
    codeinjectionFoot: settings.codeinjection_foot || '',
    version: settings.version || ''
  };
}

function buildCustomSettings(): Record<string, any> {
  const custom: Record<string, any> = {};
  Object.entries(themeCustom).forEach(([key, config]: [string, any]) => {
    custom[key] = config && Object.prototype.hasOwnProperty.call(config, 'default') ? config.default : '';
  });
  return custom;
}

async function listPosts(params: Record<string, any> = {}): Promise<any> {
  const data = await api.posts({
    include: params.include || 'tags,authors',
    filter: params.filter,
    limit: params.limit || postsPerPage,
    page: params.page || 1,
    order: params.order || 'published_at desc'
  });

  return {
    items: (data.posts || []).map((post: any) => decoratePost(post, api.siteUrl, false)),
    meta: data.meta || { pagination: {} }
  };
}

function buildPagination(pagination: any, basePath: string): any {
  return {
    page: pagination.page || 1,
    pages: pagination.pages || 1,
    total: pagination.total || 0,
    limit: pagination.limit || postsPerPage,
    next: pagination.next || null,
    prev: pagination.prev || null,
    basePath
  };
}

function decorateNavigation(items: any[], currentPath: string, siteUrl: string): any[] {
  const previewOrigin = new URL(siteUrl).origin;
  return items.map((item) => {
    const itemUrl = item.url || '/';
    const url = itemUrl.startsWith('http') ? itemUrl : new URL(itemUrl, siteUrl).toString();
    const parsed = new URL(url);
    const itemPath = normalizePathname(parsed.pathname);
    return {
      ...item,
      url,
      slug: slugify(item.label || itemPath),
      current: parsed.origin === previewOrigin && itemPath === currentPath
    };
  });
}

function decoratePost(post: any, siteUrl: string, isPage: boolean): any {
  const tags = (post.tags || []).map((tag: any) => decorateTag(tag, siteUrl));
  const authors = (post.authors || []).map((author: any) => decorateAuthor(author, siteUrl));
  const urlPath = isPage ? `/${post.slug}/` : `/${post.slug}/`;
  const html = absolutizeContentAssets(post.html || '', siteUrl);

  return {
    ...post,
    html,
    url: urlPath,
    canonical_url: new URL(urlPath, siteUrl).toString(),
    feature_image: absolutizeUrl(post.feature_image, siteUrl),
    tags,
    authors,
    primary_tag: tags[0] || null,
    primary_author: authors[0] || null,
    comments: false,
    reading_time: post.reading_time || readingTime(html)
  };
}

function decorateTag(tag: any, siteUrl: string): any {
  if (!tag) return null;
  return {
    ...tag,
    url: `/tag/${tag.slug}/`,
    feature_image: absolutizeUrl(tag.feature_image, siteUrl)
  };
}

function decorateAuthor(author: any, siteUrl: string): any {
  if (!author) return null;
  return {
    ...author,
    url: `/author/${author.slug}/`,
    profile_image: absolutizeUrl(author.profile_image, siteUrl),
    cover_image: absolutizeUrl(author.cover_image, siteUrl)
  };
}

function selectPageTemplate(page: any): string {
  if (page.slug === 'tags' && templateExists('page-tags')) return 'page-tags';
  if (page.slug === 'links' && templateExists('page-links')) return 'page-links';
  return 'page';
}

function templateExists(name: string): boolean {
  return fs.existsSync(path.join(ROOT, `${name}.hbs`));
}

async function renderRoute(model: any): Promise<string> {
  const collections = await buildCollections(model);
  const context = {
    ...model,
    '@site': model.site,
    '@custom': model.custom,
    __blocks: {},
    collections
  };
  const data = buildHandlebarsData(model, context);
  // Templates are re-read per request; partials must be too, or partial edits
  // only show up after a restart.
  registerPartials();
  const body = compileTemplate(model.template)(context, { data });
  const layoutContext = {
    ...context,
    body: new Handlebars.SafeString(body)
  };
  return compileTemplate('default')(layoutContext, { data: buildHandlebarsData(model, layoutContext) });
}

async function buildCollections(model: any): Promise<Record<string, any>> {
  const collections: Record<string, any> = { ...(model.collections || {}) };

  if (model.template === 'page-tags') {
    const tagData = await api.tags({
      include: 'count.posts',
      filter: 'visibility:public',
      limit: 100,
      order: 'created_at desc'
    });
    collections.tags = (tagData.tags || []).map((tag: any) => decorateTag(tag, api.siteUrl));
    const posts = await listPosts({ limit: 100 });
    collections.posts = posts.items;
  }

  if (!collections.posts) {
    const posts = await listPosts({ limit: 10 });
    collections.posts = posts.items;
  }

  return collections;
}

function buildHandlebarsData(model: any, root: any): any {
  return {
    root,
    site: model.site,
    custom: model.custom,
    page: model.page || {},
    member: model.member,
    routeType: model.routeType,
    currentPath: model.currentPath
  };
}

function compileTemplate(name: string): Handlebars.TemplateDelegate {
  let filePath = path.join(ROOT, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, 'index.hbs');
  }
  let source = fs.readFileSync(filePath, 'utf8');
  source = source.replace(/^\s*\{\{!<\s+default\s*\}\}\s*/, '');
  return Handlebars.compile(source, { noEscape: false });
}

function registerPartials(): void {
  const partialRoot = path.join(ROOT, 'partials');
  const files = walk(partialRoot).filter((file) => file.endsWith('.hbs'));
  files.forEach((file) => {
    const name = path.relative(partialRoot, file).replace(/\.hbs$/, '').split(path.sep).join('/');
    Handlebars.registerPartial(name, Handlebars.compile(fs.readFileSync(file, 'utf8')));
  });
}

function registerHelpers(): void {
  Handlebars.registerHelper('asset', (assetPath: any) => `/assets/${String(assetPath || '').replace(/^\/+/, '')}`);
  Handlebars.registerHelper('t', translate);
  Handlebars.registerHelper('encode', (value: any) => encodeURIComponent(String(value || '')));
  Handlebars.registerHelper('img_url', imageUrl);
  Handlebars.registerHelper('date', dateHelper);
  Handlebars.registerHelper('foreach', foreachHelper);
  Handlebars.registerHelper('post', contextBlock('post'));
  Handlebars.registerHelper('author', contextBlock('author'));
  Handlebars.registerHelper('tag', contextBlock('tag'));
  Handlebars.registerHelper('primary_author', contextBlock('primary_author'));
  Handlebars.registerHelper('next_post', contextBlock('nextPost'));
  Handlebars.registerHelper('prev_post', contextBlock('prevPost'));
  Handlebars.registerHelper('contentFor', contentForHelper);
  Handlebars.registerHelper('block', blockHelper);
  Handlebars.registerHelper('is', isHelper);
  Handlebars.registerHelper('has', hasHelper);
  Handlebars.registerHelper('match', matchHelper);
  Handlebars.registerHelper('plural', pluralHelper);
  Handlebars.registerHelper('url', urlHelper);
  Handlebars.registerHelper('page_url', pageUrlHelper);
  Handlebars.registerHelper('pagination', paginationHelper);
  Handlebars.registerHelper('navigation', navigationHelper);
  Handlebars.registerHelper('tags', tagsHelper);
  Handlebars.registerHelper('content', contentHelper);
  Handlebars.registerHelper('excerpt', excerptHelper);
  Handlebars.registerHelper('post_class', postClassHelper);
  Handlebars.registerHelper('body_class', bodyClassHelper);
  Handlebars.registerHelper('meta_title', metaTitleHelper);
  Handlebars.registerHelper('reading_time', readingTimeHelper);
  Handlebars.registerHelper('comment_count', commentCountHelper);
  Handlebars.registerHelper('comments', commentsHelper);
  Handlebars.registerHelper('ghost_head', ghostHeadHelper);
  Handlebars.registerHelper('ghost_foot', ghostFootHelper);
  Handlebars.registerHelper('get', getHelper);
  Handlebars.registerHelper('social_url', socialUrlHelper);
  Handlebars.registerHelper('link_class', linkClassHelper);
}

function translate(this: any, phrase: string, options: any): string {
  const root = options && options.data ? options.data.root || {} : {};
  const locale = root.site && root.site.locale ? root.site.locale : 'en';
  const messages = getLocaleMessages(locale);
  const hash = options && options.hash ? options.hash : {};
  let output = Object.prototype.hasOwnProperty.call(messages, phrase) ? messages[phrase] : String(phrase || '');
  Object.entries(hash).forEach(([key, value]: [string, any]) => {
    output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  return output;
}

function getLocaleMessages(locale: string): Record<string, string> {
  const normalized = String(locale || 'en').trim().toLowerCase().replace(/-/g, '_');
  const candidates = [normalized];

  if (normalized.includes('_')) {
    candidates.push(normalized.split('_')[0]);
  }

  candidates.push('en');

  for (const candidate of candidates) {
    if (localeCache.has(candidate)) {
      return localeCache.get(candidate)!;
    }

    const filePath = path.join(ROOT, 'locales', `${candidate}.json`);
    if (!fs.existsSync(filePath)) continue;

    const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    localeCache.set(candidate, messages);
    return messages;
  }

  return {};
}

function imageUrl(image: any, options: any): string {
  const url = absolutizeUrl(image, api.siteUrl);
  if (!url) return '';

  const hash = options && options.hash ? options.hash : {};
  if (hash.absolute === 'true' || hash.absolute === true) {
    return url;
  }
  return url;
}

function dateHelper(this: any, value: any, options: any): string {
  let dateValue = value;
  let hash = options && options.hash ? options.hash : {};

  if (arguments.length === 1 || (options && options.name === 'date')) {
    dateValue = this?.published_at || this?.created_at || new Date();
    hash = value && value.hash ? value.hash : {};
  }

  const date = new Date(dateValue || new Date());
  const format = hash.format || 'MMM DD, YYYY';

  if (format === 'YYYY') return String(date.getFullYear());
  if (format === 'YYYY-MM-DD') return date.toISOString().slice(0, 10);
  if (format === 'x') return String(date.getTime());
  if (format === 'MMM D') return formatDate(date, { month: 'short', day: 'numeric' });
  if (format === 'MMM DD, YYYY') return formatDate(date, { month: 'short', day: '2-digit', year: 'numeric' });
  if (format === 'MMMM DD, YYYY') return formatDate(date, { month: 'long', day: '2-digit', year: 'numeric' });
  if (format === 'MMMM D, YYYY') return formatDate(date, { month: 'long', day: 'numeric', year: 'numeric' });
  return formatDate(date, { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en', options).format(date);
}

function foreachHelper(this: any, collection: any, options: any): string {
  const hash = options.hash || {};
  let items = Array.isArray(collection) ? collection : [];
  if (hash.visibility === 'public') {
    items = items.filter((item) => !item || item.visibility !== 'internal');
  }
  const limit = Number(hash.limit) || items.length;
  const visibleItems = items.slice(0, limit);

  if (!visibleItems.length) {
    return options.inverse ? options.inverse(this) : '';
  }

  return visibleItems.map((item, index) => {
    const data = Handlebars.createFrame(options.data || {});
    data.index = index;
    data.first = index === 0;
    data.last = index === visibleItems.length - 1;
    return options.fn(item, { data });
  }).join('');
}

function contextBlock(key: string) {
  return function contextBlockHelper(this: any, options: any): string {
    const root = options.data.root || {};
    const value = this?.[key] || root[key] || null;
    if (value) {
      return options.fn(value);
    }
    return options.inverse ? options.inverse(this) : '';
  };
}

function contentForHelper(this: any, name: string, options: any): string {
  const root = options.data.root;
  root.__blocks = root.__blocks || {};
  root.__blocks[name] = (root.__blocks[name] || '') + options.fn(this);
  return '';
}

function blockHelper(name: string, options: any): Handlebars.SafeString {
  const root = options.data.root || {};
  return new Handlebars.SafeString(root.__blocks && root.__blocks[name] ? root.__blocks[name] : '');
}

function isHelper(this: any, routeType: string, options: any): any {
  const current = options.data.routeType;
  const wanted = String(routeType || '').split(',').map((item) => item.trim());
  return wanted.includes(current) ? options.fn(this) : options.inverse(this);
}

function hasHelper(this: any, options: any): any {
  const tagName = options.hash && options.hash.tag;
  if (!tagName) return options.inverse(this);

  const normalized = String(tagName).replace(/^#/, '');
  const tags = this?.tags || [];
  const found = tags.some((tag: any) => tag.slug === normalized || tag.name === tagName || tag.name === normalized);
  return found ? options.fn(this) : options.inverse(this);
}

function matchHelper(this: any, left: any, operator: string, right: any, options: any): any {
  let result = false;
  switch (operator) {
    case '!=':
    case '!==':
      result = left !== right;
      break;
    case '=':
    case '==':
    case '===':
      result = left === right;
      break;
    case '>':
      result = Number(left) > Number(right);
      break;
    case '<':
      result = Number(left) < Number(right);
      break;
    case '>=':
      result = Number(left) >= Number(right);
      break;
    case '<=':
      result = Number(left) <= Number(right);
      break;
    default:
      result = left === operator;
      break;
  }
  return result ? options.fn(this) : options.inverse(this);
}

function pluralHelper(count: any, options: any): string {
  const value = Number(count) || 0;
  const hash = options.hash || {};
  if (value === 0) return hash.empty || '';
  const template = value === 1 ? (hash.singular || '%') : (hash.plural || '%');
  return fillCountTemplate(template, value);
}

function urlHelper(this: any, options: any): string {
  const itemUrl = this?.url || '/';
  if (options.hash && (options.hash.absolute === 'true' || options.hash.absolute === true)) {
    return new URL(itemUrl, api.siteUrl).toString();
  }
  return itemUrl;
}

function pageUrlHelper(page: any, options: any): string {
  const root = options.data.root || {};
  const pagination = root.pagination || {};
  if (Number(page) <= 1) return pagination.basePath || '/';
  return `${pagination.basePath || '/'}page/${page}/`;
}

function paginationHelper(options: any): Handlebars.SafeString {
  return new Handlebars.SafeString((Handlebars.partials as any).pagination(options.data.root.pagination || {}, { data: options.data }));
}

function navigationHelper(options: any): Handlebars.SafeString {
  const root = options.data.root || {};
  const secondary = options.hash && options.hash.type === 'secondary';
  const navigation = (secondary ? root.site.secondary_navigation : root.site.navigation) || [];
  return new Handlebars.SafeString((Handlebars.partials as any).navigation({ navigation, isSecondary: secondary }, { data: options.data }));
}

function tagsHelper(this: any, options: any): Handlebars.SafeString {
  const tags = (this?.tags || []).filter((tag: any) => tag.visibility !== 'internal');
  const separator = options.hash && options.hash.separator !== undefined ? options.hash.separator : ', ';
  return new Handlebars.SafeString(tags.map((tag: any) => `<a href="${tag.url}">${escapeHtml(tag.name)}</a>`).join(separator));
}

function contentHelper(this: any): Handlebars.SafeString {
  return new Handlebars.SafeString(this?.html || this?.content || '');
}

function excerptHelper(this: any, options: any): string {
  const hash = options.hash || {};
  let text = this?.excerpt || stripHtml(this?.html || '');

  if (hash.words) {
    text = text.split(/\s+/).filter(Boolean).slice(0, Number(hash.words)).join(' ');
  }

  if (hash.characters) {
    text = text.slice(0, Number(hash.characters));
  }

  return text;
}

function postClassHelper(this: any): string {
  const classes = ['post'];
  if (this?.featured) classes.push('featured');
  if (this?.page) classes.push('page');
  if (this?.tags) {
    this.tags.slice(0, 3).forEach((tag: any) => classes.push(`tag-${tag.slug}`));
  }
  return classes.join(' ');
}

function bodyClassHelper(options: any): string {
  const routeType = options.data.routeType;
  const root = options.data.root || {};
  const classes: string[] = [];

  if (routeType) {
    classes.push(`${routeType}-template`);
  }

  if (routeType === 'post' && root.post && Array.isArray(root.post.tags)) {
    root.post.tags.forEach((tag: any) => {
      if (tag && tag.slug) {
        classes.push(`tag-${tag.slug}`);
      }
    });
  }

  return Array.from(new Set(classes)).join(' ');
}

function metaTitleHelper(options: any): string {
  const root = options.data.root || {};
  if (root.title) return root.title;
  if (root.tag && root.tag.name) return root.tag.name;
  if (root.author && root.author.name) return root.author.name;
  return root.site ? root.site.title : 'Ghost';
}

function readingTimeHelper(this: any, options: any): string {
  const minutes = this?.reading_time || readingTime(this?.html || '');
  const hash = options.hash || {};
  if (minutes === 1 && hash.minute) return hash.minute;
  if (hash.minutes) return fillCountTemplate(hash.minutes, minutes);
  return `${minutes} min read`;
}

function commentCountHelper(this: any, options: any): Handlebars.SafeString {
  const hash = options.hash || {};
  const postId = this?.id || '';
  const autowrapRaw = hash.autowrap;
  const autowrap = !(
    autowrapRaw === false ||
    String(autowrapRaw || '').trim().toLowerCase() === 'false'
  );

  if (!postId) {
    return hash.empty || '0 comments';
  }

  return new Handlebars.SafeString(
    `<script data-ghost-comment-count="${escapeHtml(postId)}" data-ghost-comment-count-empty="${escapeHtml(hash.empty || '0 comments')}" data-ghost-comment-count-singular="${escapeHtml(hash.singular || 'comment')}" data-ghost-comment-count-plural="${escapeHtml(hash.plural || 'comments')}" data-ghost-comment-count-tag="script" data-ghost-comment-count-class-name="" data-ghost-comment-count-autowrap="${autowrap ? 'true' : 'false'}"></script>`
  );
}

function commentsHelper(this: any, options: any): Handlebars.SafeString | string {
  const root = options.data.root || {};
  const ghost = root.ghost || {};
  const hash = options.hash || {};
  const postId = this?.id || '';

  if (!postId || !ghost.siteUrl || !contentKey) {
    return '';
  }

  return new Handlebars.SafeString(
    `<script defer src="https://cdn.jsdelivr.net/ghost/comments-ui@~1.4/umd/comments-ui.min.js" data-locale="${escapeHtml(ghost.locale || 'en')}" data-ghost-comments="${escapeHtml(ghost.siteUrl)}" data-api="${escapeHtml(ghost.contentApiUrl || '')}" data-admin="${escapeHtml(ghost.adminUrl || '')}" data-key="${escapeHtml(contentKey)}" data-title="${escapeHtml(hash.title || '')}" data-count="${hash.count === false ? 'false' : 'true'}" data-post-id="${escapeHtml(postId)}" data-color-scheme="auto" data-avatar-saturation="60" data-accent-color="${escapeHtml(ghost.accentColor || '')}" data-comments-enabled="${escapeHtml(ghost.commentsEnabled || '')}" data-publication="${escapeHtml(root.site && root.site.title ? root.site.title : '')}" crossorigin="anonymous"></script>`
  );
}

function ghostHeadHelper(options: any): Handlebars.SafeString {
  const title = escapeHtml(metaTitleHelper(options));
  const root = options.data.root || {};
  const ghost = root.ghost || {};
  const siteUrl = ghost.siteUrl || withTrailingSlash(api.siteUrl);
  const parts = [
    '<meta name="generator" content="Attegi local preview">',
    `<meta property="og:title" content="${title}">`
  ];

  if (ghost.membersEnabled) {
    parts.push(
      `<script defer src="https://cdn.jsdelivr.net/ghost/portal@~2.68/umd/portal.min.js" data-i18n="true" data-ghost="${escapeHtml(siteUrl)}" data-key="${escapeHtml(contentKey || '')}" data-api="${escapeHtml(ghost.contentApiUrl || '')}" data-locale="${escapeHtml(ghost.locale || 'en')}" crossorigin="anonymous"></script>`
    );
  }

  parts.push(
    `<script defer src="https://cdn.jsdelivr.net/ghost/sodo-search@~1.8/umd/sodo-search.min.js" data-key="${escapeHtml(contentKey || '')}" data-styles="https://cdn.jsdelivr.net/ghost/sodo-search@~1.8/umd/main.css" data-sodo-search="${escapeHtml(siteUrl)}" data-locale="${escapeHtml(ghost.locale || 'en')}" crossorigin="anonymous"></script>`,
    `<link href="${escapeHtml(ghost.webmentionUrl || '')}" rel="webmention">`,
    `<script defer src="${escapeHtml(new URL('/public/cards.min.js', siteUrl).toString())}"></script>`,
    `<link rel="stylesheet" type="text/css" href="${escapeHtml(new URL('/public/cards.min.css', siteUrl).toString())}">`,
    `<script defer src="${escapeHtml(new URL('/public/comment-counts.min.js', siteUrl).toString())}" data-ghost-comments-counts-api="${escapeHtml(ghost.commentsCountsApiUrl || '')}"></script>`,
    `<script defer src="${escapeHtml(new URL('/public/member-attribution.min.js', siteUrl).toString())}"></script>`
  );

  if (ghost.accentColor) {
    parts.push(`<style>:root {--ghost-accent-color: ${escapeHtml(ghost.accentColor)};}</style>`);
  }

  if (ghost.codeinjectionHead) {
    parts.push(ghost.codeinjectionHead);
  }

  return new Handlebars.SafeString(parts.join(''));
}

function ghostFootHelper(options: any): Handlebars.SafeString {
  const root = options.data.root || {};
  const ghost = root.ghost || {};
  return new Handlebars.SafeString(ghost.codeinjectionFoot || '');
}

// Settings/author key -> profile URL. Ghost stores handles; these shapes
// approximate Ghost's own social_url output.
const SOCIAL_URLS: Record<string, (v: string) => string> = {
  twitter: (v: string) => `https://x.com/${v.replace(/^@/, '')}`,
  facebook: (v: string) => `https://www.facebook.com/${v}`,
  linkedin: (v: string) => `https://www.linkedin.com/in/${v}`,
  bluesky: (v: string) => `https://bsky.app/profile/${v.replace(/^@/, '')}`,
  threads: (v: string) => `https://www.threads.net/@${v.replace(/^@/, '')}`,
  mastodon: (v: string) => {
    const [user, host] = v.replace(/^@/, '').split('@');
    return host ? `https://${host}/@${user}` : `https://${v}`;
  },
  tiktok: (v: string) => `https://www.tiktok.com/@${v.replace(/^@/, '')}`,
  youtube: (v: string) => `https://www.youtube.com/${v}`,
  instagram: (v: string) => `https://www.instagram.com/${v.replace(/^@/, '')}`
};

// Same lookup order as Ghost: the current context (an author), then @site.
function socialUrlHelper(this: any, options: any): string {
  const type = options.hash && options.hash.type;
  const site = (options.data.root || {}).site || {};
  const value = (this && this[type]) || site[type];
  if (!value || !SOCIAL_URLS[type]) return '';
  return /^https?:\/\//.test(value) ? value : SOCIAL_URLS[type](value);
}

// Registered so a bare {{link_class}} fails here the way it does in Ghost,
// instead of silently resolving a same-named context property.
function linkClassHelper(options: any): string {
  const hash = (options && options.hash) || {};
  if (!hash.for) throw new Error('The {{link_class}} helper requires a for="" attribute.');
  return hash.class || '';
}

function getHelper(this: any, resource: string, options: any): any {
  const root = options.data.root || {};
  const collections = root.collections || {};
  const hash = options.hash || {};

  if (resource === 'tags') {
    const tags = collections.tags || [];
    return options.fn({ tags }, { blockParams: [tags] });
  }

  if (resource === 'posts') {
    const posts = collections.posts || [];
    const limit = Number(hash.limit) || posts.length;
    const result = posts.slice(0, limit);
    return options.fn({ posts: result }, { blockParams: [result] });
  }

  return options.inverse ? options.inverse(this) : '';
}

function renderErrorPage(error: any): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Attegi preview error</title></head><body><pre>${escapeHtml(error.stack || error.message)}</pre></body></html>`;
}

function sendHtml(response: http.ServerResponse, status: number, html: string): void {
  // An explicit length keeps BrowserSync's snippet rewrite from emitting chunked + content-length together
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=UTF-8',
    'Content-Length': Buffer.byteLength(html),
    'Cache-Control': 'no-store'
  });
  response.end(html);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function absolutizeUrl(value: any, siteUrl: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, siteUrl).toString();
}

function withTrailingSlash(value: string): string {
  return /\/$/.test(value) ? value : `${value}/`;
}

function absolutizeContentAssets(html: string, siteUrl: string): string {
  return String(html || '').replace(/(src|href)="\/(?!\/)/g, `$1="${siteUrl}/`);
}

function readingTime(html: string): number {
  const text = stripHtml(html);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function stripHtml(html: string): string {
  return String(html || '').replace(/<[^>]+>/g, ' ');
}

function slugify(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function maybe<T>(fn: () => Promise<T>): Promise<T | null> {
  return fn().catch((error: Error) => {
    if (/Ghost API 404/.test(error.message)) return null;
    throw error;
  });
}

function escapeHtml(value: any): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shutdown(): void {
  browserSync.exit();
  renderServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
