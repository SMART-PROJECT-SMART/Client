import { Directive } from '@angular/core';
import {
  TIME_INPUT_NAVIGATION_KEYS,
  TIME_INPUT_VALID_PATTERN,
  TIME_INPUT_SEPARATOR,
  TIME_INPUT_DIGITS_BEFORE_COLON,
  TIME_INPUT_MAX_DIGITS,
  TIME_INPUT_MIN_PASTED_DIGITS,
  TIME_INPUT_HOUR_SLICE_END,
  TIME_INPUT_MINUTE_SLICE_START,
  TIME_INPUT_MINUTE_SLICE_END,
  TIME_INPUT_MINUTE_PAD_LENGTH,
  TIME_INPUT_MINUTE_PAD_CHAR,
} from './time-input.constants';

function isNavigationKey(event: KeyboardEvent): boolean {
  return (
    TIME_INPUT_NAVIGATION_KEYS.has(event.key) || event.ctrlKey || event.metaKey
  );
}

function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function isColonKey(key: string): boolean {
  return key === TIME_INPUT_SEPARATOR;
}

function isDigitKey(key: string): boolean {
  return key >= '0' && key <= '9';
}

function buildValueWithColonInserted(
  currentValue: string,
  newDigit: string
): string {
  return currentValue + TIME_INPUT_SEPARATOR + newDigit;
}

function applyValueAndDispatchInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.setSelectionRange(value.length, value.length);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function parsePastedDigitsIntoTime(pastedDigits: string): string | null {
  if (pastedDigits.length < TIME_INPUT_MIN_PASTED_DIGITS) {
    return null;
  }
  const hours = pastedDigits.slice(0, TIME_INPUT_HOUR_SLICE_END);
  const minutes =
    pastedDigits.length >= TIME_INPUT_MINUTE_SLICE_END
      ? pastedDigits.slice(TIME_INPUT_MINUTE_SLICE_START, TIME_INPUT_MINUTE_SLICE_END)
      : pastedDigits.slice(TIME_INPUT_MINUTE_SLICE_START);
  const sanitized = `${hours}${TIME_INPUT_SEPARATOR}${minutes.padEnd(
    TIME_INPUT_MINUTE_PAD_LENGTH,
    TIME_INPUT_MINUTE_PAD_CHAR
  )}`;
  return TIME_INPUT_VALID_PATTERN.test(sanitized) ? sanitized : null;
}

@Directive({
  selector: 'input[appTimeInput]',
  standalone: true,
  host: {
    '(keydown)': 'onKeyDown($event)',
    '(paste)': 'onPaste($event)',
  },
})
export class TimeInputDirective {
  onKeyDown(event: KeyboardEvent): void {
    if (isNavigationKey(event)) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value ?? '';
    const digits = getDigitsOnly(value);
    const hasColon = value.includes(TIME_INPUT_SEPARATOR);

    if (isColonKey(event.key)) {
      if (hasColon || value.length >= TIME_INPUT_DIGITS_BEFORE_COLON) {
        event.preventDefault();
      }
      return;
    }

    if (isDigitKey(event.key)) {
      if (digits.length >= TIME_INPUT_MAX_DIGITS) {
        event.preventDefault();
        return;
      }
      if (
        digits.length === TIME_INPUT_DIGITS_BEFORE_COLON &&
        !hasColon
      ) {
        event.preventDefault();
        const newValue = buildValueWithColonInserted(value, event.key);
        applyValueAndDispatchInput(input, newValue);
      }
      return;
    }

    event.preventDefault();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const raw = event.clipboardData?.getData('text') ?? '';
    const pastedDigits = getDigitsOnly(raw);
    const sanitized = parsePastedDigitsIntoTime(pastedDigits);
    if (sanitized !== null) {
      const input = event.target as HTMLInputElement;
      applyValueAndDispatchInput(input, sanitized);
    }
  }
}
