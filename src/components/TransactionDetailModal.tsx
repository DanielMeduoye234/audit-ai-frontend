import { X, Calendar, Tag, DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import './TransactionDetailModal.css';

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  notes?: string;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, isOpen, onClose }: TransactionDetailModalProps) {
  const { formatAmount } = useCurrency();
  
  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Transaction Details</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="transaction-summary">
            <div className={`amount-display ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
              {transaction.amount > 0 ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
            </div>
            <div className="transaction-status">
              {transaction.status === 'Completed' ? (
                <span className="status-badge completed">
                  <CheckCircle size={14} />
                  Completed
                </span>
              ) : (
                <span className="status-badge pending">
                  <Clock size={14} />
                  Pending
                </span>
              )}
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">
                <Calendar size={16} />
                Date
              </span>
              <span className="detail-value">{new Date(transaction.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <FileText size={16} />
                Description
              </span>
              <span className="detail-value">{transaction.description}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Tag size={16} />
                Category
              </span>
              <span className="detail-value category-badge">{transaction.category}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <DollarSign size={16} />
                Transaction ID
              </span>
              <span className="detail-value mono">#{transaction.id.toString().padStart(8, '0')}</span>
            </div>
          </div>

          <div className="notes-section">
            <h4>Notes</h4>
            <div className="notes-box">
              {transaction.notes || "No notes added for this transaction."}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary">Download Receipt</button>
        </div>
      </div>
    </div>
  );
}
