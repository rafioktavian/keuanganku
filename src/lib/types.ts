import type { DateRange as ReactDateRange } from 'react-day-picker';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string | number; // number for auto-increment from dexie
  amount: number;
  date: Date;
  category: string;
  fundSource: string;
  description: string;
  type: TransactionType;
}

export interface TransactionDB extends Omit<Transaction, 'id' | 'date'> {
    id?: number;
    date: string;
}


export interface CategorySummaryData {
  category: string;
  total: number;
  fill: string;
}

export interface Category {
    id?: number;
    name: string;
    type: TransactionType;
}

export interface FundSource {
    id?: number;
    name: string;
}

export interface Goal {
    id?: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
}

export interface GoalDB extends Omit<Goal, 'targetDate'> {
    targetDate: string;
}

export interface Investment {
    id?: number;
    name: string;
    type: string;
    initialAmount: number;
    currentValue: number;
    purchaseDate: Date;
}

export interface InvestmentDB extends Omit<Investment, 'purchaseDate'> {
    purchaseDate: string;
}

export type DebtType = 'debt' | 'receivable';
export type DebtStatus = 'unpaid' | 'paid';

export interface Debt {
    id?: number;
    type: DebtType;
    personName: string;
    amount: number;
    currentAmount: number; // Sisa utang/piutang
    dueDate: Date;
    status: DebtStatus;
    description: string;
}

export interface DebtDB extends Omit<Debt, 'dueDate'> {
    dueDate: string;
}


export type DateRange = ReactDateRange;
