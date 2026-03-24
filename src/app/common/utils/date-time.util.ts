export class DateTimeUtil {
  public static combineDateAndTime(date: Date, time: string | Date): Date {
    const combined = new Date(date);

    if (typeof time === 'string') {
      const parts = time.trim().split(':').map(Number);
      const hours = parts[0] ?? 0;
      const minutes = parts[1] ?? 0;
      const seconds = parts.length > 2 ? (parts[2] ?? 0) : 0;
      combined.setHours(hours, minutes, seconds, 0);
    } else {
      combined.setHours(
        time.getHours(),
        time.getMinutes(),
        time.getSeconds(),
        time.getMilliseconds(),
      );
    }

    return combined;
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
}
