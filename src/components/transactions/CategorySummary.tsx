'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction, CategorySummaryData } from '@/lib/types';

interface CategorySummaryProps {
  transactions: Transaction[];
}

export default function CategorySummary({ transactions }: CategorySummaryProps) {
  const summaryData = React.useMemo<CategorySummaryData[]>(() => {
    const expenseByCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expenseByCategory)
      .map(([category, total], index) => ({
        category,
        total,
        fill: `var(--color-chart-${(index % 5) + 1})`,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);
  
  const chartConfig = {
    total: {
      label: 'Total',
    },
    ...summaryData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      }
      return acc;
    }, {})
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Spending by Category</CardTitle>
        <CardDescription>
          A summary of your expenses for the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaryData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    width={80}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                    content={<ChartTooltipContent
                        formatter={(value) => new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        }).format(value as number)}
                    />}
                />
                <Bar dataKey="total" radius={4} />
                </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center">
            <p className="text-muted-foreground">No expense data to display.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
