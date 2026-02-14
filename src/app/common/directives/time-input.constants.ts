export const TIME_INPUT_SEPARATOR = ':';
export const TIME_INPUT_DIGITS_BEFORE_COLON = 2;
export const TIME_INPUT_MAX_DIGITS = 4;
export const TIME_INPUT_MIN_PASTED_DIGITS = 2;
export const TIME_INPUT_HOUR_SLICE_END = 2;
export const TIME_INPUT_MINUTE_SLICE_START = 2;
export const TIME_INPUT_MINUTE_SLICE_END = 4;
export const TIME_INPUT_MINUTE_PAD_LENGTH = 2;
export const TIME_INPUT_MINUTE_PAD_CHAR = '0';

export const TIME_INPUT_NAVIGATION_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

export const TIME_INPUT_VALID_PATTERN = /^([01]?\d|2[0-3]):([0-5]?\d)$/;
