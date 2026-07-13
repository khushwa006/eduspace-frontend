import { useState } from 'react';
import './FeedbackForm.css';

const CATEGORIES = [
  { id: 'room_condition',      label: 'Room Condition',      icon: '🏛️', desc: 'Cleanliness, equipment, lighting' },
  { id: 'booking_process',     label: 'Booking Process',     icon: '📅', desc: 'How easy was it to book a room?' },
  { id: 'faculty_experience',  label: 'Faculty Experience',  icon: '👨‍🏫', desc: 'Teaching quality, interaction' },
  { id: 'technical_issue',     label: 'Technical Issue',     icon: '💻', desc: 'App bugs, errors, connectivity' },
  { id: 'general_suggestion',  label: 'General Suggestion',  icon: '💡', desc: 'Ideas to improve EduSpace' },
];

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export default function FeedbackForm({ onSubmit, onCancel, loading }) {
  const [category, setCategory]   = useState('');
  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [comment, setComment]     = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async () => {
    if (!category)        return setError('Please select a category.');
    if (!rating)          return setError('Please give a star rating.');
    if (!comment.trim())  return setError('Please write a comment.');
    setError('');
    await onSubmit({ feedback_type: category, rating, comment: comment.trim(), is_anonymous: anonymous });
  };

  const activeRating = hover || rating;

  return (
    <div className="ff-wrapper">
      <h2 className="ff-title">📝 Submit Feedback</h2>
      <p className="ff-subtitle">Help us improve EduSpace — your input matters!</p>

      {/* ── CATEGORY ─────────────────────────────────────────── */}
      <div className="ff-section">
        <label className="ff-label">Select Category *</label>
        <div className="ff-categories">
          {CATEGORIES.map(cat => (
            <button key={cat.id} type="button"
              className={`ff-cat-btn ${category === cat.id ? 'ff-cat-btn--active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="ff-cat-icon">{cat.icon}</span>
              <span className="ff-cat-label">{cat.label}</span>
              <span className="ff-cat-desc">{cat.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STAR RATING ──────────────────────────────────────── */}
      <div className="ff-section">
        <label className="ff-label">Your Rating *</label>
        <div className="ff-stars-row">
          <div className="ff-stars">
            {[1,2,3,4,5].map(star => (
              <button key={star} type="button"
                className={`ff-star ${star <= activeRating ? 'ff-star--filled' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >★</button>
            ))}
          </div>
          {activeRating > 0 && (
            <span className="ff-rating-label">{RATING_LABELS[activeRating]}</span>
          )}
        </div>
      </div>

      {/* ── COMMENT ──────────────────────────────────────────── */}
      <div className="ff-section">
        <label className="ff-label">Your Comment *</label>
        <textarea
          className="ff-textarea"
          rows={4}
          placeholder="Share your experience in detail..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
        />
        <span className="ff-char-count">{comment.length}/500</span>
      </div>

      {/* ── ANONYMOUS TOGGLE ─────────────────────────────────── */}
      <div className="ff-section ff-anon-row">
        <label className="ff-anon-label">
          <div className={`ff-toggle ${anonymous ? 'ff-toggle--on' : ''}`}
            onClick={() => setAnonymous(a => !a)}>
            <div className="ff-toggle-knob" />
          </div>
          <span>Submit anonymously</span>
          <span className="ff-anon-note">Your name won't be shown to faculty or admin</span>
        </label>
      </div>

      {error && <p className="ff-error">⚠️ {error}</p>}

      {/* ── ACTIONS ──────────────────────────────────────────── */}
      <div className="ff-actions">
        <button className="ff-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="ff-btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting…' : '🚀 Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
