import { z } from 'zod';

// Assigned once, at parse time, so a line keeps its key after older lines drop.
let nextLogEventId = 0;

const LOG_TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const formatLogTimestamp = (created: Date): string =>
  LOG_TIME_FORMAT.format(created);

export const logEventSchema = z
  .object({
    created: z.number().transform(val => new Date(val)),
    text: z.string(),
    level: z.enum(['warning', 'error']).optional(),
    type: z.string(),
  })
  .transform(event => {
    nextLogEventId += 1;
    return { ...event, id: nextLogEventId };
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
