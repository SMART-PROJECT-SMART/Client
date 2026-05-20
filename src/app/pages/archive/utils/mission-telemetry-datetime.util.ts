import { ClientConstants } from '../../../common/constants/clientConstants.constant';

const { LOCALE } = ClientConstants.TimeFormat;
const {
  BOUNDS_DISPLAY_FORMAT_OPTIONS,
  BOUNDS_DISPLAY_FORMAT_OPTIONS_UTC,
  BOUNDS_DISPLAY_FORMAT_OPTIONS_INVESTIGATION,
  DATETIME_LOCAL_PAD_LENGTH,
  DATETIME_PAD_CHAR,
  INVESTIGATION_DISPLAY_TIME_ZONE,
} = ClientConstants.TelemetryInvestigationUi;

export function formatTelemetryBoundsDateDisplay(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, BOUNDS_DISPLAY_FORMAT_OPTIONS);
}

export function formatTelemetryBoundsDateDisplayUtc(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, BOUNDS_DISPLAY_FORMAT_OPTIONS_UTC);
}

export function formatTelemetryBoundsDateDisplayInvestigation(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, BOUNDS_DISPLAY_FORMAT_OPTIONS_INVESTIGATION);
}

export function isoTimestampToInvestigationWallClock(isoString: string): string {
  return isoTimestampToWallClockInTimeZone(
    isoString,
    INVESTIGATION_DISPLAY_TIME_ZONE,
    DATETIME_LOCAL_PAD_LENGTH,
    DATETIME_PAD_CHAR,
  );
}

function isoTimestampToWallClockInTimeZone(
  isoString: string,
  timeZone: string,
  padLength: number,
  padChar: string,
): string {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const pad = (v: string) => v.padStart(padLength, padChar);
  const y = get('year');
  const mo = get('month');
  const da = get('day');
  const h = get('hour');
  const mi = get('minute');
  const s = get('second');
  return `${y}-${pad(mo)}-${pad(da)}T${pad(h)}:${pad(mi)}:${pad(s)}`;
}
