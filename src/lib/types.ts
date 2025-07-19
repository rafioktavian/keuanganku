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
