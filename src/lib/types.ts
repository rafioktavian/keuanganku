export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  type: TransactionType;
}

export interface CategorySummaryData {
  category: string;
  total: number;
  fill: string;
}
