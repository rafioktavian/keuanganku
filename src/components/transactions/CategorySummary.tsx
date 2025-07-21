
'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
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
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
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
        <CardTitle className="font-headline">Pengeluaran per Kategori</CardTitle>
        <CardDescription>
          Ringkasan pengeluaran Anda untuk periode yang dipilih.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaryData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-square">
            <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                 <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                    content={<ChartTooltipContent
                        nameKey="category"
                        formatter={(value, name) => [
                            new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                            }).format(value as number),
                            name
                        ]}
                    />}
                />
                 <Pie
                    data={summaryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    labelLine={false}
                    label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        percent,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
          
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--card-foreground))"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            className="text-xs font-bold"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                  >
                    {summaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                 </Pie>
               </PieChart>
            </ResponsiveContainer>
            </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center">
            <p className="text-muted-foreground">Tidak ada data pengeluaran untuk ditampilkan.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
