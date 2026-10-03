import React, { useEffect, useRef, useState } from 'react';
import { IconClock } from '../Icons';
import { todayStr, toRange, fmtTime, TIME_OPTIONS } from '../../utils/bookingTime';
import './index.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function DateTimePicker({ date, time, duration = 1, onDateChange, onTimeChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(`${date}T00:00`));
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const today = todayStr();
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const canGoPrev = year > Number(today.slice(0, 4)) || month > Number(today.slice(5, 7)) - 1;

  const dayDiff = (str) => Math.round((new Date(`${str}T00:00`) - new Date(`${today}T00:00`)) / 86400000);
  const label = new Date(`${date}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dtp-row">
      <div className="dtp-field" ref={ref}>
        <label>📅 Date</label>
        <button type="button" className="dtp-trigger" onClick={() => setOpen(!open)}>
          <span>{label}</span>
          <span className="dtp-caret">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="dtp-pop">
            <div className="dtp-head">
              <button type="button" disabled={!canGoPrev} onClick={() => setView(new Date(year, month - 1, 1))}>‹</button>
              <strong>{view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
              <button type="button" onClick={() => setView(new Date(year, month + 1, 1))}>›</button>
            </div>
            <div className="dtp-grid">
              {WEEKDAYS.map((w) => <span key={w} className="dtp-wd">{w}</span>)}
              {cells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const str = toStr(new Date(year, month, day));
                const diff = dayDiff(str);
                return (
                  <button
                    key={str}
                    type="button"
                    disabled={diff < 0}
                    className={`dtp-day ${str === date ? 'selected' : ''} ${str === today ? 'today' : ''}`}
                    onClick={() => { onDateChange(str); setOpen(false); }}
                  >
                    {day}
                    {diff >= 0 && <i className={diff < 4 ? 'busy' : 'calm'} />}
                  </button>
                );
              })}
            </div>
            <div className="dtp-legend">
              <span><i className="busy" /> Fills fast</span>
              <span><i className="calm" /> Plenty of space</span>
              <button type="button" onClick={() => { onDateChange(today); setView(new Date(`${today}T00:00`)); setOpen(false); }}>Today</button>
            </div>
          </div>
        )}
      </div>

      <div className="dtp-field">
        <label><IconClock size={14} color="#059669" /> Start time</label>
        <div className="dtp-select-wrap">
          <select value={time} onChange={(e) => onTimeChange(e.target.value)}>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t} disabled={toRange(date, t, duration)[1] <= Date.now()}>
                {fmtTime(toRange(date, t, 0)[0])}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
