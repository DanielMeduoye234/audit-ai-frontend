import { useState } from 'react';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './Feedback.css';

export default function Feedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!content.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      await api.post('/feedback', {
        user_id: user?.id,
        content,
        rating
      });
      setStatus('success');
      setContent('');
      setRating(0);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>We Value Your Feedback</h1>
        <p>Help us improve your AI Accountant experience</p>
      </div>

      <div className="feedback-form-card">
        {status === 'success' && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>Thank you! Your feedback has been submitted successfully.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>Something went wrong. Please try again later.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rate your experience</label>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={`star-rating ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Your thoughts</label>
            <textarea
              id="feedback"
              className="feedback-input"
              placeholder="Tell us what you like or how we can improve..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : (
              <>
                <Send size={20} />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
