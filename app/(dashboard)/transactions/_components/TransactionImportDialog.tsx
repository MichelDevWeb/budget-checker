'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function TransactionImportDialog() {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsLoading(true);
            const file = event.target.files?.[0];
            
            if (!file) return;

            // Validate file type
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                toast.error("Please upload an Excel file (.xlsx or .xls)");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            toast.promise(
                fetch('/api/transactions-import', {
                    method: 'POST',
                    body: formData,
                }).then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to import transactions');
                    }
                    // Invalidate and refetch
                    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    return data;
                }),
                {
                    loading: 'Importing transactions...',
                    success: (data) => {
                        setOpen(false);
                        return `Successfully imported ${data.count} transactions`;
                    },
                    error: (error) => error.message || 'Failed to import transactions'
                }
            );
            
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to import transactions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileUp className="h-4 w-4" />
                    Import Transactions
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Transactions</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file (.xlsx or .xls) containing your transactions.
                        Make sure your file has the required columns: date, description, amount, category, type, and optional categoryIcon.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                                     file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700
                                     hover:file:bg-violet-100"
                        />
                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Importing transactions...
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}