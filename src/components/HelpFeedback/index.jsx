import React, { useState } from 'react';
import './index.css';

const FAQS = [
  { q: 'How is parking priced?', a: 'Parking is a fixed ₹50 per hour for cars and ₹30 per hour for bikes. A platform fee of ₹20 (car) or ₹10 (bike) per hour is added at checkout. Pro members get ₹10 off the fee and Ultimate members pay no platform fee.' },
  { q: 'What do Available, Fast Filling, Almost Filled and Filled mean?', a: 'They show how many spots are free for your chosen date and time: 6 or more is Available, 3 to 5 is Fast Filling, 1 to 2 is Almost Filled and 0 is Filled. Afternoons, evenings and weekends in the next few days fill up first.' },
  { q: 'How do I check in when I arrive?', a: 'Open My Bookings and tap "I\'ve parked (check in)". Check-in opens 15 minutes before your slot starts and closes when it ends. Checking in is what tells us you parked.' },
  { q: 'What happens if I book a slot and do not park?', a: 'The booking is cancelled automatically and counts as a violation. After 3 violations your account is put on hold for 3 months, so please cancel any slot you no longer need.' },
  { q: 'How do I cancel or change a booking?', a: 'Go to My Bookings. Tap Cancel Booking to cancel (this is not a violation), or Modify Booking to change the duration, EV charging, wash or Captain Valet. The total updates as you change things.' },
  { q: 'How does Captain Valet work and what does it cost?', a: 'A verified Captain picks up your vehicle from the pickup point you enter and parks it at your bay. The fare is ₹30 plus ₹15 per km of driving distance. The Captain is assigned 30 minutes before your slot, and photos are taken before and after parking.' },
  { q: 'What do EV charging and car wash cost?', a: 'EV charging is ₹50 per session, a car wash is ₹120 and a bike wash is ₹60. Pro includes 1 free wash and 3 EV sessions a month. Ultimate includes 5 washes and unlimited EV charging.' },
  { q: 'Can I book two slots at the same time?', a: 'No. You cannot book overlapping times. Times that clash with your own bookings are shown in red as "You booked", and you can pick any other available time or date.' },
  { q: 'Who can leave feedback?', a: 'Only drivers who have successfully parked and completed a booked slot can leave feedback, so every review comes from a real, completed parking.' }
];

const HOST_FAQS = [
  { q: 'Can I rent my spot for just 1 hour?', a: 'Yes. Drivers book bays by the hour, so a booking can be as short as 1 hour. Each booking can run up to 12 hours, and you earn for every hour a driver books.' },
  { q: 'I only have space for one car. Can I still list it?', a: 'Yes. When you list your space, set the car capacity to 1 (and bikes to 0 if you have no room for them). A single-bay listing works exactly like a bigger one and shows as Filled while that car is booked.' },
  { q: 'Can I list a bay for bikes only?', a: 'Yes. Set the car capacity to 0 and enter how many bikes fit. Bike bookings earn ₹30 per hour.' },
  { q: 'How much will I earn?', a: 'Rates are fixed by ParkSphere: ₹50 per hour for a car and ₹30 per hour for a bike. For example, a 4-hour car booking earns ₹200 and a 4-hour bike booking earns ₹120. You cannot set your own price.' },
  { q: 'What do I need to list my space?', a: 'A title, the address or landmark, your capacity, and a legal ownership proof such as an electricity bill or a registered sale deed. These are mandatory so drivers can trust the listing.' },
  { q: 'Can I earn from EV charging and washes?', a: 'Yes. If your space offers EV charging or car and bike washes, drivers can add them to a booking and the add-on amount is included in your earnings for that booking.' },
  { q: 'How do I get paid?', a: 'Open Revenue Generated to follow your bookings and earnings, then request a payout to your UPI account.' },
  { q: 'What if a driver books but does not turn up?', a: 'If the driver does not park during the booked slot, the booking is cancelled automatically, your bay becomes free again, and the driver gets a violation. A cancelled no-show booking does not add to your earnings.' },
  { q: 'What is Captain Valet and does it affect me?', a: 'Captain Valet is a service where a verified Captain parks a driver\'s vehicle at your bay. The Captain takes photos before and after parking, so you have a record that the vehicle arrived safely.' },
  { q: 'Do drivers and hosts share one account?', a: 'No. Drivers and hosts have separate accounts and profiles. Your host account only shows your listings, bookings and earnings.' }
];

