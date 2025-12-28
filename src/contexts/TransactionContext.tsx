import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';

export interface Transaction {
  id: number;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  receipt?: string;
}

interface Metrics {
  revenue: number;
  expenses: number;
  profit: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  metrics: Metrics;
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    revenueChange: 0,
    expensesChange: 0,
    profitChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTransactions = useCallback(async () => {
    const userId = user?.id;
    
    if (!userId) {
      setTransactions([]);
      setMetrics({
        revenue: 0,
        expenses: 0,
        profit: 0,
        revenueChange: 0,
        expensesChange: 0,
        profitChange: 0
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Fetching transactions from backend API for user:', userId);
      
      // Fetch transactions from backend API
      const transactionsResponse = await api.get(`/transactions/${userId}`);
      const fetchedTransactions = transactionsResponse.data.transactions || [];
      
      // Fetch summary from backend API
      const summaryResponse = await api.get(`/transactions/summary/${userId}`);
      const summary = summaryResponse.data;
      
      setTransactions(fetchedTransactions);
      setMetrics({
        revenue: summary.revenue || 0,
        expenses: summary.expenses || 0,
        profit: summary.profit || 0,
        revenueChange: 0,
        expensesChange: 0,
        profitChange: 0
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      await api.post('/transactions', { ...transaction, user_id: user.id });
      await fetchTransactions();
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      await api.put(`/transactions/${transaction.id}`, transaction);
      await fetchTransactions();
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`);
      await fetchTransactions();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  const value = {
    transactions,
    metrics,
    loading,
    error,
    refreshTransactions: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
