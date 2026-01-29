export class DateTimeUtil {
  public static combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
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
