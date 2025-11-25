import { getCollection } from 'astro:content';

export async function GET() {
  const posts = (await getCollection('posts'))
    .filter((post) => !post.data.draft && !post.data.hidden)
    .map((post) => ({
      slug: post.slug,
      title: post.data.title,
      description: post.data.description,
      published: post.data.published,
      tags: post.data.tags || [],
      hero: post.data.hero,
      url: `/posts/${post.slug}/`,
    }))
    .sort((a, b) => b.published.getTime() - a.published.getTime());

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
