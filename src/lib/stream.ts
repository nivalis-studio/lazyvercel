/** biome-ignore-all lint/performance/noAwaitInLoops: . */
import type { ZodType } from 'zod';

type Props<T> = {
  schema: ZodType<T>;
  url: string;
  options?: RequestInit;
};
export async function* getStreamObjects<T>({ schema, url, options }: Props<T>) {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  if (!res.body) {
    throw new Error('Response has no body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          continue;
        }

        let raw: unknown;

        try {
          raw = JSON.parse(trimmed);
        } catch (error) {
          await reader.cancel(error);
          throw new Error(`Invalid JSON from stream: ${trimmed}`);
        }
        const parsed = schema.safeParse(raw);

        if (!parsed.success) {
          await reader.cancel(parsed.error);
        }

        yield parsed.data;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}
