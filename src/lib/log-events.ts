import { z } from 'zod';

export const logEventSchema = z.object({
  created: z.number().transform(val => new Date(val)),
  text: z.string(),
  level: z.enum(['warning', 'error']).optional(),
  type: z.string(),
});

export type LogEvent = z.infer<typeof logEventSchema>;

// Keep every event that matches the schema, in order; drop the rest (same
// rule as the live stream in src/lib/stream.ts).
export const parseLogEvents = (body: unknown): Array<LogEvent> => {
  if (!Array.isArray(body)) {
    throw new Error('Unexpected deployment events response: expected an array');
  }

  const events: Array<LogEvent> = [];
  for (const item of body) {
    const parsed = logEventSchema.safeParse(item);
    if (parsed.success) {
      events.push(parsed.data);
    }
  }
  return events;
};
