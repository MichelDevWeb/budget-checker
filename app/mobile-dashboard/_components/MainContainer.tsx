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

const getDateRangeItems = () => {
  return [
    {
      label: "Tất cả thời gian",
      from: new Date("2000-01-01"),
      to: new Date("2100-12-30"),
    },
    {
      label: `Hôm nay (${new Date().toLocaleDateString("vi-VN")})`,
      from: startOfToday(),
      to: endOfToday(),
    },
    {
      label: `Tuần này (${startOfWeek(new Date()).toLocaleDateString(
        "vi-VN"
      )} - ${endOfWeek(new Date()).toLocaleDateString("vi-VN")})`,
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
    },
    {
      label: `Tháng này (${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()})`,
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    {
      label: `Năm nay (${new Date().getFullYear()})`,
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    },
  ];
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

  return (
    <>
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
          <ArrowLeftCircle className="h-10 w-10 opacity-75" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"secondary"}>
                <b>{getDateRangeItems()[selectedDateRangeIndex].label}</b>
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
          <ArrowRightCircle className="h-10 w-10 opacity-75" />
        </div>
      </div>
      {/* OVERVIEW */}
      <Overview
        dateRange={dateRange}
        income={income}
        expense={expense}
        userSettings={userSettings}
      />
    </>
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
          {statsQuery.data && statsQuery.data.length > 0 ? (
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
          ) : (
            true
          )}
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
