'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Debt } from '@/lib/types';
import { PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddDebtForm from './AddDebtForm';
import DebtCard from './DebtCard';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(value);
};

export default function DebtsDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  
  const debts = useLiveQuery(
    () => db.debts.orderBy('dueDate').toArray(),
    []
  );

  const parsedDebts: Debt[] = (debts || []).map(d => ({
    ...d,
    dueDate: new Date(d.dueDate),
  }));

  const handleSubmitDebt = async (debtData: Omit<Debt, 'id' | 'status' | 'currentAmount'>, id?: number) => {
    try {
      if (id) {
        // Edit mode
        const existingDebt = await db.debts.get(id);
        if (existingDebt) {
          // Keep the currentAmount and status, only update other fields.
          await db.debts.update(id, {
            ...debtData,
            dueDate: debtData.dueDate.toISOString(),
            amount: existingDebt.amount, // amount is immutable
            currentAmount: existingDebt.currentAmount,
            status: existingDebt.status,
          });
          toast({ title: 'Sukses', description: 'Catatan berhasil diperbarui.' });
        }
      } else {
        // Add mode
        await db.debts.add({
          ...debtData,
          amount: debtData.amount,
          currentAmount: debtData.amount,
          status: 'unpaid',
          dueDate: debtData.dueDate.toISOString(),
        });
        toast({ title: 'Sukses', description: 'Catatan baru berhasil ditambahkan.' });
      }
      setIsFormOpen(false);
      // We don't need to manually refetch, useLiveQuery handles it.
    } catch (error) {
      console.error('Failed to submit debt record:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan catatan.' });
    }
  };


  const handleUpdateStatus = async (id: number, status: 'paid' | 'unpaid') => {
    try {
        if (status === 'paid') {
            await db.debts.update(id, { status, currentAmount: 0 });
        } else {
            // This case might not be used if the button is disabled when paid
            // but is here for completeness.
            const debt = await db.debts.get(id);
            if(debt) {
                await db.debts.update(id, { status, currentAmount: debt.amount });
            }
        }
    } catch (error) {
      console.error('Failed to update debt status:', error);
    }
  };

  const handleDeleteDebt = async (id: number) => {
    try {
      await db.debts.delete(id);
    } catch (error) {
      console.error('Failed to delete debt record:', error);
    }
  };

  const handleAddPayment = async (debtId: number, amount: number, fundSource: string) => {
    const debt = await db.debts.get(debtId);
    if (!debt) return;

    try {
        // 1. Update the debt record
        const newCurrentAmount = debt.currentAmount - amount;
        const newStatus = newCurrentAmount <= 0 ? 'paid' : 'unpaid';
        await db.debts.update(debtId, {
            currentAmount: Math.max(0, newCurrentAmount),
            status: newStatus
        });

        // 2. Create a corresponding transaction
        const transactionType = debt.type === 'debt' ? 'expense' : 'income';
        const category = debt.type === 'debt' ? 'Pembayaran Utang' : 'Penerimaan Piutang';
        const description = `${debt.type === 'debt' ? 'Pembayaran utang kepada' : 'Penerimaan piutang dari'} ${debt.personName}`;

        await db.transactions.add({
            type: transactionType,
            amount: amount,
            date: new Date().toISOString(),
            category: category,
            fundSource: fundSource,
            description: description,
            linkedTo: `debt_${debtId}`
        });

    } catch (error) {
        console.error('Failed to add payment:', error);
        toast({
            variant: 'destructive',
            title: 'Gagal',
            description: 'Gagal mencatat pembayaran.'
        });
    }
  };

  const summary = parsedDebts.reduce(
    (acc, curr) => {
      if (curr.status === 'unpaid') {
        if (curr.type === 'debt') {
          acc.totalDebt += curr.currentAmount;
        } else {
          acc.totalReceivable += curr.currentAmount;
        }
      }
      return acc;
    },
    { totalDebt: 0, totalReceivable: 0 }
  );
  
  const debtsList = parsedDebts.filter(d => d.type === 'debt');
  const receivablesList = parsedDebts.filter(d => d.type === 'receivable');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Ringkasan</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle />
              Tambah Catatan
            </Button>
          </DialogTrigger>
          <AddDebtForm onSubmitDebt={handleSubmitDebt} onClose={() => setIsFormOpen(false)} />
        </Dialog>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utang Anda</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalDebt)}</div>
            <p className="text-xs text-muted-foreground">Jumlah yang masih harus Anda bayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang Anda</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalReceivable)}</div>
            <p className="text-xs text-muted-foreground">Jumlah yang akan Anda terima</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="debts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="debts">Utang Saya</TabsTrigger>
            <TabsTrigger value="receivables">Piutang Saya</TabsTrigger>
        </TabsList>
        <TabsContent value="debts">
            {debts === undefined ? (
                <Skeleton className="h-60 w-full" />
            ) : debtsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {debtsList.map((debt) => (
                    <DebtCard 
                        key={debt.id} 
                        debt={debt}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteDebt}
                        onAddPayment={handleAddPayment}
                        onUpdateDebt={handleSubmitDebt}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg mt-6">
                <h3 className="text-xl font-semibold text-muted-foreground">Bagus! Tidak Ada Utang</h3>
                <p className="text-muted-foreground mt-2">Anda tidak memiliki catatan utang.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="receivables">
             {debts === undefined ? (
                <Skeleton className="h-60 w-full" />
            ) : receivablesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {receivablesList.map((debt) => (
                    <DebtCard 
                        key={debt.id} 
                        debt={debt}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteDebt}
                        onAddPayment={handleAddPayment}
                        onUpdateDebt={handleSubmitDebt}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg mt-6">
                <h3 className="text-xl font-semibold text-muted-foreground">Tidak Ada Piutang</h3>
                <p className="text-muted-foreground mt-2">Tidak ada catatan orang yang berutang pada Anda.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
