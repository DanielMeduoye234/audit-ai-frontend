// Frontend API Service for Analytics
import { supabase } from '../lib/supabase';

export interface CashFlowProjection {
  month: string;
  projected_income: number;
  projected_expenses: number;
  projected_balance: number;
  confidence: number;
}

export interface SpendingPattern {
  category: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendData {
  period: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface FinancialInsight {
  type: 'opportunity' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  impact: number;
  actionable: boolean;
  recommendation?: string;
}

export interface ScenarioInput {
  type: 'new_hire' | 'price_change' | 'cost_reduction' | 'revenue_increase' | 'custom';
  monthly_impact: number;
  description: string;
  duration_months?: number;
}

export interface ScenarioResult {
  scenario: ScenarioInput;
  current_profit: number;
  projected_profit: number;
  profit_change: number;
  profit_change_percentage: number;
  cash_runway_current: number;
  cash_runway_projected: number;
  break_even_months?: number;
  recommendation: string;
  risk_level: 'low' | 'medium' | 'high';
}

class AnalyticsService {
  /**
   * Get cash flow forecast
   */
  async getCashFlowForecast(userId: string, months: number = 3): Promise<CashFlowProjection[]> {
    try {
      // For now, calculate client-side based on transaction history
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      
      if (error) throw error;

      // Simple forecast logic (average monthly revenue/expense)
      const monthlyTotals: any = {};
      transactions?.forEach(tx => {
        const month = tx.date.substring(0, 7);
        if (!monthlyTotals[month]) monthlyTotals[month] = { income: 0, expense: 0 };
        if (tx.type === 'income') monthlyTotals[month].income += Number(tx.amount);
        else monthlyTotals[month].expense += Number(tx.amount);
      });

      const monthsList = Object.keys(monthlyTotals);
      const avgIncome = monthsList.length > 0 ? (Object.values(monthlyTotals) as any[]).reduce((sum, m) => sum + m.income, 0) / monthsList.length : 0;
      const avgExpense = monthsList.length > 0 ? (Object.values(monthlyTotals) as any[]).reduce((sum, m) => sum + m.expense, 0) / monthsList.length : 0;

      const forecast: CashFlowProjection[] = [];
      let currentBalance = transactions?.reduce((sum, tx) => sum + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)), 0) || 0;

      for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        currentBalance += (avgIncome - avgExpense);
        
        forecast.push({
          month: monthName,
          projected_income: avgIncome,
          projected_expenses: avgExpense,
          projected_balance: currentBalance,
          confidence: 0.8
        });
      }

      return forecast;
    } catch (error) {
      console.error('Cash flow forecast error:', error);
      throw error;
    }
  }

  /**
   * Get spending patterns
   */
  async getSpendingPatterns(userId: string, startDate?: string, endDate?: string): Promise<SpendingPattern[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'expense');
      
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data: transactions, error } = await query;
      if (error) throw error;

      const patternsMap: Record<string, { category: string; total: number; count: number }> = {};
      const totalSpend = (transactions as any[])?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      (transactions as any[])?.forEach(tx => {
        if (!patternsMap[tx.category]) {
          patternsMap[tx.category] = { category: tx.category, total: 0, count: 0 };
        }
        patternsMap[tx.category].total += Number(tx.amount);
        patternsMap[tx.category].count += 1;
      });

      return Object.values(patternsMap).map((p: any) => ({
        ...p,
        average: p.total / p.count,
        percentage: totalSpend > 0 ? (p.total / totalSpend) * 100 : 0,
        trend: 'stable' as const
      }));
    } catch (error) {
      console.error('Spending patterns error:', error);
      throw error;
    }
  }

  /**
   * Get financial trends
   */
  async getTrends(userId: string, months: number = 6): Promise<TrendData[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0]);
      
      if (error) throw error;

      const monthlyData: any = {};
      transactions?.forEach(tx => {
        const month = tx.date.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { period: month, income: 0, expenses: 0, profit: 0 };
        if (tx.type === 'income') monthlyData[month].income += Number(tx.amount);
        else monthlyData[month].expenses += Number(tx.amount);
        monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
      });

      return (Object.values(monthlyData) as TrendData[]).sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Trends error:', error);
      throw error;
    }
  }

  /**
   * Simulate business scenario
   */
  async simulateScenario(userId: string, scenario: ScenarioInput): Promise<ScenarioResult> {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'simulate-scenario', userId, scenario }
      });
      
      if (error) throw error;
      return data.result;
    } catch (error) {
      console.error('Scenario simulation error:', error);
      throw error;
    }
  }

  /**
   * Get proactive financial insights
   */
  async getInsights(userId: string): Promise<FinancialInsight[]> {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'get-insights', userId }
      });
      
      if (error) throw error;
      return data.insights;
    } catch (error) {
      console.error('Insights error:', error);
      // Return fallback insights if function fails
      return [
        { type: 'info', category: 'General', title: 'Data Migration', description: 'Your data is now securely stored in Supabase.', impact: 0, actionable: false }
      ];
    }
  }

  /**
   * Detect recurring transactions
   */
  async getRecurringTransactions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'get-recurring', userId }
      });
      
      if (error) throw error;
      return data.recurring || [];
    } catch (error) {
      console.error('Recurring transactions error:', error);
      return [];
    }
  }

  /**
   * Trigger anomaly detection
   */
  async detectAnomalies(userId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('analytics', {
        body: { action: 'detect-anomalies', userId }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
