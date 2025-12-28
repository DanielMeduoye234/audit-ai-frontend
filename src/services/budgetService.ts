// Budget service for API calls
import { supabase } from '../lib/supabase';

export interface Budget {
  id?: number;
  user_id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
  created_at?: string;
}

export interface BudgetVariance {
  budget: Budget;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'under' | 'on_track' | 'over';
}

class BudgetService {
  async getBudgets(userId: string): Promise<Budget[]> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get budgets error:', error);
      throw error;
    }
  }

  async createBudget(budget: Budget): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([budget])
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Create budget error:', error);
      throw error;
    }
  }

  async updateBudget(budget: Budget): Promise<void> {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', budget.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Update budget error:', error);
      throw error;
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Delete budget error:', error);
      throw error;
    }
  }

  async getBudgetVariance(userId: string, startDate: string, endDate: string): Promise<BudgetVariance[]> {
    try {
      // 1. Fetch Budgets
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
      
      if (budgetError) throw budgetError;

      // 2. Fetch Transactions for the period
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (txError) throw txError;

      // 3. Summarize transactions by category
      const actualsMap = (transactions || []).reduce((acc: any, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
        return acc;
      }, {});

      // 4. Calculate variances
      return (budgets || []).map(budget => {
        const actual = actualsMap[budget.category] || 0;
        const variance = budget.amount - actual;
        const variancePercentage = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
        
        return {
          budget,
          actual,
          variance,
          variancePercentage,
          status: actual > budget.amount ? 'over' : (actual > budget.amount * 0.9 ? 'on_track' : 'under')
        };
      });
    } catch (error) {
      console.error('Budget variance error:', error);
      throw error;
    }
  }
}

export default new BudgetService();
