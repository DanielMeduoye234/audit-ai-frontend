import { useState } from 'react';
import { X, FileText, Calendar, Filter } from 'lucide-react';
import './ReportGenerationModal.css';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (reportData: ReportData) => void;
}

export interface ReportData {
  type: 'financial' | 'transaction' | 'analytics' | 'compliance';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    type?: 'income' | 'expense';
    category?: string;
  };
}

const reportTypes = [
  {
    id: 'financial',
    name: 'Financial Summary',
    description: 'Revenue, expenses, profit margins by period',
    icon: '💰',
  },
  {
    id: 'transaction',
    name: 'Transaction Log',
    description: 'Detailed transaction history with filters',
    icon: '📋',
  },
  {
    id: 'analytics',
    name: 'Analytics Report',
    description: 'Spending patterns, trends, and insights',
    icon: '📊',
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Audit trails and regulatory documentation',
    icon: '✅',
  },
];

const datePresets = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last Year', days: 365 },
];

export function ReportGenerationModal({ isOpen, onClose, onGenerate }: ReportGenerationModalProps) {
  const [selectedType, setSelectedType] = useState<string>('financial');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'income' | 'expense' | ''>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const handleGenerate = async () => {
    if (!selectedType || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);

    const reportData: ReportData = {
      type: selectedType as any,
      dateRange: {
        startDate,
        endDate,
      },
    };

    // Add filters if applicable
    if (selectedType === 'transaction' && (filterType || filterCategory)) {
      reportData.filters = {};
      if (filterType) reportData.filters.type = filterType;
      if (filterCategory) reportData.filters.category = filterCategory;
    }

    try {
      await onGenerate(reportData);
      // Reset form
      setSelectedType('financial');
      setStartDate('');
      setEndDate('');
      setFilterType('');
      setFilterCategory('');
      onClose();
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Generate New Report</h3>
            <p className="text-secondary">Create a custom CSV report with your financial data</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Report Type Selection */}
          <div className="form-section">
            <label className="form-label">
              <FileText size={16} />
              Report Type
            </label>
            <div className="report-type-grid">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  className={`report-type-option ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="report-type-icon">{type.icon}</div>
                  <div>
                    <h4>{type.name}</h4>
                    <p>{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="form-section">
            <label className="form-label">
              <Calendar size={16} />
              Date Range
            </label>
            <div className="date-presets">
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  className="btn-preset"
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="date-inputs">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Filters (only for transaction reports) */}
          {selectedType === 'transaction' && (
            <div className="form-section">
              <label className="form-label">
                <Filter size={16} />
                Filters (Optional)
              </label>
              <div className="filter-inputs">
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="">All Types</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expense Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    placeholder="e.g., Software, Travel"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={isGenerating || !startDate || !endDate}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
