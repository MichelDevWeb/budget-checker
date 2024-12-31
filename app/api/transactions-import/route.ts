'use server'

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

function excelDateToJSDate(excelDate: number): Date {
  return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
}

interface ExcelTransaction {
    date: string | number;
    description: string;
    amount: string | number;
    category: string;
    categoryIcon: string;
    type: string;
}

interface Transaction {
    date: Date;
    description: string;
    amount: number;
    category: string;
    categoryIcon: string;
    type: string;
    userId: string;
}

async function updateHistoryAggregates(tx: Prisma.TransactionClient, transactions: Transaction[]) {
    // Group transactions by month and year using a single pass
    const aggregates = transactions.reduce((acc, { date, amount, type, userId }) => {
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();
        const isExpense = type === "expense";

        const monthKey = `${year}-${month}-${day}-${userId}`;
        const yearKey = `${year}-${month}-${userId}`;

        // Update month aggregates
        if (!acc.months.has(monthKey)) {
            acc.months.set(monthKey, {
                userId, day, month, year,
                expense: 0, income: 0
            });
        }
        const monthData = acc.months.get(monthKey);
        isExpense ? monthData.expense += amount : monthData.income += amount;

        // Update year aggregates
        if (!acc.years.has(yearKey)) {
            acc.years.set(yearKey, {
                userId, month, year,
                expense: 0, income: 0
            });
        }
        const yearData = acc.years.get(yearKey);
        isExpense ? yearData.expense += amount : yearData.income += amount;

        return acc;
    }, {
        months: new Map(),
        years: new Map()
    });

    // Process in smaller chunks to avoid timeouts
    const CHUNK_SIZE = 50;
    const monthUpdates = Array.from(aggregates.months.values());
    const yearUpdates = Array.from(aggregates.years.values());

    // Process month history updates in chunks
    for (let i = 0; i < monthUpdates.length; i += CHUNK_SIZE) {
        const chunk = monthUpdates.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(data => 
            tx.monthHistory.upsert({
                where: {
                    day_month_year_userId: {
                        userId: data.userId,
                        day: data.day,
                        month: data.month,
                        year: data.year,
                    },
                },
                create: {
                    userId: data.userId,
                    day: data.day,
                    month: data.month,
                    year: data.year,
                    expense: data.expense,
                    income: data.income,
                },
                update: {
                    expense: { increment: data.expense },
                    income: { increment: data.income },
                },
            }).catch((error: any) => {
                console.error('Failed to update month history:', error);
                return null; // Continue with other updates
            })
        ));
    }

    // Process year history updates in chunks
    for (let i = 0; i < yearUpdates.length; i += CHUNK_SIZE) {
        const chunk = yearUpdates.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(data => 
            tx.yearHistory.upsert({
                where: {
                    month_year_userId: {
                        userId: data.userId,
                        month: data.month,
                        year: data.year,
                    },
                },
                create: {
                    userId: data.userId,
                    month: data.month,
                    year: data.year,
                    expense: data.expense,
                    income: data.income,
                },
                update: {
                    expense: { increment: data.expense },
                    income: { increment: data.income },
                },
            }).catch((error: any) => {
                console.error('Failed to update year history:', error);
                return null; // Continue with other updates
            })
        ));
    }
}

export async function createManyTransactions(transactions: Transaction[]) {
    try {
        // Process in smaller batches
        const BATCH_SIZE = 500; // Reduced batch size
        let processedCount = 0;
        const errors = [];

        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
            const batch = transactions.slice(i, i + BATCH_SIZE);
            
            try {
                await prisma.$transaction(async (tx) => {
                    // Process categories and transactions
                    const uniqueCategories = [...new Set(batch.map(t => t.category))];
                    
                    // Create categories
                    const existingCategories = await tx.category.findMany({
                        where: {
                            name: { in: uniqueCategories },
                            userId: batch[0].userId
                        },
                        select: { name: true }
                    });
                    
                    const existingCategoryNames = new Set(existingCategories.map(c => c.name));
                    const newCategories = uniqueCategories.filter(cat => !existingCategoryNames.has(cat));

                    if (newCategories.length > 0) {
                        await tx.category.createMany({
                            data: newCategories.map(name => ({
                                name,
                                userId: batch[0].userId,
                                icon: batch.find(t => t.category === name)?.categoryIcon || "❓"
                            })),
                            skipDuplicates: true
                        });
                    }

                    // Create transactions
                    await tx.transaction.createMany({
                        data: batch,
                        skipDuplicates: true
                    });

                    // Update history
                    await updateHistoryAggregates(tx, batch);
                    
                    processedCount += batch.length;
                }, {
                    timeout: 10000 // Increase timeout to 10 seconds
                });
            } catch (error) {
                console.error(`Batch ${i} failed:`, error);
                errors.push(`Batch ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Continue with next batch
            }
        }

        return {
            success: true,
            count: processedCount,
            message: `Successfully imported ${processedCount} transactions${errors.length > 0 ? ` (with ${errors.length} batch errors)` : ''}`,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error) {
        console.error('Failed to create transactions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create transactions'
        };
    }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      redirect("/sign-in");
    }
    const formData = await request.formData();
    const file: File | null = formData.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file directly from buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel in memory
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const excelData = XLSX.utils.sheet_to_json<ExcelTransaction>(worksheet);

    // Transform data to match Prisma schema
    const transformedData = excelData.map((row) => ({
      date: typeof row.date === 'number' 
        ? excelDateToJSDate(row.date)
        : new Date(row.date),
      description: String(row.description),
      amount: parseFloat(String(row.amount)),
      category: String(row.category),
      type: String(row.type).toLowerCase(),
      userId: user.id,
      categoryIcon: row.categoryIcon ? String(row.categoryIcon) : "❓", // Default if not provided
    }));

    // Store in database using Prisma
    const savedTransactions = await createManyTransactions(transformedData);

    return NextResponse.json(savedTransactions);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import transactions: " + (error as Error).message },
      { status: 500 }
    );
  }
}
