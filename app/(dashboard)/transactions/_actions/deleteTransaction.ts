"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function DeleteTransaction(id: string) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const transaction = await prisma.transaction.findUnique({
    where: {
      userId: user.id,
      id,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await prisma.$transaction([
    // Delete the transaction from db
    prisma.transaction.delete({
      where: {
        id,
        userId: user.id,
      },
    }),
    // Update month history
    prisma.monthHistory.update({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: {
            decrement: transaction.amount,
          },
        }),
        ...(transaction.type === "income" && {
          income: {
            decrement: transaction.amount,
          },
        }),
      },
    }),
    // Update year history
    prisma.yearHistory.update({
      where: {
        month_year_userId: {
          userId: user.id,
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: {
            decrement: transaction.amount,
          },
        }),
        ...(transaction.type === "income" && {
          income: {
            decrement: transaction.amount,
          },
        }),
      },
    }),
  ]);
}

export async function bulkDeleteTransactions(ids: string[]) {
  try {
    // Delete transactions
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get transactions to be deleted
      const transactions = await tx.transaction.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          amount: true,
          type: true,
          date: true,
          userId: true,
        },
      });

      // Delete transactions
      await tx.transaction.deleteMany({
        where: { id: { in: ids } },
      });

      // Update month history for each transaction
      for (const { date, amount, type, userId } of transactions) {
        await tx.monthHistory.update({
          where: {
            day_month_year_userId: {
              userId,
              day: date.getUTCDate(),
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          data: {
            expense: {
              decrement: type === "expense" ? amount : 0,
            },
            income: {
              decrement: type === "income" ? amount : 0,
            },
          },
        });

        // Update year history
        await tx.yearHistory.update({
          where: {
            month_year_userId: {
              userId,
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          data: {
            expense: {
              decrement: type === "expense" ? amount : 0,
            },
            income: {
              decrement: type === "income" ? amount : 0,
            },
          },
        });
      }

      return transactions.length;
    });

    revalidatePath('/transactions');
    return { success: true, count: result };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transactions",
    };
  }
}