const timeAgo = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function HelpFeedback({ feedbacks, eligibleBookings, onSubmit, user, isHost = false }) {
  const [open, setOpen] = useState(0);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [bookingId, setBookingId] = useState('');

  const faqSource = isHost ? HOST_FAQS : FAQS;
  const faqs = faqSource.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(query.toLowerCase()));
  const average = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
  const selected = bookingId || eligibleBookings[0]?.id || '';

  const submit = (e) => {
    e.preventDefault();
    if (!selected || comment.trim().length < 5) return;
    onSubmit({ bookingId: selected, rating, comment: comment.trim() });
    setComment('');
    setRating(5);
    setBookingId('');
  };

  return (
    <div className="hf-root">
      <section className="hf-hero">
        <span className="hf-pill">HELP &amp; FEEDBACK</span>
        <h2>How can we help, {user.name.split(' ')[0]}?</h2>
        <p>{isHost ? 'Find answers about listing your space, earnings and payouts, or read what drivers say after parking.' : 'Find quick answers about bookings, services and the rules, or read what drivers say after parking with us.'}</p>
        <input
          className="hf-search"
          type="search"
          placeholder={isHost ? 'Search questions, e.g. 1 hour, payout, one car' : 'Search questions, e.g. valet, cancel, violation'}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(0); }}
        />
      </section>

      <div className="hf-grid">
        <section className="hf-card">
          <h3>{isHost ? 'Hosting questions' : 'Frequently asked questions'}</h3>
          {faqs.length === 0 && <p className="hf-muted">No questions match your search.</p>}
          {faqs.map((f, i) => (
            <div key={f.q} className={`hf-faq ${open === i ? 'open' : ''}`}>
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <i>{open === i ? '−' : '+'}</i>
              </button>
              {open === i && <p>{f.a}</p>}
            </div>
          ))}
          <div className="hf-contact">
            <strong>Still need help?</strong>
            <span>Email <a href="mailto:support@parksphere.io">support@parksphere.io</a></span>
          </div>
        </section>

        <section className="hf-card">
          <div className="hf-fb-head">
            <h3>Driver feedback</h3>
            <div className="hf-avg"><strong>★ {average}</strong><span>{feedbacks.length} reviews</span></div>
          </div>
          <p className="hf-muted">Reviews are shown only from drivers who successfully completed their booked slot.</p>

          {eligibleBookings.length > 0 ? (
            <form className="hf-form" onSubmit={submit}>
              <strong>Share your experience</strong>
              <select value={selected} onChange={(e) => setBookingId(e.target.value)}>
                {eligibleBookings.map((b) => <option key={b.id} value={b.id}>{b.spotName} · {b.timeSlot}</option>)}
              </select>
              <div className="hf-stars" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} star`}>★</button>
                ))}
              </div>
              <textarea rows={3} placeholder="How was your parking?" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="hf-submit" type="submit" disabled={comment.trim().length < 5}>Submit feedback</button>
            </form>
          ) : (
            <div className="hf-locked">
              {isHost ? 'Reviews are written by drivers after they complete a booked slot at your bay.' : '🔒 Feedback unlocks after you successfully park and complete a booked slot.'}
            </div>
          )}

          <div className="hf-reviews">
            {feedbacks.map((f) => (
              <article key={f.id} className="hf-review">
                <div className="hf-review-top">
                  <span className="hf-initial">{f.name.charAt(0)}</span>
                  <div>
                    <strong>{f.name}</strong>
                    <small>{f.spotName} · {timeAgo(f.date)}</small>
                  </div>
                  <span className="hf-rate">{'★'.repeat(f.rating)}<em>{'★'.repeat(5 - f.rating)}</em></span>
                </div>
                <p>{f.comment}</p>
                <span className="hf-verified">✓ Completed slot</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
