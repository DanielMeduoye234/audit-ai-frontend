import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Users, Zap } from 'lucide-react';
import analyticsService, { type ScenarioInput, type ScenarioResult } from '../services/analyticsService';
import { Card } from './Card';
import './ScenarioSimulator.css';

interface ScenarioSimulatorProps {
  userId: string;
}

export function ScenarioSimulator({ userId }: ScenarioSimulatorProps) {
  const [scenarioType, setScenarioType] = useState<ScenarioInput['type']>('new_hire');
  const [monthlyImpact, setMonthlyImpact] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarioTypes = [
    { value: 'new_hire', label: 'New Hire', icon: Users, impact: -6000 },
    { value: 'price_change', label: 'Price Change', icon: DollarSign, impact: 5000 },
    { value: 'cost_reduction', label: 'Cost Reduction', icon: TrendingDown, impact: 3000 },
    { value: 'revenue_increase', label: 'Revenue Increase', icon: TrendingUp, impact: 10000 },
    { value: 'custom', label: 'Custom', icon: Zap, impact: 0 },
  ];

  const handleScenarioTypeChange = (type: ScenarioInput['type']) => {
    setScenarioType(type);
    const selected = scenarioTypes.find(s => s.value === type);
    if (selected && type !== 'custom') {
      setMonthlyImpact(selected.impact);
      setDescription(`${selected.label} scenario`);
    } else {
      setMonthlyImpact(0);
      setDescription('');
    }
    setResult(null);
  };

  const handleSimulate = async () => {
    if (!description || monthlyImpact === 0) {
      setError('Please provide a description and monthly impact');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scenario: ScenarioInput = {
        type: scenarioType,
        monthly_impact: monthlyImpact,
        description,
        duration_months: durationMonths
      };

      const simulationResult = await analyticsService.simulateScenario(userId, scenario);
      setResult(simulationResult);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate scenario');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f87171';
      default: return '#6366f1';
    }
  };

  return (
    <Card className="scenario-simulator">
      <div className="simulator-header">
        <Calculator className="header-icon" />
        <h3>Scenario Simulator</h3>
      </div>

      <div className="simulator-form">
        <div className="form-group">
          <label>Scenario Type</label>
          <div className="scenario-types">
            {scenarioTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  className={`scenario-type-btn ${scenarioType === type.value ? 'active' : ''}`}
                  onClick={() => handleScenarioTypeChange(type.value as ScenarioInput['type'])}
                >
                  <Icon className="type-icon" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Monthly Impact ($)</label>
            <input
              type="number"
              value={monthlyImpact}
              onChange={(e) => setMonthlyImpact(parseFloat(e.target.value) || 0)}
              placeholder="e.g., -6000 for cost, +5000 for revenue"
              className="form-input"
            />
            <span className="form-hint">Negative for costs, positive for revenue</span>
          </div>

          <div className="form-group">
            <label>Duration (months)</label>
            <input
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
              min="1"
              max="24"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Hire senior developer"
            className="form-input"
          />
        </div>

        <button 
          onClick={handleSimulate} 
          disabled={loading || !description || monthlyImpact === 0}
          className="simulate-button"
        >
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="simulation-results">
          <h4>Simulation Results</h4>

          <div className="results-grid">
            <div className="result-card">
              <span className="result-label">Current Profit</span>
              <span className="result-value">${result.current_profit.toLocaleString()}</span>
            </div>

            <div className="result-card">
              <span className="result-label">Projected Profit</span>
              <span className={`result-value ${result.projected_profit >= result.current_profit ? 'positive' : 'negative'}`}>
                ${result.projected_profit.toLocaleString()}
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">Change</span>
              <span className={`result-value ${result.profit_change >= 0 ? 'positive' : 'negative'}`}>
                {result.profit_change >= 0 ? '+' : ''}${result.profit_change.toLocaleString()}
                <span className="result-percentage">
                  ({result.profit_change_percentage >= 0 ? '+' : ''}{result.profit_change_percentage.toFixed(1)}%)
                </span>
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">Risk Level</span>
              <span className="result-value" style={{ color: getRiskColor(result.risk_level) }}>
                {result.risk_level.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="recommendation-box">
            <h5>💡 AI Recommendation</h5>
            <p>{result.recommendation}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
