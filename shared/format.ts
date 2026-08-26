export function formatFaNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("fa-IR", options).format(value);
}

export function formatFaDecimal(value: number, minimumFractionDigits = 2): string {
  return formatFaNumber(value, { minimumFractionDigits, maximumFractionDigits: minimumFractionDigits });
}

export function formatFaTime(hour: number, minute: number): string {
  return `${formatFaNumber(hour, { minimumIntegerDigits: 2, maximumFractionDigits: 0 })}:${formatFaNumber(minute, { minimumIntegerDigits: 2, maximumFractionDigits: 0 })}`;
}
