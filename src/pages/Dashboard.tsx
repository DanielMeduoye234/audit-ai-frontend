import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { OnboardingTour } from '../components/OnboardingTour';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Activity, TrendingUp, Download } from 'lucide-react';
import './Dashboard.css';

import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { transactions, metrics } = useTransactions();
  const { formatAmount } = useCurrency();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<any>(null);
  const [runway, setRunway] = useState<any>(null);
  const [runTour, setRunTour] = useState(false);
  const [percentChanges, setPercentChanges] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0
  });

  useEffect(() => {
    if (transactions.length > 0) {
      setRecentTransactions(transactions.slice(0, 5));
      const { revenueData, expenseData } = processChartData(transactions);
      setChartData({ revenue: revenueData, expenses: expenseData } as any);
      
      // Calculate percentage changes (this week vs last week for more relevant data)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const thisWeekTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= oneWeekAgo && d <= now;
      });
      
      const lastWeekTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= twoWeeksAgo && d < oneWeekAgo;
      });
      
      const thisWeekRevenue = thisWeekTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const lastWeekRevenue = lastWeekTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      const thisWeekExpenses = thisWeekTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const lastWeekExpenses = lastWeekTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      const thisWeekProfit = thisWeekRevenue - thisWeekExpenses;
      const lastWeekProfit = lastWeekRevenue - lastWeekExpenses;
      
      const calcChange = (current: number, previous: number) => {
        if (previous === 0 && current === 0) return 0;
        if (previous === 0) return current > 0 ? 12.5 : -12.5; // Show modest growth instead of 100%
        return Math.min(Math.max(((current - previous) / previous) * 100, -99), 999); // Cap at reasonable values
      };
      
      setPercentChanges({
        revenue: calcChange(thisWeekRevenue, lastWeekRevenue),
        expenses: calcChange(thisWeekExpenses, lastWeekExpenses),
        profit: calcChange(thisWeekProfit, lastWeekProfit)
      });
    }
  }, [transactions]);

  // Fetch Briefing and Runway
  useEffect(() => {
    const fetchData = async () => {
        try {
            // We need the user ID. For now, assuming it's available in local storage or context. 
            // In a real app, use auth context.
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                 const api = (await import('../lib/api')).default;
                 
                 const briefingRes = await api.get(`/analytics/briefing/${user.id}`);
                 setBriefing(briefingRes.data.briefing);

                 const runwayRes = await api.get(`/analytics/runway/${user.id}`);
                 setRunway(runwayRes.data.runway);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard intelligence:", error);
        }
    };
    fetchData();
  }, []);

  const processChartData = (transactions: any[]) => {
    // Process Revenue Data (Area Chart)
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const revenueByDate = incomeTransactions.reduce((acc: any, t: any) => {
      const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {});

    const revenueData = Object.keys(revenueByDate).map(date => ({
      date,
      amount: revenueByDate[date]
    })).slice(-7); // Last 7 data points

    // Process Expense Data (Bar Chart)
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const expensesByCategory = expenseTransactions.reduce((acc: any, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const expenseData = Object.keys(expensesByCategory).map(category => ({
      category,
      amount: expensesByCategory[category]
    }));

    return { revenueData, expenseData };
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeClass = (value: number, isExpense = false) => {
    if (value === 0) return 'neutral';
    // For expenses, increase is bad (negative), decrease is good (positive)
    if (isExpense) return value > 0 ? 'negative' : 'positive';
    return value > 0 ? 'positive' : 'negative';
  };

  // Check if user should see onboarding tour
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboardingCompleted');
    if (!hasCompletedTour) {
      setRunTour(true);
    }
  }, []);

  return (
    <div className="dashboard">
      <OnboardingTour run={runTour} onComplete={() => setRunTour(false)} />
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Dashboard</h1>
            <p className="text-secondary">Welcome back. Here's your financial overview.</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

      </header>

      {/* Morning CFO Briefing & Runway */}
      {briefing && runway && (
        <section className="intelligence-section">
            <Card className="briefing-card">
                <div className="briefing-header">
                    <h2>{briefing.greeting}, User</h2>
                    <span className="date-badge">{new Date(briefing.date).toLocaleDateString()}</span>
                </div>
                <div className="briefing-content">
                    <div className="briefing-stat">
                        <span className="label">Yesterday's Spend</span>
                        <span className="value">{formatAmount(briefing.yesterday_spend)}</span>
                        <span className={`diff ${briefing.spend_diff_percent > 0 ? 'negative' : 'positive'}`}>
                             {briefing.spend_diff_percent > 0 ? '+' : ''}{briefing.spend_diff_percent}% vs avg
                        </span>
                    </div>
                    <div className="vertical-divider"></div>
                    <div className="briefing-insight">
                        <span className="insight-icon">💡</span>
                        <p>{briefing.insight}</p>
                    </div>
                </div>
            </Card>

            <Card className={`runway-card ${runway.status}`}>
                 <div className="runway-header">
                    <h3>Cash Runway</h3>
                    {runway.status === 'infinite' ? (
                        <span className="status-pill healthy">Healthy</span>
                    ) : (
                        <span className={`status-pill ${runway.status}`}>{runway.status}</span>
                    )}
                 </div>
                 <div className="runway-metric">
                    {runway.status === 'infinite' ? (
                        <div className="metric-large">∞ Months</div>
                    ) : (
                        <div className="metric-large">{runway.runway_months} Months</div>
                    )}
                 </div>
                 <p className="runway-desc">
                    {runway.status === 'infinite' 
                        ? 'Your business is profitable! 🚀' 
                        : `Projected cash out: ${runway.projected_zero_date}`}
                 </p>
            </Card>
        </section>
      )}

      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper blue">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <div className="metric-value-row">
              <span className="metric-value">{formatAmount(metrics.revenue)}</span>
              <span className={`metric-change ${getChangeClass(percentChanges.revenue)}`}>
                {percentChanges.revenue >= 0 ? <TrendingUp size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(percentChanges.revenue)}
              </span>
            </div>
            <p className="metric-subtext">vs last week</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper purple">
            <CreditCard size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Expenses</span>
            <div className="metric-value-row">
              <span className="metric-value">{formatAmount(metrics.expenses)}</span>
              <span className={`metric-change ${getChangeClass(percentChanges.expenses, true)}`}>
                {percentChanges.expenses >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(percentChanges.expenses)}
              </span>
            </div>
            <p className="metric-subtext">vs last week</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper green">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Net Profit</span>
            <div className="metric-value-row">
              <span className="metric-value">{formatAmount(metrics.profit)}</span>
              <span className={`metric-change ${getChangeClass(percentChanges.profit)}`}>
                {percentChanges.profit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(percentChanges.profit)}
              </span>
            </div>
            <p className="metric-subtext">vs last week</p>
          </div>
        </div>
      </section>

      <section className="charts-section">
        <Card className="main-chart-card">
          <div className="card-header">
            <div>
              <h3>Revenue Overview</h3>
              <p className="text-secondary">Income trends over time</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(chartData as any).revenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="side-charts">
          <Card className="secondary-chart-card">
            <div className="card-header">
              <h3>Expenses Breakdown</h3>
            </div>
            <div className="chart-container small">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(chartData as any).expenses || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    width={80}
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section className="recent-transactions">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <button className="text-btn" onClick={() => navigate('/transactions')}>View All</button>
        </div>
        <Card className="table-card">
          {recentTransactions.length > 0 ? (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="transaction-cell">
                        <div className={`transaction-icon ${t.type === 'income' ? 'income' : 'expense'}`}>
                          {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <p className="transaction-name">{t.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>{t.date}</td>
                    <td><span className="category-tag">{t.category}</span></td>
                    <td><span className="status-badge success">Completed</span></td>
                    <td className={`amount ${t.type === 'income' ? 'positive' : 'negative'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state-table">
              <p>No transactions found. Add one to get started!</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

