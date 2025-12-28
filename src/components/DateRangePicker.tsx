import { useState } from 'react';
import { Calendar } from 'lucide-react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  onRangeChange: (start: string, end: string) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Year', days: 365 }
  ];

  const handlePreset = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    onRangeChange(start, end);
  };

  const handleCustomRange = () => {
    if (startDate && endDate) {
      onRangeChange(startDate, endDate);
    }
  };

  return (
    <div className="date-range-picker">
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className="preset-btn"
            onClick={() => handlePreset(preset.days)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      <div className="custom-range">
        <div className="date-input-group">
          <Calendar size={18} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start date"
          />
        </div>
        <span>to</span>
        <div className="date-input-group">
          <Calendar size={18} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End date"
          />
        </div>
        <button className="apply-btn" onClick={handleCustomRange}>
          Apply
        </button>
      </div>
    </div>
  );
}
