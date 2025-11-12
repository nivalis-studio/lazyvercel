/** biome-ignore-all lint/style/noMagicNumbers: yay */
function is(interval: number, cycle: number) {
  return cycle >= interval ? Math.floor(cycle / interval) : 0;
}

type Opts = {
  dateToCompare?: string | number | Date;
  short?: boolean;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: okay-ish
export function getTimeAgo(time_: string | number | Date, opts?: Opts): string {
  const { dateToCompare, short } = opts ?? {
    short: false,
    dateToCompare: Date.now(),
  };

  const now_ = dateToCompare ?? Date.now();
  const now = new Date(now_).getTime();

  let time = time_;
  if (typeof time === 'string' || time instanceof Date) {
    time = new Date(time).getTime();
  }

  const secs = (now - time) / 1000;
  const mins = is(60, secs);
  const hours = is(60, mins);
  const days = is(24, hours);
  const weeks = is(7, days);
  const months = is(30, days);
  const years = is(12, months);

  let amt = years;
  let cycle = 'year';

  if (years > 0) {
    amt = years;
    cycle = short ? 'y' : 'year';
  } else if (months > 0) {
    amt = months;
    cycle = short ? 'M' : 'month';
  } else if (weeks > 0) {
    amt = weeks;
    cycle = short ? 'w' : 'week';
  } else if (days > 0) {
    amt = days;
    cycle = short ? 'd' : 'day';
  } else if (hours > 0) {
    amt = hours;
    cycle = short ? 'h' : 'hour';
  } else if (mins > 0) {
    amt = mins;
    cycle = short ? 'm' : 'minutes';
  } else if (secs > 0) {
    amt = secs;
    cycle = short ? 's' : 'second';
  }

  const v = Math.floor(amt);

  if (short) {
    return `${v}${cycle}`;
  }

  return `${v === 1 ? (amt === hours ? 'an' : 'a') : v} ${cycle}${v > 1 ? 's' : ''} ago`;
}
