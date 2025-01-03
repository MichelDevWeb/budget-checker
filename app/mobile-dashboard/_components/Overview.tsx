import React from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import PieChartOverview from "./PieChartOverview";
import MobileCategoriesStats from "./MobileCategoriesStats";
import { useQuery } from "@tanstack/react-query";
import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { UserSettings } from "@prisma/client";

interface OverviewProps {
  dateRange: { from: Date; to: Date };
  income: number;
  expense: number;
  userSettings: UserSettings;
  type: "expense" | "income";
}

const Overview = React.memo(function Overview({
  dateRange,
  income,
  expense,
  userSettings,
  type,
}: OverviewProps) {
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

  return (
    <SkeletonWrapper isLoading={statsQuery.isFetching}>
      {statsQuery.data && (
        <PieChartOverview
          data={statsQuery.data}
          income={income}
          expense={expense}
          type={type}
        />
      )}
      {statsQuery.data && (
        <MobileCategoriesStats
          data={statsQuery.data}
          formatter={formatter}
          type={type}
          dateRange={dateRange}
        />
      )}
    </SkeletonWrapper>
  );
});

Overview.displayName = "Overview";

export default Overview; 