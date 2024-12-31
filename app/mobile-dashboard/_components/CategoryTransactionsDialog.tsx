import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit2, Trash, ChevronLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateTransactionDialog from "./CreateTransactionDialog";
import { GetTransactionHistoryByCategoryResponseType } from "@/app/api/transactions-history/category/route";
import { DateToUTCDate } from "@/lib/helpers";
import DeleteTransactionDialog from "@/app/(dashboard)/transactions/_components/DeleteTransactionDialog";

interface CategoryType {
  name: string;
  icon: string;
}

interface Props {
  category: CategoryType;
  type: "income" | "expense";
  dateRange: { from: Date; to: Date };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatter: Intl.NumberFormat;
}

const TransactionItem = ({ 
  transaction, 
  type,
  formatter,
  onEdit,
  onDelete 
}: { 
  transaction: Transaction; 
  type: "income" | "expense";
  formatter: Intl.NumberFormat;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) => (
  <div
    key={transaction.id}
    className="group relative flex items-center rounded-lg border bg-card transition-all duration-200 hover:transaction-hover-bg"
  >
    <div className="flex-1 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-medium leading-none">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(transaction.date), "dd/MM/yyyy")}</span>
          </div>
        </div>
        <p className={`font-medium ${
          type === "income" ? "text-emerald-600" : "text-red-600"
        }`}>
          {formatter.format(transaction.amount)}
        </p>
      </div>
    </div>

    <div 
      className="absolute inset-y-0 right-0 flex items-center gap-1 px-4 
                 action-buttons-gradient opacity-0 group-hover:opacity-100 
                 translate-x-4 group-hover:translate-x-0
                 transition-all duration-200 ease-out"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground
                   scale-90 hover:scale-100 transition-transform"
        onClick={() => onEdit(transaction)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive
                   scale-90 hover:scale-100 transition-transform"
        onClick={() => onDelete(transaction.id)}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default function CategoryTransactionsDialog({
  category,
  type,
  dateRange,
  open,
  onOpenChange,
  formatter,
}: Props) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<GetTransactionHistoryByCategoryResponseType>({
    queryKey: ["transactions", "category", category.name, type, dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/transactions-history/category?category=${category.name}&type=${type}&from=${DateToUTCDate(
          dateRange.from
        )}&to=${DateToUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
    enabled: open,
  });

  const handleDelete = (id: string) => {
    setDeletingTransactionId(id);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const Content = () => (
    <div className="flex flex-col h-full">
      <SheetHeader className="sr-only">
        <SheetTitle>{category.name} Transactions</SheetTitle>
      </SheetHeader>

      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="font-semibold tracking-tight">
                  {category.name}
                </span>
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                ({data?.transactions.length || 0})
              </span>
              <span className={`font-semibold text-base ${
                type === "income" 
                  ? "text-emerald-600 dark:text-emerald-500" 
                  : "text-red-600 dark:text-red-500"
              }`}>
                {data?.summary?.formattedTotal || formatter.format(0)}
              </span>
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full custom-scrollbar">
          <div className="space-y-2 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !data?.transactions.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <p>No transactions found</p>
                <Button
                  variant="link"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  Add one now
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    type={type}
                    formatter={formatter}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="absolute bottom-0 right-0 p-4 pointer-events-none w-full">
        <div className="max-w-md mx-auto w-full">
          <Button
            className={`w-full shadow-lg pointer-events-auto ${
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white`}
            size="lg"
            onClick={() => {
              setEditingTransaction(null);
              setIsEditDialogOpen(true);
            }}
          >
            Add New Transaction
          </Button>
        </div>
      </div>

      <div className="h-20" />

      {/* Add Transaction Dialog */}
      {isEditDialogOpen && (
        <CreateTransactionDialog
          type={type}
          category={category}
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="sheet-content-height p-0 gap-0 safe-area-bottom sheet-content-no-close"
      >
        <Content />
      </SheetContent>
    </Sheet>
  );
} 