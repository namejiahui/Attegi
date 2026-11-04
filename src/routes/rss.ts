import type { APIEvent } from "@solidjs/start/server";
import { ghost } from "../lib/ghost/index.js";

export async function GET(event: APIEvent) {
  const targetUrl = ghost.siteUrl;
  if (!targetUrl) {
    return new Response("Ghost URL not configured", { status: 500 });
  }

  try {
    const upstream = await fetch(`${targetUrl}/rss/`);
    if (!upstream.ok) {
      return new Response("Failed to fetch upstream RSS", { status: upstream.status });
    }

    let xml = await upstream.text();
    const siteUrl = new URL(event.request.url).origin;

    // Replace ghost backend origin with current frontend origin in feed and post links
    if (targetUrl !== siteUrl) {
      xml = xml.replaceAll(targetUrl, siteUrl);
    }

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
    });
  } catch (err: any) {
    return new Response(`RSS Error: ${err?.message || "Unknown error"}`, { status: 500 });
  }
}
