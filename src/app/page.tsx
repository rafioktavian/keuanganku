'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Transaction, TransactionType, DateRange } from '@/lib/types';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import CategorySummary from '@/components/transactions/CategorySummary';
import Filters from '@/components/transactions/Filters';
import { db } from '@/lib/db';
import SavingsAdvisor from '@/components/transactions/SavingsAdvisor';
import { endOfDay, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setIsLoading(true);
    const allTransactions = await db.transactions.toArray();
    setTransactions(allTransactions.map(t => ({...t, date: new Date(t.date)})));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransactionWithDate = { ...transaction, date: transaction.date.toISOString() };
    try {
      const { amount, linkedTo, type: transactionType } = transaction;

      // Handle linked transactions
      if (linkedTo) {
        const [type, linkedIdStr] = linkedTo.split('_');
        const linkedId = parseInt(linkedIdStr, 10);
        
        if (type === 'goal') {
            await db.goals.where({id: linkedId}).modify(g => { g.currentAmount += amount });
        } else if (type === 'investment') {
            if (transactionType === 'expense') {
              // Add to investment (top up)
              await db.investments.where({id: linkedId}).modify(i => { 
                i.initialAmount += amount;
                i.currentValue += amount; // Assuming top up also increases current value
              });
            } else { // income
              // Divestment (sell)
              await db.investments.where({id: linkedId}).modify(i => {
                // Ensure currentValue is not zero to avoid division by zero
                if (i.currentValue > 0) {
                    const proportion = amount / i.currentValue;
                    if (proportion < 1) {
                      // If selling a portion, reduce initialAmount proportionally
                      i.initialAmount = i.initialAmount * (1 - proportion);
                    } else {
                      // If selling all or more than current value, initial amount becomes 0
                      i.initialAmount = 0; 
                    }
                }
                i.currentValue = Math.max(0, i.currentValue - amount);
              });
            }
        } else if (type === 'debt' || type === 'receivable') {
            const debt = await db.debts.get(linkedId);
            if (debt) {
                const newCurrentAmount = debt.currentAmount - amount;
                const newStatus = newCurrentAmount <= 0 ? 'paid' : 'unpaid';
                await db.debts.update(linkedId, { currentAmount: Math.max(0, newCurrentAmount), status: newStatus });
            }
        }
      }

      await db.transactions.add(newTransactionWithDate);
      await fetchTransactions(); // Refetch to get the latest data with correct id
      setIsFormOpen(false);
      toast({ title: 'Sukses', description: 'Transaksi berhasil ditambahkan.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambahkan transaksi.' });
    }
  };

  const handleUpdateTransaction = async (id: number | string, transaction: Omit<Transaction, 'id'>) => {
    const updatedTransaction = { ...transaction, date: transaction.date.toISOString() };
     try {
      // NOTE: Updating a linked transaction's amount would be complex.
      // It would require knowing the *original* amount to revert the change
      // on the linked item and then apply the new one.
      // For simplicity, this logic is omitted. The link itself is disabled on edit.
      await db.transactions.update(id, updatedTransaction);
      await fetchTransactions();
      setIsFormOpen(false);
      setEditingTransaction(null);
      toast({ title: 'Sukses', description: 'Transaksi berhasil diperbarui.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memperbarui transaksi.' });
    }
  };


  const handleDeleteTransaction = async (transaction: Transaction) => {
    const { id, amount, linkedTo, type: transactionType } = transaction;
    if (id === undefined) return;
    
    try {
      // Revert linked transaction logic
      if (linkedTo) {
        const [type, linkedIdStr] = linkedTo.split('_');
        const linkedId = parseInt(linkedIdStr, 10);
        if (type === 'goal') {
          await db.goals.where({id: linkedId}).modify(g => { g.currentAmount -= amount });
        } else if (type === 'investment') {
          const investment = await db.investments.get(linkedId);
          if (investment) {
              if (transactionType === 'expense') { // Revert a top-up
                await db.investments.update(linkedId, { 
                  initialAmount: investment.initialAmount - amount,
                  currentValue: investment.currentValue - amount
                });
              } else { // Revert a divestment
                const valueAfterSale = investment.currentValue;
                const valueBeforeSale = valueAfterSale + amount;
                let initialAmountBeforeSale = investment.initialAmount;

                // Re-calculate initialAmount before the sale
                if (valueBeforeSale > 0) {
                  const proportionRemaining = valueAfterSale / valueBeforeSale;
                  initialAmountBeforeSale = investment.initialAmount / proportionRemaining;
                } else {
                  // If all was sold, we can't perfectly recover the initial amount proportion.
                  // As a fallback, just add the amount back. This is an approximation.
                  initialAmountBeforeSale = investment.initialAmount + amount;
                }
                
                await db.investments.update(linkedId, {
                  currentValue: valueBeforeSale,
                  initialAmount: initialAmountBeforeSale,
                });
              }
          }
        } else if (type === 'debt' || type === 'receivable') {
          await db.debts.where({id: linkedId}).modify(d => { 
            d.currentAmount += amount;
            // If reverting a payment makes it unpaid, change status back
            if (d.currentAmount > 0) {
              d.status = 'unpaid';
            }
           });
        }
      }

      await db.transactions.delete(Number(id));
      await fetchTransactions();
      toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus.' });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus transaksi.' });
    }
  };
  
  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  }
  
  const openAddForm = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  }

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (filterDateRange?.from && filterDateRange?.to) {
        const startDate = startOfDay(filterDateRange.from);
        const endDate = endOfDay(filterDateRange.to);
        filtered = filtered.filter(t => t.date >= startDate && t.date <= endDate);
    } else if (filterDateRange?.from) {
        const startDate = startOfDay(filterDateRange.from);
        filtered = filtered.filter(t => t.date >= startDate);
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
          <div className="lg:hidden">
            <TransactionForm 
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onClose={() => setIsFormOpen(false)}
              isOpen={isFormOpen}
              transactionToEdit={editingTransaction}
              key={editingTransaction ? editingTransaction.id : 'add'}
            />
          </div>
          <SavingsAdvisor transactions={transactions} />
          <CategorySummary transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-2">
          <div className="hidden lg:block">
             <TransactionForm 
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onClose={() => setIsFormOpen(false)}
              isOpen={isFormOpen}
              transactionToEdit={editingTransaction}
              key={editingTransaction ? `edit-${editingTransaction.id}` : 'add-desktop'}
            />
          </div>
          <Filters
            onTypeChange={setFilterType}
            onDateChange={setFilterDateRange}
            currentType={filterType}
            currentDateRange={filterDateRange}
            onAddTransactionClick={openAddForm}
          />
          <TransactionList 
            transactions={filteredTransactions} 
            isLoading={isLoading}
            onEdit={openEditForm}
            onDelete={handleDeleteTransaction}
          />
        </div>
      </div>
    </div>
  );
}
