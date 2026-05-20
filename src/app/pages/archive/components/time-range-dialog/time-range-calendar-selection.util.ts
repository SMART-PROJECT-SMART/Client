import type { Dayjs } from 'dayjs';

export interface TimeRangeCalendarSelectionState {
  start: Dayjs;
  end: Dayjs | null;
}

const TIE_BREAK_REPLACES_HIGHER_ORDERED_ENDPOINT = true;

function orderedPair(a: Dayjs, b: Dayjs): { lo: Dayjs; hi: Dayjs } {
  return a.isBefore(b, 'day') ? { lo: a, hi: b } : { lo: b, hi: a };
}

export function computeNextCalendarSelection(
  clicked: Dayjs,
  current: TimeRangeCalendarSelectionState,
  initial: { start: Dayjs; end: Dayjs },
): TimeRangeCalendarSelectionState {
  if (current.end === null) {
    if (clicked.isSame(current.start, 'day')) {
      return {
        start: initial.start.clone(),
        end: initial.end.clone(),
      };
    }
    const { lo, hi } = orderedPair(current.start, clicked);
    return { start: lo, end: hi };
  }
  const { lo, hi } = orderedPair(current.start, current.end);
  if (clicked.isSame(lo, 'day')) {
    return { start: hi, end: null };
  }
  if (clicked.isSame(hi, 'day')) {
    return { start: lo, end: null };
  }
  const dLo = Math.abs(clicked.diff(lo, 'day'));
  const dHi = Math.abs(clicked.diff(hi, 'day'));
  let nextLo = lo;
  let nextHi = hi;
  if (dLo < dHi) {
    nextLo = clicked;
  } else if (dHi < dLo) {
    nextHi = clicked;
  } else if (TIE_BREAK_REPLACES_HIGHER_ORDERED_ENDPOINT) {
    nextHi = clicked;
  } else {
    nextLo = clicked;
  }
  const ordered = orderedPair(nextLo, nextHi);
  return { start: ordered.lo, end: ordered.hi };
}
