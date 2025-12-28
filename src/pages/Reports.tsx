import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { FileText, Download, Filter, FileCheck, FileBarChart, Trash2, RefreshCw } from 'lucide-react';
import { ReportGenerationModal, type ReportData } from '../components/ReportGenerationModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Reports.css';

interface Report {
  id: string;
  userId: string;
  type: 'financial' | 'transaction' | 'analytics' | 'compliance';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export const availableReports = [
  { name: 'Financial Summary', description: 'Comprehensive monthly financial overview including revenue, expenses, and profit margins.', icon: FileText },
  { name: 'Audit & Compliance', description: 'Detailed quarterly audit logs and compliance status checks for regulatory requirements.', icon: FileCheck },
  { name: 'Tax Documentation', description: 'Year-end tax summary, deductible expenses, and necessary documentation.', icon: FileBarChart },
  { name: 'Custom Analysis', description: 'Create a custom report with specific parameters, date ranges, and data points.', icon: Filter },
];

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  // Poll for status updates on processing reports
  useEffect(() => {
    const processingReports = reports.filter(r => r.status === 'processing' || r.status === 'pending');
    
    if (processingReports.length > 0) {
      const interval = setInterval(() => {
        processingReports.forEach(report => {
          checkReportStatus(report.id);
        });
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [reports]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) return;

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkReportStatus = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status, progress, error')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: data.status, progress: data.progress, error: data.error }
          : r
      ));

      if (data.status === 'completed' || data.status === 'failed') {
        loadReports();
      }
    } catch (error) {
      console.error('Failed to check report status:', error);
    }
  };

  const handleGenerateReport = async (reportData: ReportData) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: reportData
      });

      if (error) throw error;
      if (data.success) {
        setReports(prev => [data.report, ...prev]);
      } else {
        alert(`Failed to generate report: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleDownload = async (report: Report) => {
    if (report.status !== 'completed' || !report.fileName) {
      alert('Report is not ready for download');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.fileName, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const getFilteredReports = () => {
    let filtered = [...reports];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterPeriod) {
        case '30':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '180':
          cutoffDate.setDate(now.getDate() - 180);
          break;
        case '365':
          cutoffDate.setDate(now.getDate() - 365);
          break;
      }

      filtered = filtered.filter(r => new Date(r.createdAt) >= cutoffDate);
    }

    return filtered;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-badge ready';
      case 'processing':
        return 'status-badge processing';
      case 'pending':
        return 'status-badge pending';
      case 'failed':
        return 'status-badge failed';
      default:
        return 'status-badge';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    return `badge badge-${type}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="reports">
      <header className="reports-header">
        <div>
          <h2>Reports Center</h2>
          <p className="text-secondary">Generate, manage, and download your financial insights.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FileText size={18} />
          Generate New Report
        </button>
      </header>

      <section className="report-types-section">
        <h3>Available Report Types</h3>
        <div className="report-types-grid">
          {availableReports.map((report, index) => (
            <div key={index} className="report-type-card">
              <div className="report-type-icon">
                <report.icon size={24} />
              </div>
              <div>
                <h4>{report.name}</h4>
                <p>{report.description}</p>
              </div>
              <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
                Create Report
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="recent-reports-section">
        <div className="section-header">
          <h3>Recent Reports</h3>
          <div className="filter-controls">
            <select 
              className="filter-select" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="financial">Financial</option>
              <option value="transaction">Transaction</option>
              <option value="analytics">Analytics</option>
              <option value="compliance">Compliance</option>
            </select>
            <select 
              className="filter-select"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>
            <button className="icon-btn" onClick={loadReports} title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <Card className="table-card">
          {loading ? (
            <div className="loading-state">Loading reports...</div>
          ) : error ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>Error Loading Reports</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={loadReports}>
                Try Again
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No reports yet</h3>
              <p>Generate your first report to get started</p>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                Generate Report
              </button>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="report-name">
                        <FileText size={18} />
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                      </div>
                    </td>
                    <td>
                      <span className={getTypeBadgeClass(report.type)}>
                        {report.type}
                      </span>
                    </td>
                    <td className="date-range">
                      {formatDate(report.dateRange.startDate)} - {formatDate(report.dateRange.endDate)}
                    </td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <div className="status-container">
                        <span className={getStatusBadgeClass(report.status)}>
                          {report.status}
                        </span>
                        {(report.status === 'processing' || report.status === 'pending') && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${report.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="icon-btn" 
                          title="Download"
                          onClick={() => handleDownload(report)}
                          disabled={report.status !== 'completed'}
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="icon-btn" 
                          title="Delete"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <ReportGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerateReport}
      />
    </div>
  );
}
