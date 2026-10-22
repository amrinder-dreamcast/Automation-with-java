import { z } from 'zod';

export const TargetScopeSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 11)),
  projectId: z.string(),
  primaryUrl: z.string().url(),
  allowedDomains: z.array(z.string()).default([]),
  allowSubdomains: z.boolean().default(true),
  allowExternalLinks: z.boolean().default(false),
  maxCrawlDepth: z.number().int().min(1).max(10).default(3),
  maxPages: z.number().int().min(1).max(100).default(25),
  crawlTimeoutMs: z.number().int().min(5000).max(120000).default(30000),
  allowLocalTargets: z.boolean().default(false),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  primaryUrl: z.string().url(),
  allowedDomains: z.array(z.string()).optional(),
  allowSubdomains: z.boolean().default(true),
  maxPages: z.number().int().min(1).max(50).default(15),
  allowLocalTargets: z.boolean().default(false),
});

export const TriggerTestRunSchema = z.object({
  projectId: z.string(),
  primaryUrl: z.string().url().optional(),
  engines: z.object({
    functional: z.boolean().default(true),
    visual: z.boolean().default(true),
    accessibility: z.boolean().default(true),
    performance: z.boolean().default(true),
    security: z.boolean().default(true),
  }).default({
    functional: true,
    visual: true,
    accessibility: true,
    performance: true,
    security: true,
  }),
  maxPages: z.number().int().min(1).max(50).optional(),
  allowLocalTargets: z.boolean().optional(),
});

export const UpdateDefectStatusSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED']),
  notes: z.string().optional(),
});
