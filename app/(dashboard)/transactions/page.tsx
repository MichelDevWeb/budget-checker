"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import React from "react";
import { toast } from "sonner";
import TransactionTable from "./_components/TransactionTable";
import TransactionImportDialog from "./_components/TransactionImportDialog";

const TransactionsPage = () => {
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-6 px-6 mx-auto">
          <div>
            <p className="text-3xl font-bold">Transactions History</p>
          </div>
          <div className="flex items-center gap-4">
            <TransactionImportDialog />
            <DateRangePicker
              locale="vi-VN"
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              showCompare={false}
              onUpdate={(values) => {
                const { from, to } = values.range;
                if (!from || !to) return;
                if (differenceInDays(from, to) > MAX_DATE_RANGE_DAYS) {
                  toast.error(
                    `The selected date range is too long. Please select a range of ${MAX_DATE_RANGE_DAYS} days or less.`
                  );
                  return;
                }
                setDateRange({ from, to });
              }}
            />
          </div>
        </div>
      </div>
      <div className="container px-6 mx-auto">
        <TransactionTable from={dateRange.from} to={dateRange.to} />
      </div>
    </>
  );
};

export default TransactionsPage;
