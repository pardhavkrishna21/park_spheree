import React, { useState } from 'react';
import './index.css';

// Centered popup shown right after a slot is completed.
// The driver can rate and comment, or just press Submit with nothing filled in.
export default function FeedbackModal({ booking, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const shown = hover || rating;
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <div
      className="fm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <form className="fm-card" onSubmit={handleSubmit}>
        <div className="fm-icon">✅</div>

        <h2 id="feedback-title" className="fm-title">Slot completed</h2>
        <p className="fm-spot">{booking.spotName}</p>
        <p className="fm-slot">{booking.timeSlot}</p>

        <p className="fm-question">How was your parking experience?</p>

        <div className="fm-stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={`fm-star ${n <= shown ? 'filled' : ''}`}
              onClick={() => setRating(rating === n ? 0 : n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}
        </div>
        <div className="fm-rating-label">{labels[shown]}</div>

        <textarea
          className="fm-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more (optional)"
          rows={3}
          maxLength={300}
        />

        <button type="submit" className="btn-primary fm-submit">
          Submit
        </button>
        <p className="fm-note">
          Rating and comment are optional. You can submit without them.
        </p>
      </form>
    </div>
  );
}