import { GetFormatterForCurrency } from "@/lib/helpers";
import prisma from "@/lib/prisma";
import { OverviewQuerySchema } from "@/schema/overview";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!category || !type) {
      return new NextResponse("Missing category or type parameters", { status: 400 });
    }

    const queryParams = OverviewQuerySchema.safeParse({
      from,
      to,
    });

    if (!queryParams.success) {
      return NextResponse.json(queryParams.error.message, { status: 400 });
    }

    const transactions = await getTransactionHistoryByCategory(
      user.id,
      category,
      type as "income" | "expense",
      queryParams.data.from,
      queryParams.data.to
    );

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_HISTORY_CATEGORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export type GetTransactionHistoryByCategoryResponseType = Awaited<
  ReturnType<typeof getTransactionHistoryByCategory>
>;

async function getTransactionHistoryByCategory(
  userId: string,
  category: string,
  type: "income" | "expense",
  from: Date,
  to: Date
) {
  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId,
    },
  });

  if (!userSettings) {
    throw new Error("User settings not found");
  }

  const formatter = GetFormatterForCurrency(userSettings.currency);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      category: {
        equals: category,
      },
      type,
      date: {
        gte: from,
        lte: to,
      },
    },

    orderBy: {
      date: "desc",
    },
  });

  // Calculate total amount for the period
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions: transactions.map((transaction) => ({
      ...transaction,
      formattedAmount: formatter.format(transaction.amount),
    })),
    summary: {
      total,
      formattedTotal: formatter.format(total),
      count: transactions.length,
      currency: userSettings.currency,
    }
  };
} 