'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Investment, FundSource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, TrendingUp, TrendingDown, Landmark, Coins, BrainCircuit, Wallet, Briefcase, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddInvestmentForm from './AddInvestmentForm';
import InvestmentCard from './InvestmentCard';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(value);
};

export default function InvestmentsDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const investments = useLiveQuery(
    () => db.investments.orderBy('purchaseDate').toArray(),
    []
  );

  const fundSources = useLiveQuery(
    () => db.fundSources.toArray(),
    []
  );

  const parsedInvestments: Investment[] = (investments || []).map(i => ({
    ...i,
    purchaseDate: new Date(i.purchaseDate),
  }));

  const handleAddInvestment = async (investment: Omit<Investment, 'id' | 'linkedTo'>, source: FundSource | undefined) => {
    if (!source) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Sumber dana harus dipilih untuk membuat transaksi.',
      });
      return;
    }

    try {
      // 1. Add the investment to get its ID
      const newInvestmentId = await db.investments.add({
        ...investment,
        purchaseDate: investment.purchaseDate.toISOString(),
      });

      // 2. Create a linked transaction
      await db.transactions.add({
        type: 'expense',
        amount: investment.initialAmount,
        date: investment.purchaseDate.toISOString(),
        category: 'Investasi',
        fundSource: source.name,
        description: `Modal Awal Investasi: ${investment.name}`,
        linkedTo: `investment_${newInvestmentId}`,
      });

      toast({
        title: 'Sukses!',
        description: 'Aset investasi dan transaksi pengeluaran berhasil dibuat.',
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to add investment and transaction:', error);
       toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menyimpan investasi dan transaksi terkait.',
      });
    }
  };

  const handleUpdateInvestment = async (id: number, newCurrentValue: number) => {
    try {
      await db.investments.update(id, { currentValue: newCurrentValue });
       toast({
        title: 'Sukses',
        description: 'Nilai investasi berhasil diperbarui.',
      });
    } catch (error) {
      console.error('Failed to update investment:', error);
       toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal memperbarui nilai investasi.',
      });
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    try {
      // Note: We are not deleting the associated transaction to preserve history.
      // A more complex implementation might offer to delete both.
      await db.investments.delete(id);
       toast({
        title: 'Sukses',
        description: 'Aset investasi berhasil dihapus.',
      });
    } catch (error) {
      console.error('Failed to delete investment:', error);
       toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menghapus aset investasi.',
      });
    }
  };

  const handleLiquidateInvestment = async (investment: Investment) => {
    if (investment.id === undefined) return;
    try {
       // 1. Create the income transaction
      await db.transactions.add({
        type: 'income',
        amount: investment.currentValue,
        date: new Date().toISOString(),
        category: 'Divestasi',
        // For simplicity, we assume the money goes to the first fund source.
        // A more complex implementation could ask the user.
        fundSource: fundSources?.[0]?.name ?? 'Rekening Bank',
        description: `Pencairan Investasi: ${investment.name}`,
        linkedTo: `investment_${investment.id}`
      });

      // 2. Delete the investment asset
      await db.investments.delete(investment.id);

      toast({
        title: 'Investasi Dicairkan!',
        description: `Pemasukan sebesar ${formatCurrency(investment.currentValue)} telah dicatat.`
      });

    } catch (error) {
      console.error('Failed to liquidate investment:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mencairkan investasi dan membuat transaksi.'
      })
    }
  };


  const summary = parsedInvestments.reduce(
    (acc, curr) => {
      acc.totalInitial += curr.initialAmount;
      acc.totalCurrent += curr.currentValue;
      return acc;
    },
    { totalInitial: 0, totalCurrent: 0 }
  );

  const totalProfitLoss = summary.totalCurrent - summary.totalInitial;
  const profitLossPercentage = summary.totalInitial > 0 ? (totalProfitLoss / summary.totalInitial) * 100 : 0;
  
  const ICONS: { [key: string]: React.ElementType } = {
    'Saham': Landmark,
    'Reksadana': Briefcase,
    'Emas': PiggyBank,
    'Properti': Landmark,
    'Kripto': BrainCircuit,
    'Lainnya': Coins
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Ringkasan Portofolio</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle />
              Tambah Aset
            </Button>
          </DialogTrigger>
          <AddInvestmentForm onAddInvestment={handleAddInvestment} fundSources={fundSources || []} />
        </Dialog>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investasi</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCurrent)}</div>
            <p className="text-xs text-muted-foreground">dari modal {formatCurrency(summary.totalInitial)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            {totalProfitLoss >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(totalProfitLoss)}</div>
            <p className="text-xs text-muted-foreground">
              {totalProfitLoss >= 0 ? '+' : ''}{!isNaN(profitLossPercentage) ? profitLossPercentage.toFixed(2) : 0}% dari modal
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Aset</CardTitle>
             <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parsedInvestments.length}</div>
            <p className="text-xs text-muted-foreground">aset investasi aktif</p>
          </CardContent>
        </Card>
      </div>
      
      {investments === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : parsedInvestments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parsedInvestments.map((inv) => (
            <InvestmentCard 
              key={inv.id} 
              investment={inv}
              onUpdate={handleUpdateInvestment}
              onDelete={handleDeleteInvestment}
              onLiquidate={handleLiquidateInvestment}
              Icon={ICONS[inv.type] || Coins}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold text-muted-foreground">Belum Ada Investasi</h3>
          <p className="text-muted-foreground mt-2">Mulai catat aset investasimu di sini!</p>
        </div>
      )}
    </div>
  );
}
