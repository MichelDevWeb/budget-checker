"use client";

import React from "react";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
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
import { useSwipeable } from "react-swipeable";
import CreateTransactionDialog from "./CreateTransactionDialog";

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

  const _onSwipedLeft = () => {
    if (selectedDateRangeIndex === 0) return;
    console.log("Swiped Left!");
    const _step = step + getStepByIndex(selectedDateRangeIndex);

    setStep(_step);
    console.log(_step);
    setDateRange({
      from: getDateRangeItems(_step)[selectedDateRangeIndex].from,
      to: getDateRangeItems(_step)[selectedDateRangeIndex].to,
    });
  };
  const _onSwipedRight = () => {
    if (selectedDateRangeIndex === 0) return;
    console.log("Swiped Right!");
    const _step = step - getStepByIndex(selectedDateRangeIndex);

    setStep(_step);
    console.log(_step);
    setDateRange({
      from: getDateRangeItems(_step)[selectedDateRangeIndex].from,
      to: getDateRangeItems(_step)[selectedDateRangeIndex].to,
    });
  };
  const handlers = useSwipeable({
    onSwipedLeft: () => _onSwipedLeft(),
    onSwipedRight: () => _onSwipedRight(),
  });

  return (
    <div {...handlers}>
      {/* HEADER */}
      <div className="rounded-lg bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-950/50 mx-2 mb-4 border border-border dark:border-gray-800">
        <div className="flex items-center justify-between p-3 relative z-10">
          <ChevronsLeft
            className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 active:opacity-50 transition-all cursor-pointer"
            onClick={() => _onSwipedRight()}
          />

          <div className="flex flex-col items-center gap-3">
            <CountUp
              preserveValue
              redraw={false}
              end={balance}
              decimal="2"
              formattingFn={(value) => formatter.format(value)}
              className="text-3xl font-bold ml-4 dark:text-gray-100"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"secondary"}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 
                    transition-colors shadow-sm dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
                >
                  <b>{getDateRangeItems(step)[selectedDateRangeIndex].label}</b>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-64 shadow-lg dark:bg-gray-900 dark:border-gray-800"
              >
                <DropdownMenuLabel className="text-center dark:text-gray-300">
                  Chọn mốc thời gian
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:border-gray-800" />
                {getDateRangeItems().map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    className="flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 
                      cursor-pointer dark:text-gray-300 dark:focus:bg-gray-800 dark:focus:text-gray-200"
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
          </div>

          <ChevronsRight
            className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
              active:opacity-50 transition-all cursor-pointer"
            onClick={() => _onSwipedLeft()}
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
          <div className="flex justify-center gap-2">
            <Button
              className={`
                transition-all duration-200
                ${
                  type === "income"
                    ? "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 active:bg-emerald-700 dark:active:bg-emerald-800"
                    : "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800"
                }
                text-white font-medium relative z-10
                shadow-md dark:shadow-gray-950/50
              `}
              aria-label={`Switch to ${
                type === "income" ? "expenses" : "incomes"
              }`}
              onClick={() => setType(type === "income" ? "expense" : "income")}
            >
              {type === "income" ? "Incomes" : "Expenses"}
            </Button>

            <CreateTransactionDialog
              type={type}
              category="default"
              trigger={
                <Button
                  className={`
                    transition-all duration-200
                    ${
                      type === "income"
                        ? "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 active:bg-emerald-700 dark:active:bg-emerald-800"
                        : "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800"
                    }
                    text-white font-medium relative z-10
                    shadow-md dark:shadow-gray-950/50
                  `}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
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
