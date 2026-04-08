import { ClientConstants } from '../../../common/constants/clientConstants.constant';

const { LOCALE } = ClientConstants.TimeFormat;
const {
  BOUNDS_DISPLAY_FORMAT_OPTIONS,
  BOUNDS_DISPLAY_FORMAT_OPTIONS_UTC,
  DATETIME_LOCAL_PAD_LENGTH,
  DATETIME_PAD_CHAR,
} = ClientConstants.TelemetryInvestigationUi;

export function formatTelemetryBoundsDateDisplay(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, BOUNDS_DISPLAY_FORMAT_OPTIONS);
}

export function formatTelemetryBoundsDateDisplayUtc(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, BOUNDS_DISPLAY_FORMAT_OPTIONS_UTC);
}

export function isoTimestampToDatetimeLocalValue(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(DATETIME_LOCAL_PAD_LENGTH, DATETIME_PAD_CHAR);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
