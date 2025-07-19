'use client';

import { useState, useMemo } from 'react';
import type { Transaction, TransactionType } from '@/lib/types';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import CategorySummary from '@/components/transactions/CategorySummary';
import Filters from '@/components/transactions/Filters';
import { addDays, startOfMonth } from 'date-fns';

const initialTransactions: Transaction[] = [
  { id: '1', type: 'income', amount: 5000000, category: 'Salary', description: 'Monthly Salary', date: new Date('2024-07-01') },
  { id: '2', type: 'expense', amount: 75000, category: 'Food', description: 'Lunch with colleagues', date: new Date('2024-07-05') },
  { id: '3', type: 'expense', amount: 250000, category: 'Transport', description: 'Monthly train pass', date: new Date('2024-07-02') },
  { id: '4', type: 'expense', amount: 1500000, category: 'Bills', description: 'House Rent', date: new Date('2024-07-01') },
  { id: '5', type: 'expense', amount: 120000, category: 'Entertainment', description: 'Cinema tickets', date: new Date('2024-07-10') },
  { id: '6', type: 'expense', amount: 50000, category: 'Food', description: 'Coffee', date: new Date('2024-07-12') },
];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'this-month' | 'last-30-days'>('all');

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by date range
    const now = new Date();
    if (filterDateRange === 'this-month') {
      const start = startOfMonth(now);
      filtered = filtered.filter(t => t.date >= start);
    } else if (filterDateRange === 'last-30-days') {
      const start = addDays(now, -30);
      filtered = filtered.filter(t => t.date >= start);
    }

    // Sort by date descending
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, filterType, filterDateRange]);

  return (
    <main className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-primary-foreground font-headline">KeuanganKu</h1>
        <p className="text-center text-muted-foreground mt-2">Track your financial inflows and outflows with ease.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <TransactionForm onAddTransaction={addTransaction} />
          <CategorySummary transactions={transactions} />
        </div>
        <div className="lg:col-span-2">
          <Filters
            onTypeChange={setFilterType}
            onDateChange={setFilterDateRange}
            currentType={filterType}
            currentDateRange={filterDateRange}
          />
          <TransactionList transactions={filteredTransactions} />
        </div>
      </div>
    </main>
  );
}
