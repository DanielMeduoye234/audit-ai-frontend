import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, Info, DollarSign, Target } from 'lucide-react';
import analyticsService, { type FinancialInsight } from '../services/analyticsService';
import { Card } from './Card';
import './InsightsPanel.css';

interface InsightsPanelProps {
  userId: string;
}

export function InsightsPanel({ userId }: InsightsPanelProps) {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getInsights(userId);
      setInsights(data.slice(0, 5)); // Show top 5 insights
    } catch (err: any) {
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="insight-icon opportunity" />;
      case 'warning':
        return <AlertTriangle className="insight-icon warning" />;
      default:
        return <Info className="insight-icon info" />;
    }
  };

  const getInsightClass = (type: string) => {
    return `insight-item ${type}`;
  };

  if (loading) {
    return (
      <Card className="insights-panel">
        <div className="insights-header">
          <DollarSign className="header-icon" />
          <h3>Financial Insights</h3>
        </div>
        <div className="insights-loading">
          <div className="spinner"></div>
          <p>Analyzing your finances...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="insights-panel">
        <div className="insights-header">
          <DollarSign className="header-icon" />
          <h3>Financial Insights</h3>
        </div>
        <div className="insights-error">
          <AlertTriangle />
          <p>{error}</p>
          <button onClick={loadInsights} className="retry-button">Retry</button>
        </div>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="insights-panel">
        <div className="insights-header">
          <DollarSign className="header-icon" />
          <h3>Financial Insights</h3>
        </div>
        <div className="insights-empty">
          <Target className="empty-icon" />
          <p>No insights available yet</p>
          <span className="empty-subtitle">Add more transactions to get personalized recommendations</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="insights-panel">
      <div className="insights-header">
        <DollarSign className="header-icon" />
        <h3>Financial Insights</h3>
        <button onClick={loadInsights} className="refresh-button" title="Refresh">
          ↻
        </button>
      </div>

      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className={getInsightClass(insight.type)}>
            <div className="insight-icon-wrapper">
              {getInsightIcon(insight.type)}
            </div>
            <div className="insight-content">
              <div className="insight-header-row">
                <h4 className="insight-title">{insight.title}</h4>
                {insight.impact > 0 && (
                  <span className="insight-impact">
                    ${insight.impact.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="insight-description">{insight.description}</p>
              {insight.recommendation && insight.actionable && (
                <div className="insight-recommendation">
                  <strong>💡 Recommendation:</strong> {insight.recommendation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="insights-footer">
        <p className="insights-count">{insights.length} active insight{insights.length !== 1 ? 's' : ''}</p>
        <a href="/ai-chat" className="view-all-link">Ask AI for details →</a>
      </div>
    </Card>
  );
}
