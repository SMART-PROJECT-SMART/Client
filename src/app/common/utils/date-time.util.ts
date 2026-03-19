export class DateTimeUtil {
  public static combineDateAndTime(date: Date, time: string | Date): Date {
    const combined = new Date(date);

    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      combined.setHours(hours, minutes, 0, 0);
    } else {
      // time is a Date object from MatTimepicker
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
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
