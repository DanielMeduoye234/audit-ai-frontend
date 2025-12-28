import { useState, useMemo } from 'react';
import { Search, MoreHorizontal, Paperclip, Download, FileText, Filter } from 'lucide-react';
import { Card } from '../components/Card';
import { TransactionModal } from '../components/TransactionModal';
import { useTransactions, type Transaction } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import './Transactions.css';

export function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const handleSaveTransaction = async (transaction: any) => {
    try {
      if (transaction.id) {
        await updateTransaction(transaction);
      } else {
        await addTransaction(transaction);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && new Date(t.date) <= new Date(dateTo);
      }
      
      return matchesType && matchesCategory && matchesSearch && matchesDate;
    });
  }, [transactions, filterType, filterCategory, searchTerm, dateFrom, dateTo]);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.type === 'income' ? t.amount : -t.amount
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to PDF (simple HTML to print)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AUDIT AI - Transaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8fafc; font-weight: 600; }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .summary { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; margin: 10px 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>AUDIT AI - Transaction Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total Transactions: ${filteredTransactions.length}</p>
        
        <div class="summary">
          <div class="summary-row"><strong>Total Income:</strong> <span class="income">${currency.symbol}${totalIncome.toLocaleString()}</span></div>
          <div class="summary-row"><strong>Total Expenses:</strong> <span class="expense">${currency.symbol}${totalExpenses.toLocaleString()}</span></div>
          <div class="summary-row"><strong>Net:</strong> <span>${currency.symbol}${(totalIncome - totalExpenses).toLocaleString()}</span></div>
        </div>
        
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td>${t.type}</td>
                <td class="${t.type}">${t.type === 'income' ? '+' : '-'}${currency.symbol}${Math.abs(t.amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  return (
    <div className="transactions-page">
      <TransactionModal 
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      <header className="page-header">
        <div>
          <h2>Transactions</h2>
          <p className="text-secondary">View, categorize, and manage all your financial transactions.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={exportToCSV} title="Export to CSV">
            <Download size={18} />
            CSV
          </button>
          <button className="btn-secondary" onClick={exportToPDF} title="Export to PDF">
            <FileText size={18} />
            PDF
          </button>
          <button className="btn-primary" onClick={handleNewTransaction}>
            + New Transaction
          </button>
        </div>
      </header>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by description or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filterType === 'income' ? 'active' : ''}`}
            onClick={() => setFilterType('income')}
          >
            Income
          </button>
          <button 
            className={`filter-tab ${filterType === 'expense' ? 'active' : ''}`}
            onClick={() => setFilterType('expense')}
          >
            Expenses
          </button>
          <button 
            className={`filter-tab ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button className="btn-text" onClick={clearFilters}>Clear Filters</button>
        </div>
      )}

      <Card className="transactions-card">
        {filteredTransactions.length > 0 ? (
          <table className="transactions-table full-width">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Receipt</th>
                <th>Amount</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} onClick={() => handleRowClick(t)} className="clickable-row hover-lift">
                  <td>{t.date}</td>
                  <td>
                    <div className="fw-500">{t.description}</div>
                  </td>
                  <td>
                    <span className="badge badge-gray">
                      {t.category}
                    </span>
                  </td>
                  <td>
                    {t.receipt && (
                      <span className="text-primary" title="Receipt attached">
                        <Paperclip size={16} />
                      </span>
                    )}
                  </td>
                  <td className={`amount fw-600 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${t.type === 'income' ? 'success' : 'pending'}`}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(t.id); }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state-table">
            <p>No transactions found.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

