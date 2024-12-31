import { endOfDay, endOfMonth, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";
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


export const getDateRangeItems = (step?: number) => {
  return [
    {
      label: "Tất cả thời gian",
      from: new Date("2000-01-01"),
      to: new Date("2100-12-30"),
    },
    {
      label:
        step && step !== 0
          ? new Date(
              new Date().setDate(new Date().getDate() + step)
            ).toLocaleDateString("vi-VN")
          : `Hôm nay (${new Date().toLocaleDateString("vi-VN")})`,
      from:
        step && step !== 0
          ? startOfDay(new Date(new Date().setDate(new Date().getDate() + step)))
          : startOfDay(new Date()),
      to:
        step && step !== 0
          ? endOfDay(new Date(new Date().setDate(new Date().getDate() + step)))
          : endOfDay(new Date()),
    },
    {
      label:
        step && step !== 0
          ? `${startOfWeek(
              new Date(new Date().setDate(new Date().getDate() + step))
            ).toLocaleDateString("vi-VN")} - ${endOfWeek(
              new Date(new Date().setDate(new Date().getDate() + step))
            ).toLocaleDateString("vi-VN")}`
          : `Tuần này (${startOfWeek(new Date()).toLocaleDateString(
              "vi-VN"
            )} - ${endOfWeek(new Date()).toLocaleDateString("vi-VN")})`,
      from:
        step && step !== 0
          ? startOfWeek(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : startOfWeek(new Date()),
      to:
        step && step !== 0
          ? endOfWeek(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : endOfWeek(new Date()),
    },
    {
      label:
        step && step !== 0
          ? `${
              new Date(
                new Date().setDate(new Date().getDate() + step)
              ).getMonth() + 1
            }/${new Date(
              new Date().setDate(new Date().getDate() + step)
            ).getFullYear()}`
          : `Tháng này (${
              new Date().getMonth() + 1
            }/${new Date().getFullYear()})`,
      from:
        step && step !== 0
          ? startOfMonth(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : startOfMonth(new Date()),
      to:
        step && step !== 0
          ? endOfMonth(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : endOfMonth(new Date()),
    },
    {
      label:
        step && step !== 0
          ? new Date(
              new Date().setDate(new Date().getDate() + step)
            ).getFullYear()
          : `Năm nay (${new Date().getFullYear()})`,
      from:
        step && step !== 0
          ? startOfYear(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : startOfYear(new Date()),
      to:
        step && step !== 0
          ? endOfYear(
              new Date(new Date().setDate(new Date().getDate() + step))
            )
          : endOfYear(new Date()),
    },
  ];
};

export const getStepByIndex = (index: number) => {
  switch (index) {
    case 2:
      return 7;
    case 3:
      return 31;
    case 4:
      return 366;
    default:
      return 1;
  }
};
