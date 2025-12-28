import { useState } from 'react';
import { Send, AlertTriangle, Paperclip, CheckCircle2, HelpCircle, MessageSquareWarning } from 'lucide-react';
import './Complaint.css';

export function Complaint() {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ subject: '', category: 'technical', priority: 'medium', description: '' });
    
    // Reset success message after 3 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="complaint-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Submit a Complaint</h1>
          <p className="page-subtitle">We value your feedback. Let us know how we can improve.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <HelpCircle size={18} />
            <span>Help Center</span>
          </button>
        </div>
      </header>

      <div className="complaint-content">
        <div className="complaint-form-container glass-strong">
          <div className="form-header">
            <div className="icon-wrapper">
              <MessageSquareWarning size={24} />
            </div>
            <div>
              <h2>Complaint Details</h2>
              <p>Please provide as much detail as possible so we can assist you better.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                placeholder="Brief summary of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="glass-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <div className="select-wrapper">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="glass-input"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="service">Customer Service</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <div className="priority-options">
                  {['low', 'medium', 'high'].map((p) => (
                    <label key={p} className={`priority-radio ${formData.priority === p ? 'active' : ''} ${p}`}>
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={formData.priority === p}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      />
                      <span className="radio-label">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="glass-input"
              />
            </div>

            <div className="form-group">
              <label>Attachments (Optional)</label>
              <div className="file-upload-area glass-input">
                <Paperclip size={20} />
                <span>Click to upload or drag and drop files here</span>
                <input type="file" multiple className="file-input-hidden" />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className={`btn-submit ${isSubmitting ? 'loading' : ''} ${submitted ? 'success' : ''}`} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="loader"></span>
                ) : submitted ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Submitted Successfully</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Submit Complaint</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="complaint-sidebar">
          <div className="info-card glass">
            <div className="card-icon warning">
              <AlertTriangle size={24} />
            </div>
            <h3>Before you submit</h3>
            <p>Please check our Help Center for immediate answers to common questions.</p>
            <ul className="info-list">
              <li>Check system status</li>
              <li>Review billing FAQ</li>
              <li>Read troubleshooting guide</li>
            </ul>
          </div>

          <div className="info-card glass">
            <div className="card-icon info">
              <HelpCircle size={24} />
            </div>
            <h3>Need urgent help?</h3>
            <p>For critical issues affecting your business operations, please contact our priority support line.</p>
            <div className="contact-info">
              <span>+1 (888) 123-4567</span>
              <span className="availability">Available 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
