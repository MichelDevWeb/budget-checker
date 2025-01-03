import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@prisma/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateToUTCDate } from "@/lib/helpers";
import { Edit2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateTransactionDialog from "./CreateTransactionDialog";
import DeleteTransactionDialog from "@/app/(dashboard)/transactions/_components/DeleteTransactionDialog";
import { GetTransactionHistoryResponseType } from "@/app/api/transactions-history/route";

interface TransactionOverviewProps {
  dateRange: { from: Date; to: Date };
  formatter: Intl.NumberFormat;
}

interface GroupedTransactions {
  [date: string]: {
    transactions: Transaction[];
    totalAmount: number;
  };
}

const TransactionOverview = React.memo(function TransactionOverview({
  dateRange,
  formatter,
}: TransactionOverviewProps) {
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery<GetTransactionHistoryResponseType>({
    queryKey: ["transactions", "overview", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/transactions-history?from=${DateToUTCDate(dateRange.from)}&to=${DateToUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const groupedTransactions = React.useMemo(() => {
    if (!data) return {};
    
    return data.reduce((groups: GroupedTransactions, transaction) => {
      const date = format(new Date(transaction.date), "dd/MM/yyyy");
      if (!groups[date]) {
        groups[date] = {
          transactions: [],
          totalAmount: 0
        };
      }
      groups[date].transactions.push(transaction);
      groups[date].totalAmount += transaction.type === "expense" ? -transaction.amount : transaction.amount;
      return groups;
    }, {});
  }, [data]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingTransactionId(id);
  };

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <div className="group relative flex items-center py-2 transition-all duration-200 hover:bg-accent/50">
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-lg" 
                role="img" 
                aria-label={transaction.category}
              >
                {transaction.categoryIcon}
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {transaction.category}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {transaction.description}
                </span>
              </div>
            </div>
          </div>
          <p className={`font-medium ${
            transaction.type === "income" 
              ? "text-emerald-600 dark:text-emerald-500" 
              : "text-red-600 dark:text-red-500"
          }`}>
            {formatter.format(transaction.amount)}
          </p>
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-4 
                      action-buttons-gradient opacity-0 group-hover:opacity-100 
                      translate-x-4 group-hover:translate-x-0
                      transition-all duration-200 ease-out">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground
                     scale-90 hover:scale-100 transition-transform"
          onClick={() => handleEdit(transaction)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive
                     scale-90 hover:scale-100 transition-transform"
          onClick={() => handleDelete(transaction.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="px-2">
      <ScrollArea className="h-[calc(100vh-13rem)] rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !data?.length ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No transactions found</p>
            </div>
          ) : (
            Object.entries(groupedTransactions).map(([date, { transactions, totalAmount }]) => (
              <div key={date} className="space-y-2">
                <div className="sticky top-0 z-10 flex justify-between items-center p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <span className="font-medium">{date}</span>
                  <span className={`font-medium ${
                    totalAmount >= 0
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-red-600 dark:text-red-500"
                  }`}>
                    {formatter.format(totalAmount)}
                  </span>
                </div>
                <div className="space-y-1 px-4">
                  {transactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Transaction Dialog */}
      {isEditDialogOpen && (
        <CreateTransactionDialog
          type={editingTransaction?.type as "income" | "expense"}
          category={{ 
            name: editingTransaction?.category || "Khác", 
            icon: editingTransaction?.categoryIcon || "⭐️" 
          }}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          editTransaction={editingTransaction}
          trigger={<></>}
        />
      )}

      {/* Delete Transaction Dialog */}
      {deletingTransactionId && (
        <DeleteTransactionDialog
          transactionId={deletingTransactionId}
          open={!!deletingTransactionId}
          setOpen={(open: boolean) => {
            if (!open) setDeletingTransactionId(null);
          }}
        />
      )}
    </div>
  );
});

TransactionOverview.displayName = "TransactionOverview";

export default TransactionOverview; 