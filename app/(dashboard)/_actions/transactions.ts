"use server";

import prisma from "@/lib/prisma";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
  UpdateTransactionSchema,
  UpdateTransactionSchemaType,
} from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { amount, category, date, description, type } = parsedBody.data;
  const categoryRow = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: category,
    },
  });

  if (!categoryRow) {
    throw new Error("Category not found");
  }

  // NOTE: don't make confusion between $transaction ( prisma ) and prisma.transaction (table)

  await prisma.$transaction([
    // Create user transaction
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        date,
        description: description || "",
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),
    // Update month aggregate
    prisma.monthHistory.upsert({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: new Date(date).getUTCDate(),
          month: new Date(date).getUTCMonth(),
          year: new Date(date).getUTCFullYear(),
        },
      },
      create: {
        userId: user.id,
        day: new Date(date).getUTCDate(),
        month: new Date(date).getUTCMonth(),
        year: new Date(date).getUTCFullYear(),
        expense: type === "expense" ? amount : 0,
        income: type === "income" ? amount : 0,
      },
      update: {
        expense: {
          increment: type === "expense" ? amount : 0,
        },
        income: {
          increment: type === "income" ? amount : 0,
        },
      },
    }),

    // Update year aggregate
    prisma.yearHistory.upsert({
      where: {
        month_year_userId: {
          userId: user.id,
          month: new Date(date).getUTCMonth(),
          year: new Date(date).getUTCFullYear(),
        },
      },
      create: {
        userId: user.id,
        month: new Date(date).getUTCMonth(),
        year: new Date(date).getUTCFullYear(),
        expense: type === "expense" ? amount : 0,
        income: type === "income" ? amount : 0,
      },
      update: {
        expense: {
          increment: type === "expense" ? amount : 0,
        },
        income: {
          increment: type === "income" ? amount : 0,
        },
      },
    }),
  ]);
}

export async function UpdateTransaction(
  id: string,
  form: UpdateTransactionSchemaType
) {
  const parsedBody = UpdateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Verify transaction ownership
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingTransaction) {
    throw new Error("Transaction not found");
  }

  const { amount, date, description } = parsedBody.data;

  // NOTE: don't make confusion between $transaction ( prisma ) and prisma.transaction (table)
  await prisma.$transaction([
    // Update user transaction
    prisma.transaction.update({
      where: {
        id,
      },
      data: {
        amount,
        date,
        description: description || "",
      },
    }),

    // Update month aggregate - subtract old amount, add new amount
    prisma.monthHistory.update({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: new Date(existingTransaction.date).getUTCDate(),
          month: new Date(existingTransaction.date).getUTCMonth(),
          year: new Date(existingTransaction.date).getUTCFullYear(),
        },
      },
      data: {
        expense: {
          increment: existingTransaction.type === "expense" ? amount - existingTransaction.amount : 0,
        },
        income: {
          increment: existingTransaction.type === "income" ? amount - existingTransaction.amount : 0,
        },
      },
    }),

    // Update year aggregate - subtract old amount, add new amount
    prisma.yearHistory.update({
      where: {
        month_year_userId: {
          userId: user.id,
          month: new Date(existingTransaction.date).getUTCMonth(),
          year: new Date(existingTransaction.date).getUTCFullYear(),
        },
      },
      data: {
        expense: {
          increment: existingTransaction.type === "expense" ? amount - existingTransaction.amount : 0,
        },
        income: {
          increment: existingTransaction.type === "income" ? amount - existingTransaction.amount : 0,
        },
      },
    }),
  ]);
}
