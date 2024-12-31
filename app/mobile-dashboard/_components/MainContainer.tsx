"use client";

import React from "react";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { UserSettings } from "@prisma/client";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import { DateToUTCDate, GetFormatterForCurrency, getDateRangeItems, getStepByIndex } from "@/lib/helpers";
import {
  endOfToday,
  startOfToday,
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

const MainContainer = ({ userSettings }: { userSettings: UserSettings }) => {
  console.log("MainContainer rendered");

  const [dateRange, setDateRange] = React.useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfToday(),
    to: endOfToday(),
  });
  const [selectedDateRangeIndex, setSelectedDateRangeIndex] = React.useState(1);
  const [step, setStep] = React.useState<number>(0);
  const queryClient = useQueryClient();

  // Background prefetching for next/previous periods
  const prefetchAdjacentData = React.useCallback(async () => {
    const nextStep = step + getStepByIndex(selectedDateRangeIndex);
    const prevStep = step - getStepByIndex(selectedDateRangeIndex);
    console.log(nextStep, prevStep);

    // Prefetch next period
    const nextRange = {
      from: getDateRangeItems(nextStep)[selectedDateRangeIndex].from,
      to: getDateRangeItems(nextStep)[selectedDateRangeIndex].to,
    };

    // Prefetch previous period
    const prevRange = {
      from: getDateRangeItems(prevStep)[selectedDateRangeIndex].from,
      to: getDateRangeItems(prevStep)[selectedDateRangeIndex].to,
    };

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["overview", "stats", nextRange.from, nextRange.to],
        queryFn: () =>
          fetch(
            `/api/stats/balance?from=${nextRange.from}&to=${nextRange.to}`
          ).then((res) => res.json()),
      }),
      queryClient.prefetchQuery({
        queryKey: ["overview", "stats", prevRange.from, prevRange.to],
        queryFn: () =>
          fetch(
            `/api/stats/balance?from=${prevRange.from}&to=${prevRange.to}`
          ).then((res) => res.json()),
      }),
    ]);
  }, [step, selectedDateRangeIndex, queryClient]);

  // Main data query with stale time and caching
  const statsQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ["overview", "stats", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${dateRange.from}&to=${dateRange.to}`
      ).then((res) => res.json()),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData
  });

  // Prefetch adjacent periods when current data is loaded
  React.useEffect(() => {
    if (statsQuery.data) {
      prefetchAdjacentData();
    }
  }, [statsQuery.data, prefetchAdjacentData]);

  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const income = statsQuery.data?.income || 0;
  const expense = statsQuery.data?.expense || 0;
  const balance = income - expense;

  const _onSwipedLeft = () => {
    if (selectedDateRangeIndex === 0) return;
    const _step = step + getStepByIndex(selectedDateRangeIndex);
    setStep(_step);
    setDateRange({
      from: getDateRangeItems(_step)[selectedDateRangeIndex].from,
      to: getDateRangeItems(_step)[selectedDateRangeIndex].to,
    });
  };

  const _onSwipedRight = () => {
    if (selectedDateRangeIndex === 0) return;
    const _step = step - getStepByIndex(selectedDateRangeIndex);
    setStep(_step);
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
              className="text-2xl font-bold ml-4 dark:text-gray-100"
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
            className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 active:opacity-50 transition-all cursor-pointer"
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
  )
};

interface OverviewProps {
  dateRange: { from: Date; to: Date };
  income: number;
  expense: number;
  userSettings: UserSettings;
}

const Overview = React.memo(({
  dateRange,
  income,
  expense,
  userSettings,
}: OverviewProps) => {
  console.log('Overview');
  const [type, setType] = React.useState<"expense" | "income">("expense");
  
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", dateRange.from, dateRange.to, type],
    queryFn: () =>
      fetch(
        `/api/stats/categories?type=${type}&from=${DateToUTCDate(
          dateRange.from
        )}&to=${DateToUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  if (dateRange.from && dateRange.to) {
    return (
      <>
        <SkeletonWrapper isLoading={statsQuery.isFetching}>
          {statsQuery.data && (
            <PieChartOverview
              data={statsQuery.data}
              income={income}
              expense={expense}
              type={type}
            />
          )}
          <div className="fixed bottom-2 right-2 flex gap-2 z-50">
            <Button
              className={`
                transition-all duration-200
                ${
                  type === "income"
                    ? "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 active:bg-emerald-700 dark:active:bg-emerald-800"
                    : "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800"
                }
                text-white font-medium shadow-lg
                rounded-full px-6 h-12
              `}
              aria-label={`Switch to ${type === "income" ? "expenses" : "incomes"}`}
              onClick={() => setType(type === "income" ? "expense" : "income")}
            >
              {type === "income" ? "Incomes" : "Expenses"}
            </Button>

            <CreateTransactionDialog
              type={type}
              category={null}
                trigger={
                  <Button
                    className={`
                      transition-all duration-200
                      ${
                        type === "income"
                          ? "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 active:bg-emerald-700 dark:active:bg-emerald-800"
                          : "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800"
                      }
                      text-white font-medium shadow-lg
                      rounded-full h-12 w-12
                    `}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                }
            />
          </div>
          {statsQuery.data && (
            <MobileCategoriesStats
              data={statsQuery.data}
              formatter={formatter}
              type={type}
              dateRange={dateRange}
            />
          )}
        </SkeletonWrapper>
      </>
    );
  }
});

export default MainContainer;
