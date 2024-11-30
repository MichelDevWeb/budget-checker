"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateTransactionSchemaType } from "@/schema/transaction";
import { ReactNode } from "react";
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateTransaction } from "@/app/(dashboard)/_actions/transactions";
import { NumericFormat } from "react-number-format";

interface Props {
  trigger: ReactNode;
  type: TransactionType;
  category: string;
}

interface TransactionInput
  extends Omit<CreateTransactionSchemaType, "type" | "category"> {
  key: string;
}

const CreateTransactionDialog = ({ trigger, type, category }: Props) => {
  const [transactions, setTransactions] = React.useState<TransactionInput[]>([
    { key: crypto.randomUUID(), description: "", amount: 0, date: new Date() },
  ]);
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (transactions: TransactionInput[]) => {
      const loadingToast = toast.loading("Creating transactions...");
      try {
        const promises = transactions.map((transaction) =>
          CreateTransaction({ ...transaction, type, category })
        );
        const result = await Promise.all(promises);
        toast.dismiss(loadingToast);
        return result;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Transactions created successfully");
      setTransactions([
        {
          key: crypto.randomUUID(),
          description: "",
          amount: 0,
          date: new Date(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setOpen(false);
    },
  });

  const addTransaction = () => {
    setTransactions([
      ...transactions,
      {
        key: crypto.randomUUID(),
        description: "",
        amount: 0,
        date: new Date(),
      },
    ]);
  };

  const removeTransaction = (key: string) => {
    if (transactions.length === 1) return;
    setTransactions(transactions.filter((t) => t.key !== key));
  };

  const updateTransaction = (
    key: string,
    field: keyof TransactionInput,
    value: TransactionInput[keyof TransactionInput]
  ) => {
    setTransactions(
      transactions.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
  };

  const onSubmit = () => {
    mutate(transactions);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create new{" "}
            <span
              className={cn(
                "m-1",
                type === "income" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {type}
            </span>
            transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {transactions.map((transaction) => (
            <div
              key={transaction.key}
              className="space-y-4 p-4 border rounded-lg relative"
            >
              <div className="absolute right-2 top-2">
                {transactions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTransaction(transaction.key)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <Input
                placeholder="Description"
                value={transaction.description}
                onChange={(e) =>
                  updateTransaction(
                    transaction.key,
                    "description",
                    e.target.value
                  )
                }
              />

              <NumericFormat
                value={transaction.amount}
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                onValueChange={(values) => {
                  const { floatValue } = values;
                  updateTransaction(transaction.key, "amount", floatValue);
                }}
                className="border border-gray-300 rounded p-2 w-full dark:bg-gray-900 dark:text-gray-100"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {format(transaction.date, "dd/MM/yyyy")}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transaction.date}
                    onSelect={(date) =>
                      date && updateTransaction(transaction.key, "date", date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Add Another Transaction
          </Button>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="secondary"
              onClick={() =>
                setTransactions([
                  {
                    key: crypto.randomUUID(),
                    description: "",
                    amount: 0,
                    date: new Date(),
                  },
                ])
              }
            >
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={isPending}>
            {!isPending ? "Create All" : "Creating..."}
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTransactionDialog;
