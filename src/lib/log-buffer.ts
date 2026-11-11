// Finished and live builds can run to tens of thousands of lines. A fixed
// window keeps each flush bounded and lets the log view memoize what remains.
export const MAX_LOG_LINES = 5000;

export type CappedLogs<T> = {
  logs: Array<T>;
  droppedCount: number;
};

export const capLogs = <T>(
  logs: ReadonlyArray<T>,
  maxLines: number = MAX_LOG_LINES,
): CappedLogs<T> => {
  if (logs.length <= maxLines) {
    return { logs: logs as Array<T>, droppedCount: 0 };
  }

  const droppedCount = logs.length - maxLines;
  return { logs: logs.slice(droppedCount), droppedCount };
};

export const appendCappedLogs = <T>(
  previous: ReadonlyArray<T>,
  batch: ReadonlyArray<T>,
  droppedCount: number,
  maxLines: number = MAX_LOG_LINES,
): CappedLogs<T> => {
  if (batch.length === 0) {
    return { logs: previous as Array<T>, droppedCount };
  }

  const combined = previous.length + batch.length;
  if (combined <= maxLines) {
    return { logs: previous.concat(batch), droppedCount };
  }

  const overflow = combined - maxLines;
  const logs =
    overflow >= previous.length
      ? batch.slice(batch.length - maxLines)
      : previous.slice(overflow).concat(batch);

  return { logs, droppedCount: droppedCount + overflow };
};
