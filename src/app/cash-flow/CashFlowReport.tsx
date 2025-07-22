'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Transaction, CashFlowData } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth } from 'date-fns';
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

  const { cashFlowData, summary } = useMemo(() => {
    if (!transactions) {
      return { cashFlowData: [], summary: { totalIncome: 0, totalExpense: 0, netFlow: 0 } };
    }

    const monthlyData: { [key: string]: { income: number, expense: number } } = {};

    transactions.forEach(t => {
      // Dexie returns date as string, so we need to convert it
      const date = new Date(t.date);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'expense') {
        monthlyData[monthKey].expense += t.amount;
      } else { // income
        monthlyData[monthKey].income += t.amount;
      }
    });

    const cashFlowData: CashFlowData[] = Object.keys(monthlyData).map(key => ({
      month: format(new Date(`${key}-01T00:00:00`), 'MMM yyyy', { locale: localeID }),
      Pemasukan: monthlyData[key].income,
      Pengeluaran: monthlyData[key].expense,
    })).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const netFlow = totalIncome - totalExpense;

    return { cashFlowData, summary: { totalIncome, totalExpense, netFlow } };
  }, [transactions]);
  
  if (transactions === undefined) {
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
      
      <div className="grid gap-8 lg:grid-cols-2">
         <Card>
            <CardHeader>
            <CardTitle>Grafik Pemasukan Bulanan</CardTitle>
            <CardDescription>Visualisasi pemasukan Anda setiap bulan.</CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
                <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend />
                <Bar dataKey="Pemasukan" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
            <CardTitle>Grafik Pengeluaran Bulanan</CardTitle>
            <CardDescription>Visualisasi pengeluaran Anda setiap bulan.</CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
                <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend />
                <Bar dataKey="Pengeluaran" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]}/>
                </BarChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
