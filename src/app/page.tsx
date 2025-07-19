'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Transaction, TransactionType } from '@/lib/types';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import CategorySummary from '@/components/transactions/CategorySummary';
import Filters from '@/components/transactions/Filters';
import { addDays, startOfMonth } from 'date-fns';
import { db } from '@/lib/db';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'this-month' | 'last-30-days'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      const allTransactions = await db.transactions.toArray();
      setTransactions(allTransactions.map(t => ({...t, date: new Date(t.date)})));
      setIsLoading(false);
    };

    fetchTransactions();
  }, []);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransactionWithDate = { ...transaction, date: transaction.date.toISOString() };
    db.transactions.add(newTransactionWithDate).then(id => {
      const newTransactionForState = { ...transaction, id: String(id) };
      setTransactions(prev => [newTransactionForState, ...prev]);
    });
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    const now = new Date();
    if (filterDateRange === 'this-month') {
      const start = startOfMonth(now);
      filtered = filtered.filter(t => t.date >= start);
    } else if (filterDateRange === 'last-30-days') {
      const start = addDays(now, -30);
      filtered = filtered.filter(t => t.date >= start);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, filterType, filterDateRange]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">KeuanganKu</h1>
        <p className="text-center text-muted-foreground mt-2">Lacak arus masuk dan keluar keuangan Anda dengan mudah.</p>
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
          <TransactionList transactions={filteredTransactions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
