'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Transaction, CashFlowData, Investment } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth, getYear, startOfMonth } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Scale } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(value);
};

export default function CashFlowReport() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').toArray(),
    []
  );
  
  const investments = useLiveQuery(
    () => db.investments.toArray(),
    []
  );

  const { cashFlowData, summary } = useMemo(() => {
    if (!transactions || !investments) {
      return { cashFlowData: [], summary: { totalIncome: 0, totalExpense: 0, netFlow: 0 } };
    }

    const investmentsById = new Map(investments.map(inv => [inv.id, inv]));
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'expense') {
        // Exclude investment purchases from cash flow expenses
        if (t.category === 'Investasi' && t.linkedTo) {
            return; // Skip this transaction
        }
        monthlyData[monthKey].expense += t.amount;
      } else { // income
        // Handle investment divestments (sales)
        if (t.category === 'Divestasi' && t.linkedTo) {
          const [type, linkedIdStr] = t.linkedTo.split('_');
          const linkedId = parseInt(linkedIdStr, 10);
          const investment = investmentsById.get(linkedId);

          if (investment) {
            // After a sale, the currentValue in DB is already reduced.
            // We need to estimate what it was *before* the sale.
            const valueBeforeSale = investment.currentValue + t.amount;
            const proportionSold = t.amount / valueBeforeSale;
            const costOfGoodsSold = investment.initialAmount * proportionSold;
            const profitOrLoss = t.amount - costOfGoodsSold;

            if (profitOrLoss > 0) {
              // Only add profit to income
              monthlyData[monthKey].income += profitOrLoss;
            } else {
              // Only add loss to expense
              monthlyData[monthKey].expense += Math.abs(profitOrLoss);
            }
          } else {
             // If investment data is not found, treat as regular income for safety
            monthlyData[monthKey].income += t.amount;
          }
        } else {
            // Regular income
            monthlyData[monthKey].income += t.amount;
        }
      }
    });

    const cashFlowData: CashFlowData[] = Object.keys(monthlyData).map(key => ({
      month: format(new Date(key), 'MMM yyyy', { locale: localeID }),
      income: monthlyData[key].income,
      expense: monthlyData[key].expense,
    })).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const totalIncome = cashFlowData.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = cashFlowData.reduce((acc, curr) => acc + curr.expense, 0);
    const netFlow = totalIncome - totalExpense;

    return { cashFlowData, summary: { totalIncome, totalExpense, netFlow } };
  }, [transactions, investments]);
  
  if (transactions === undefined || investments === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Dari seluruh periode</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalExpense)}</div>
             <p className="text-xs text-muted-foreground">Dari seluruh periode</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arus Kas Bersih</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(summary.netFlow)}</div>
            <p className="text-xs text-muted-foreground">Selisih pemasukan dan pengeluaran</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Arus Kas Bulanan</CardTitle>
          <CardDescription>Visualisasi pemasukan dan pengeluaran Anda setiap bulan.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value as number), name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend
                formatter={(value) => value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              />
              <Bar dataKey="income" fill="hsl(var(--chart-2))" name="Pemasukan" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--chart-5))" name="Pengeluaran" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
