import { Currencies } from "./currencies";

export function DateToUTCDate(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

export function GetFormatterForCurrency(currency: string) {
  const locale =
    Currencies.find((c) => c.value === currency)?.locale || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
}
