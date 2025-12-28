import { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type Transaction } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import './TransactionModal.css';

interface TransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction | Omit<Transaction, 'id'>) => void;
  onDelete: (id: number) => void;
}

export function TransactionModal({ transaction, isOpen, onClose, onSave, onDelete }: TransactionModalProps) {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<Transaction, 'id'> & { id?: number }>(transaction || {
    user_id: user?.id || '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'Other',
    type: 'expense',
    receipt: ''
  });
  const [isEditing, setIsEditing] = useState(!transaction);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Reset form when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      setFormData(transaction || {
        user_id: user?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'Other',
        type: 'expense',
        receipt: ''
      });
      setIsEditing(!transaction);
      setReceiptPreview(transaction?.receipt || null);
    }
  }, [isOpen, transaction, user?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, receipt: receiptPreview || formData.receipt || '' });
    onClose();
  };

  const handleDelete = () => {
    if (transaction?.id && confirm('Are you sure you want to delete this transaction?')) {
      onDelete(transaction.id);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setReceiptPreview(base64);
        setFormData({ ...formData, receipt: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptPreview(null);
    setFormData({ ...formData, receipt: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderReceipt = () => (
    <div className="receipt-container">
      <div className="receipt-header">
        <h3>AUDIT AI</h3>
        <p>Transaction Receipt</p>
        <p className="receipt-date">{new Date(formData.date).toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>
      
      <div className="receipt-divider">--------------------------------</div>
      
      <div className="receipt-body">
        <div className="receipt-row">
          <span>Description</span>
          <span>{formData.description}</span>
        </div>
        <div className="receipt-row">
          <span>Category</span>
          <span>{formData.category}</span>
        </div>
        <div className="receipt-row">
          <span>Type</span>
          <span>{formData.type.toUpperCase()}</span>
        </div>
        {transaction?.id && (
          <div className="receipt-row">
            <span>Trans. ID</span>
            <span>#{transaction.id.toString().padStart(6, '0')}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-total">
        <span>TOTAL</span>
        <span>{formatAmount(formData.amount)}</span>
      </div>

      <div className="receipt-divider">================================</div>

      {transaction?.receipt && (
        <div className="receipt-image-container">
          <p>Attached Image:</p>
          <img src={transaction.receipt} alt="Receipt Attachment" />
        </div>
      )}

      <div className="receipt-footer">
        <p>Thank you for your business!</p>
        <div className="receipt-actions">
          <button className="btn-text" onClick={() => setIsEditing(true)}>Edit</button>
          <button className="btn-text text-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${!isEditing ? 'receipt-mode' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={!isEditing && transaction ? { backgroundColor: '#ffffff', color: '#000000' } : undefined}
      >
        {!isEditing && transaction ? (
          <>
            <button className="close-btn-absolute" onClick={onClose}>
              <X size={24} />
            </button>
            {renderReceipt()}
          </>
        ) : (
          <>
            <div className="modal-header">
              <h2>{transaction ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Type</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="Office">Office</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Sales">Sales</option>
                  <option value="Software">Software</option>
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              {/* Receipt Upload */}
              <div className="form-group">
                <label>Receipt Image (Optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-input"
                  id="receipt-upload"
                />
                {receiptPreview ? (
                  <div className="receipt-upload-preview">
                    <img src={receiptPreview} alt="Receipt preview" />
                    <button type="button" className="remove-receipt-btn" onClick={removeReceipt}>
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="receipt-upload" className="upload-btn">
                    <Upload size={20} />
                    <span>Click to upload receipt image</span>
                  </label>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={transaction ? () => setIsEditing(false) : onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  Save
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

