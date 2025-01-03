"use client";

import React from "react";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { UserSettings } from "@prisma/client";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import {
  GetFormatterForCurrency,
  getDateRangeItems,
  getStepByIndex,
} from "@/lib/helpers";
import { endOfToday, startOfToday } from "date-fns";
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
import { useSwipeable } from "react-swipeable";
import Overview from "./Overview";
import TransactionOverview from "./TransactionOverview";
import CreateTransactionDialog from "./CreateTransactionDialog";

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
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = React.useState<
    "overview" | "transactions"
  >("overview");
  const [type, setType] = React.useState<"expense" | "income">("expense");

  // Background prefetching for next/previous periods
  const prefetchAdjacentData = React.useCallback(async () => {
    const nextStep = step + getStepByIndex(selectedDateRangeIndex);
    const prevStep = step - getStepByIndex(selectedDateRangeIndex);
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
    placeholderData: keepPreviousData,
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
      {/* Views Container */}
      {activeView === "overview" && (
        <Overview
          dateRange={dateRange}
          income={income}
          expense={expense}
          userSettings={userSettings}
          type={type}
        />
      )}
      {activeView === "transactions" && (
        <TransactionOverview dateRange={dateRange} formatter={formatter} />
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 right-0 left-0 z-30 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="py-3 flex gap-2 px-2 justify-end">
          <Button
            className={`
              transition-all duration-200
              ${
                activeView === "transactions"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-muted hover:bg-muted/90 text-muted-foreground"
              }
              font-medium shadow-sm
              rounded-lg
              flex items-center justify-center gap-2
              hover:scale-[0.98] active:scale-[0.97]
            `}
            onClick={() => setActiveView(activeView === "overview" ? "transactions" : "overview")}
          >
            <span className="font-medium">
              {activeView === "transactions" ? "Overview" : "Transactions"}
            </span>
          </Button>

          <Button
            className={`
              transition-all duration-200
              ${
                type === "income"
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
              }
              font-medium shadow-sm
              rounded-lg
              flex items-center justify-center
              hover:scale-[0.98] active:scale-[0.97]
            `}
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
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }
                  font-medium shadow-sm
                  rounded-lg w-12
                  flex items-center justify-center
                  hover:scale-[0.98] active:scale-[0.97]
                `}
              >
                <Plus className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
