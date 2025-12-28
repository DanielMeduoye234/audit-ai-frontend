import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import analyticsService, { type CashFlowProjection } from '../services/analyticsService';
import { Card } from './Card';
import './CashFlowForecast.css';

interface CashFlowForecastProps {
  userId: string;
  months?: number;
}

export function CashFlowForecast({ userId, months = 3 }: CashFlowForecastProps) {
  const [forecast, setForecast] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForecast();
  }, [userId, months]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getCashFlowForecast(userId, months);
      setForecast(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getMaxValue = () => {
    if (forecast.length === 0) return 0;
    return Math.max(...forecast.map(f => Math.max(f.projected_income, f.projected_expenses, f.projected_balance)));
  };

  const getBarHeight = (value: number) => {
    const max = getMaxValue();
    return max > 0 ? (value / max) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="cash-flow-forecast">
        <div className="forecast-header">
          <TrendingUp className="header-icon" />
          <h3>Cash Flow Forecast</h3>
        </div>
        <div className="forecast-loading">
          <div className="spinner"></div>
          <p>Generating forecast...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="cash-flow-forecast">
        <div className="forecast-header">
          <TrendingUp className="header-icon" />
          <h3>Cash Flow Forecast</h3>
        </div>
        <div className="forecast-error">
          <p>{error}</p>
          <button onClick={loadForecast} className="retry-button">Retry</button>
        </div>
      </Card>
    );
  }

  if (forecast.length === 0) {
    return (
      <Card className="cash-flow-forecast">
        <div className="forecast-header">
          <TrendingUp className="header-icon" />
          <h3>Cash Flow Forecast</h3>
        </div>
        <div className="forecast-empty">
          <Calendar className="empty-icon" />
          <p>Not enough data to generate forecast</p>
          <span className="empty-subtitle">Add more transactions to see projections</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="cash-flow-forecast">
      <div className="forecast-header">
        <TrendingUp className="header-icon" />
        <h3>Cash Flow Forecast ({months} Months)</h3>
      </div>

      <div className="forecast-chart">
        {forecast.map((projection, index) => (
          <div key={index} className="forecast-month">
            <div className="forecast-bars">
              <div className="bar-group">
                <div 
                  className="bar income" 
                  style={{ height: `${getBarHeight(projection.projected_income)}%` }}
                  title={`Income: $${projection.projected_income.toLocaleString()}`}
                >
                  <span className="bar-value">${(projection.projected_income / 1000).toFixed(0)}k</span>
                </div>
                <div 
                  className="bar expenses" 
                  style={{ height: `${getBarHeight(projection.projected_expenses)}%` }}
                  title={`Expenses: $${projection.projected_expenses.toLocaleString()}`}
                >
                  <span className="bar-value">${(projection.projected_expenses / 1000).toFixed(0)}k</span>
                </div>
                <div 
                  className="bar balance" 
                  style={{ height: `${getBarHeight(projection.projected_balance)}%` }}
                  title={`Balance: $${projection.projected_balance.toLocaleString()}`}
                >
                  <span className="bar-value">${(projection.projected_balance / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </div>
            <div className="forecast-month-label">
              {formatMonth(projection.month)}
            </div>
            <div className="forecast-confidence">
              {(projection.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        ))}
      </div>

      <div className="forecast-legend">
        <div className="legend-item">
          <div className="legend-color income"></div>
          <span>Projected Income</span>
        </div>
        <div className="legend-item">
          <div className="legend-color expenses"></div>
          <span>Projected Expenses</span>
        </div>
        <div className="legend-item">
          <div className="legend-color balance"></div>
          <span>Projected Balance</span>
        </div>
      </div>

      <div className="forecast-summary">
        {forecast.length > 0 && (
          <>
            <div className="summary-item">
              <DollarSign className="summary-icon" />
              <div>
                <span className="summary-label">Final Balance</span>
                <span className="summary-value">
                  ${forecast[forecast.length - 1].projected_balance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="summary-item">
              {forecast[forecast.length - 1].projected_balance > forecast[0].projected_balance ? (
                <TrendingUp className="summary-icon positive" />
              ) : (
                <TrendingDown className="summary-icon negative" />
              )}
              <div>
                <span className="summary-label">Trend</span>
                <span className={`summary-value ${forecast[forecast.length - 1].projected_balance > forecast[0].projected_balance ? 'positive' : 'negative'}`}>
                  {forecast[forecast.length - 1].projected_balance > forecast[0].projected_balance ? 'Growing' : 'Declining'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
