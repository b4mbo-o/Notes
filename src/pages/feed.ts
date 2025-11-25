import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const escape = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://notes.b4mboo.net';
  const posts = (await getCollection('posts'))
    .filter((p) => !p.data.draft && !p.data.hidden)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());

  const items = posts
    .map((post) => {
      const link = `${origin}/posts/${post.slug}/`;
      const pubDate = post.data.published.toUTCString();
      const description = escape(post.data.description || '');
      return `
        <item>
          <title><![CDATA[${post.data.title}]]></title>
          <link>${link}</link>
          <guid>${link}</guid>
          <pubDate>${pubDate}</pubDate>
          <description><![CDATA[${description}]]></description>
        </item>
      `;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>notes.b4mboo.net</title>
      <link>${origin}</link>
      <description>notes.b4mboo.net feed</description>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
