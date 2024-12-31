import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionType } from "@/lib/types";
import React, { useState } from "react";
import CreateTransactionDialog from "./CreateTransactionDialog";
import { useLongPress } from 'use-long-press';
import CategoryTransactionsDialog from "./CategoryTransactionsDialog";

interface Props {
  data: GetCategoriesStatsResponseType;
  formatter: Intl.NumberFormat;
  type: TransactionType;
  dateRange: { from: Date; to: Date };
}

const MobileCategoriesStats = ({ data, formatter, type, dateRange }: Props) => {
  return (
    <div className="flex w-full flex-wrap gap-2 md:flex-nowrap">
      <CategoriesCard formatter={formatter} type={type} data={data || []} dateRange={dateRange} />
    </div>
  );
};

export default MobileCategoriesStats;

function CategoriesCard({
  data,
  type,
  formatter,
  dateRange,
}: {
  type: TransactionType;
  formatter: Intl.NumberFormat;
  data: GetCategoriesStatsResponseType;
  dateRange: { from: Date; to: Date };
}) {
  const [selectedCategory, setSelectedCategory] = useState<{name: string, icon: string} | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleViewTransactions = (category: string, icon: string) => {
    setSelectedCategory({ name: category, icon });
    setIsViewDialogOpen(true);
  };

  const bind = useLongPress((event, { context }) => {
    setSelectedCategory(context as { name: string; icon: string });
    setIsCreateDialogOpen(true);
  }, {
    threshold: 500,
    cancelOnMovement: true,
  });

  const filteredData = data.filter((el) => el.type === type);
  const total = filteredData.reduce(
    (acc, el) => acc + (el._sum?.amount || 0),
    0
  );

  return (
    <div className="w-full col-span-6">
      <div className="flex items-center justify-between gap-2">
        {filteredData.length === 0 && (
          <div className="flex h-60 w-full flex-col items-center justify-center">
            No data for the selected period
            <p className="text-sm text-muted-foreground">
              Try selecting a different period or try adding me{" "}
              {type === "income" ? "incomes" : "expenses"}
            </p>
          </div>
        )}

        {filteredData.length > 0 && (
          <ScrollArea className="h-60 w-full px-4">
            <div className="flex w-full flex-col gap-4 p-4">
              {filteredData.map((item) => {
                const amount = item._sum?.amount || 0;
                const percentage = (amount * 100) / (total || amount);

                return (
                  <div key={item.category}>
                    <div
                      {...bind({ name: item.category, icon: item.categoryIcon })}
                      onClick={() => handleViewTransactions(item.category, item.categoryIcon)}
                      className="cursor-pointer transition-colors hover:bg-accent/50 rounded-lg p-2"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-400">
                            {item.categoryIcon} {item.category}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({percentage.toFixed(0)}%)
                            </span>
                          </span>

                          <span className="text-sm text-gray-400">
                            {formatter.format(amount)}
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          indicator={
                            type === "income"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Dialogs */}
      {selectedCategory && (
        <>
          <CreateTransactionDialog
            type={type}
            category={selectedCategory}
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            trigger={<></>}
          />
          
          <CategoryTransactionsDialog
            category={selectedCategory}
            type={type}
            dateRange={dateRange}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            formatter={formatter}
          />
        </>
      )}
    </div>
  );
}
