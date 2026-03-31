export class DateTimeUtil {
  private static readonly TimePickerReferenceYear = 2000;
  private static readonly TimePickerReferenceMonthIndex = 0;
  private static readonly TimePickerReferenceDayOfMonth = 1;
  private static readonly UtcTimeStringPartsLength = 3;
  private static readonly TimeFieldZeroPadLength = 2;

  public static combineDateAndTime(date: Date, time: string | Date): Date {
    const y = date.getFullYear();
    const mo = date.getMonth();
    const d = date.getDate();
    let h = 0;
    let mi = 0;
    let s = 0;
    let ms = 0;

    if (typeof time === 'string') {
      const parts = time.trim().split(':').map(Number);
      h = parts[0] ?? 0;
      mi = parts[1] ?? 0;
      s = parts.length > 2 ? (parts[2] ?? 0) : 0;
    } else {
      h = time.getHours();
      mi = time.getMinutes();
      s = time.getSeconds();
      ms = time.getMilliseconds();
    }

    return new Date(y, mo, d, h, mi, s, ms);
  }

  public static localTimeOfDayForPicker(source: Date): Date {
    return new Date(
      DateTimeUtil.TimePickerReferenceYear,
      DateTimeUtil.TimePickerReferenceMonthIndex,
      DateTimeUtil.TimePickerReferenceDayOfMonth,
      source.getHours(),
      source.getMinutes(),
      source.getSeconds(),
      source.getMilliseconds(),
    );
  }

  public static formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  public static separateDateAndTime(date: Date): { date: Date; time: string } {
    return {
      date: new Date(date),
      time: this.formatTimeForInput(date),
    };
  }

  public static utcTimeStringFromDate(source: Date): string {
    const pad = (n: number) => String(n).padStart(DateTimeUtil.TimeFieldZeroPadLength, '0');
    return `${pad(source.getUTCHours())}:${pad(source.getUTCMinutes())}:${pad(source.getUTCSeconds())}`;
  }

  public static combineUtcDateAndTime(utcDateAnchor: Date, time: string | Date): Date {
    const y = utcDateAnchor.getUTCFullYear();
    const mo = utcDateAnchor.getUTCMonth();
    const d = utcDateAnchor.getUTCDate();
    let h = 0;
    let mi = 0;
    let s = 0;
    let ms = 0;
    if (typeof time === 'string') {
      const trimmed = time.trim();
      const parts = trimmed.split(':').map((p) => Number(p));
      h = parts[0] ?? 0;
      mi = parts[1] ?? 0;
      s = parts.length >= DateTimeUtil.UtcTimeStringPartsLength ? (parts[2] ?? 0) : 0;
    } else {
      h = time.getUTCHours();
      mi = time.getUTCMinutes();
      s = time.getUTCSeconds();
      ms = time.getUTCMilliseconds();
    }
    return new Date(Date.UTC(y, mo, d, h, mi, s, ms));
  }
}
