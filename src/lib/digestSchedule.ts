export const timezoneOptions = [
  { value: -12, label: 'UTC−12:00' },
  { value: -11, label: 'UTC−11:00' },
  { value: -10, label: 'UTC−10:00 · Hawaii' },
  { value: -9.5, label: 'UTC−09:30 · Marquesas' },
  { value: -9, label: 'UTC−09:00 · Alaska' },
  { value: -8, label: 'UTC−08:00 · Pacific' },
  { value: -7, label: 'UTC−07:00 · Mountain' },
  { value: -6, label: 'UTC−06:00 · Central' },
  { value: -5, label: 'UTC−05:00 · Eastern' },
  { value: -4, label: 'UTC−04:00 · Atlantic' },
  { value: -3.5, label: 'UTC−03:30 · Newfoundland' },
  { value: -3, label: 'UTC−03:00 · Brazil' },
  { value: -2.5, label: 'UTC−02:30 · Newfoundland daylight time' },
  { value: -2, label: 'UTC−02:00' },
  { value: -1, label: 'UTC−01:00 · Azores' },
  { value: 0, label: 'UTC±00:00 · London' },
  { value: 1, label: 'UTC+01:00 · Central Europe' },
  { value: 2, label: 'UTC+02:00 · Eastern Europe' },
  { value: 3, label: 'UTC+03:00 · East Africa' },
  { value: 3.5, label: 'UTC+03:30 · Tehran' },
  { value: 4, label: 'UTC+04:00 · Dubai' },
  { value: 4.5, label: 'UTC+04:30 · Kabul' },
  { value: 5, label: 'UTC+05:00 · Karachi' },
  { value: 5.5, label: 'UTC+05:30 · India' },
  { value: 5.75, label: 'UTC+05:45 · Nepal' },
  { value: 6, label: 'UTC+06:00 · Dhaka' },
  { value: 6.5, label: 'UTC+06:30 · Yangon' },
  { value: 7, label: 'UTC+07:00 · Bangkok' },
  { value: 8, label: 'UTC+08:00 · Singapore' },
  { value: 8.75, label: 'UTC+08:45 · Eucla' },
  { value: 9, label: 'UTC+09:00 · Tokyo' },
  { value: 9.5, label: 'UTC+09:30 · Adelaide' },
  { value: 10, label: 'UTC+10:00 · Sydney' },
  { value: 10.5, label: 'UTC+10:30 · Lord Howe' },
  { value: 11, label: 'UTC+11:00' },
  { value: 12, label: 'UTC+12:00 · Auckland' },
  { value: 12.75, label: 'UTC+12:45 · Chatham' },
  { value: 13, label: 'UTC+13:00' },
  { value: 13.75, label: 'UTC+13:45 · Chatham daylight time' },
  { value: 14, label: 'UTC+14:00' },
];

export const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  .map((label, value) => ({ value, label }));

export const hourOptions = Array.from({ length: 15 }, (_, index) => {
  const value = index + 6;
  const period = value >= 12 ? 'PM' : 'AM';
  const displayHour = value === 12 ? 12 : value > 12 ? value - 12 : value;
  return { value, label: `${displayHour}:00 ${period}` };
});

export function getDefaultTimezoneOffset(): number {
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  return Math.max(-12, Math.min(14, Math.round(offsetHours * 4) / 4));
}

export function formatUtcOffset(offset: number): string {
  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const sign = offset === 0 ? '±' : offset > 0 ? '+' : '−';
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatDeliveryTime(hour: number, offset: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period} ${formatUtcOffset(offset)}`;
}
