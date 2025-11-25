import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(280),
    published: z.string().transform((str) => new Date(str)),
    updated: z.string().transform((str) => new Date(str)).optional(),
    tags: z.array(z.string()).default([]),
    hero: z.string().optional(),
    draft: z.boolean().optional(),
    hidden: z.boolean().default(false),
  }),
});

export const collections = { posts };
