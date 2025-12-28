import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import './Analytics.css';

export function Analytics() {
  const { transactions } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const [metrics, setMetrics] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    avgTransaction: 0
  });
  const [chartData, setChartData] = useState({
    monthly: [] as any[],
    categories: [] as any[]
  });

  useEffect(() => {
    if (transactions.length > 0) {
      processData(transactions);
    }
  }, [transactions]);

  const processData = (data: any[]) => {
    // Calculate Metrics
    const revenue = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = revenue - expenses;
    const avgTransaction = data.length > 0 ? (revenue + expenses) / data.length : 0;

    setMetrics({ revenue, expenses, profit, avgTransaction });

    // Process Monthly Data
    const monthlyMap = data.reduce((acc: any, t: any) => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
      
      if (t.type === 'income') acc[month].income += t.amount;
      else acc[month].expense += t.amount;
      
      return acc;
    }, {});

    // Sort months logically (simplified for now, assumes current year or sequential)
    const monthly = Object.values(monthlyMap);

    // Process Category Data
    const categoryMap = data.filter(t => t.type === 'expense').reduce((acc: any, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const categories = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));

    setChartData({ monthly, categories });
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="analytics-page">
      <header className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="text-secondary">Deep dive into your financial data.</p>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-icon green">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatAmount(metrics.revenue)}</div>
          <div className="kpi-trend up">
            <TrendingUp size={16} />
            <span>+12.5% vs last month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Expenses</span>
            <div className="kpi-icon red">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatAmount(metrics.expenses)}</div>
          <div className="kpi-trend down">
            <TrendingDown size={16} />
            <span>-2.4% vs last month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Net Profit</span>
            <div className="kpi-icon blue">
              <Activity size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatAmount(metrics.profit)}</div>
          <div className="kpi-trend up">
            <TrendingUp size={16} />
            <span>+8.2% vs last month</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <Card className="chart-card large">
          <div className="chart-title">
            <h3>Income vs Expenses</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `${currency.symbol}${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="chart-card">
          <div className="chart-title">
            <h3>Expense Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.categories.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="chart-card">
          <div className="chart-title">
            <h3>AI Insights</h3>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon-small info">
                <Lightbulb size={18} />
              </div>
              <p>Spending on <strong>Software</strong> is 15% higher than average.</p>
            </div>
            <div className="insight-item">
              <div className="insight-icon-small success">
                <CheckCircle size={18} />
              </div>
              <p>Revenue goal for November is <strong>92%</strong> achieved.</p>
            </div>
            <div className="insight-item">
              <div className="insight-icon-small warning">
                <AlertTriangle size={18} />
              </div>
              <p>Unusual spike in <strong>Travel</strong> expenses detected.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
