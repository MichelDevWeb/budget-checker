"use client";

import React from "react";
import { ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import {
  endOfMonth,
  endOfToday,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
} from "date-fns";
import CountUp from "react-countup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import PieChartOverview from "./PieChartOverview";
import MobileCategoriesStats from "./MobileCategoriesStats";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import useGesture, { GestureConfig } from "@/components/UseGesture";

const getDateRangeItems = (step?: number) => {
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
          ? new Date(new Date().setDate(new Date().getDate() + step))
          : new Date(),
      to:
        step && step !== 0
          ? new Date(new Date().setDate(new Date().getDate() + step))
          : new Date(),
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
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
            )
          : startOfWeek(new Date()),
      to:
        step && step !== 0
          ? endOfWeek(
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
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
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
            )
          : startOfMonth(new Date()),
      to:
        step && step !== 0
          ? endOfMonth(
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
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
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
            )
          : startOfYear(new Date()),
      to:
        step && step !== 0
          ? endOfYear(
              new Date(
                new Date(new Date().setDate(new Date().getDate() + step))
              )
            )
          : endOfYear(new Date()),
    },
  ];
};

const getStepByIndex = (index: number) => {
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

const MainContainer = ({ userSettings }: { userSettings: UserSettings }) => {
  const [dateRange, setDateRange] = React.useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfToday(),
    to: endOfToday(),
  });
  const [selectedDateRangeIndex, setSelectedDateRangeIndex] = React.useState(1);
  const [step, setStep] = React.useState<number>(0);
  const statsQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ["overview", "stats", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${dateRange.from}&to=${dateRange.to}`
      ).then((res) => res.json()),
  });

  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const income = statsQuery.data?.income || 0;
  const expense = statsQuery.data?.expense || 0;

  const balance = income - expense;

  const elementRef = React.useRef<HTMLDivElement>(null);

  const handleSwipeLeft: GestureConfig = {
    gesture: "swipeLeft",
    touchCount: 1,
    callback: () => {
      console.log("Swiped Left!");
      const _step = step + getStepByIndex(selectedDateRangeIndex);

      setStep(_step);
      console.log(_step);
      setDateRange({
        from: getDateRangeItems(_step)[selectedDateRangeIndex].from,
        to: getDateRangeItems(_step)[selectedDateRangeIndex].to,
      });
    },
    elementRef,
  };
  const handleSwipeRight: GestureConfig = {
    gesture: "swipeRight",
    touchCount: 1,
    callback: () => {
      console.log("Swiped Right!");
      const _step = step - getStepByIndex(selectedDateRangeIndex);

      setStep(_step);
      console.log(_step);
      setDateRange({
        from: getDateRangeItems(_step)[selectedDateRangeIndex].from,
        to: getDateRangeItems(_step)[selectedDateRangeIndex].to,
      });
    },
    elementRef,
  };

  useGesture(handleSwipeLeft);
  useGesture(handleSwipeRight);

  return (
    <div ref={elementRef} className="swipeable-container">
      {/* HEADER */}
      <div className="block border-separate bg-background">
        <div className="flex items-center justify-between px-4">
          <div></div>
          <div className="flex flex-col items-center gap-0">
            <p className="text-muted-foreground">Tất cả các tài khoản</p>
            <CountUp
              preserveValue
              redraw={false}
              end={balance}
              decimal="2"
              formattingFn={(value) => formatter.format(value)}
              className="text-2xl"
            />
          </div>
          <div></div>
        </div>
        <div className="flex items-center justify-between px-1 py-1 relative z-10">
          <ArrowLeftCircle
            className="h-10 w-10 opacity-75"
            onClick={() => handleSwipeRight.callback()}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"secondary"}>
                <b>{getDateRangeItems(step)[selectedDateRangeIndex].label}</b>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Chọn mốc thời gian</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getDateRangeItems().map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  className="flex items-center gap-2"
                  onSelect={() => {
                    setSelectedDateRangeIndex(index);
                    setDateRange({
                      from: item.from,
                      to: item.to,
                    });
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ArrowRightCircle
            className="h-10 w-10 opacity-75"
            onClick={() => handleSwipeLeft.callback()}
          />
        </div>
      </div>
      {/* OVERVIEW */}
      <Overview
        dateRange={dateRange}
        income={income}
        expense={expense}
        userSettings={userSettings}
      />
    </div>
  );
};

interface OverviewProps {
  dateRange: { from: Date; to: Date };
  income: number;
  expense: number;
  userSettings: UserSettings;
}

const Overview = ({
  dateRange,
  income,
  expense,
  userSettings,
}: OverviewProps) => {
  const [type, setType] = React.useState<"expense" | "income">("expense");
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?type=${type}&from=${DateToUTCDate(
          dateRange.from
        )}&to=${DateToUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
  });
  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  React.useEffect(() => {
    statsQuery.refetch();
  }, [type]);

  if (dateRange.from && dateRange.to) {
    return (
      <>
        <SkeletonWrapper isLoading={statsQuery.isFetching}>
          <PieChartOverview
            data={statsQuery.data}
            income={income}
            expense={expense}
            type={type}
          />
          <div className="flex justify-center">
            <Button
              className={`bg-${
                type === "income" ? "emerald" : "red"
              }-500 text-white hover:bg-${
                type === "income" ? "emerald" : "red"
              }-950 hover:text-white relative z-10`}
              onClick={() => {
                setType(type === "income" ? "expense" : "income");
              }}
            >
              {type === "income" ? "Incomes" : "Expenses"}
            </Button>
          </div>
          {statsQuery.data && (
            <MobileCategoriesStats
              data={statsQuery.data}
              formatter={formatter}
              type={type}
            />
          )}
        </SkeletonWrapper>
      </>
    );
  }
};

export default MainContainer;
