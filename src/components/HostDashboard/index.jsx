import React, { useEffect, useState } from 'react';
import './index.css';

const getBookingDate = (booking) => {
  const date = new Date(booking.startAt || booking.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSettled = (booking) => booking.status === 'Completed';

const getBookingIncome = (booking) => {
  // A quote is not earnings until the parking stay is completed.
  if (!isSettled(booking)) return { car: 0, bike: 0, ev: 0, wash: 0, total: 0 };
  const parking = Number(booking.parkingEarning ?? booking.rateApplied * booking.hoursBooked);
  const ev = Number(booking.evChargingEarning || 0);
  const wash = Number(booking.washEarning || 0);

  return {
    car: booking.vehicleType === 'Bike' ? 0 : parking,
    bike: booking.vehicleType === 'Bike' ? parking : 0,
    ev,
    wash,
    total: parking + ev + wash
  };
};

function CountUp({ value, prefix = '' }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{shown.toLocaleString('en-IN')}</>;
}

export default function HostDashboard({ user, hostBookings, hostSpots, setHostSpots, withdrawals = [], onWithdraw, showToast, setCurrentTab }) {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reportRange, setReportRange] = useState(3);
  const reportIsLastMonth = reportRange === 'last-month';
  const [transactionPage, setTransactionPage] = useState(0);
  const [upi, setUpi] = useState('vikram@okaxis');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [dayHover, setDayHover] = useState(null);
  const [hoverSource, setHoverSource] = useState(null);

  if (user.role !== 'host') {
    return (
      <div className="restricted-box">
        <h2>🔒 Host Telemetry Restricted</h2>
        <p>Earnings data is strictly visible only to registered Space Hosts. Drivers cannot access this section.</p>
        <button className="btn-primary" onClick={() => setCurrentTab('auth')}>Register as Space Host</button>
      </div>
    );
  }

  const now = new Date();
  // The table is a view of the same dated ledger used by every summary above.
  // Never rely on insertion order: newest parking slot always comes first.
  const ledgerBookings = [...hostBookings].sort((a, b) => {
    const aTime = getBookingDate(a)?.getTime() || 0;
    const bTime = getBookingDate(b)?.getTime() || 0;
    return bTime - aTime;
  });
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthBookings = hostBookings.filter((booking) => {
    const date = getBookingDate(booking);
    return !date || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === currentMonthKey;
  });
  const revenueTotals = currentMonthBookings.reduce((totals, booking) => {
    const income = getBookingIncome(booking);
    totals.car += income.car;
    totals.carCount += income.car > 0 ? 1 : 0;
    totals.bike += income.bike;
    totals.bikeCount += income.bike > 0 ? 1 : 0;
    totals.ev += income.ev;
    totals.evCount += income.ev > 0 ? 1 : 0;
    totals.wash += income.wash;
    totals.washCount += income.wash > 0 ? 1 : 0;
    return totals;
  }, { car: 0, carCount: 0, bike: 0, bikeCount: 0, ev: 0, evCount: 0, wash: 0, washCount: 0 });
  const thisMonthEarned = revenueTotals.car + revenueTotals.bike + revenueTotals.ev + revenueTotals.wash;
  const totalEarned = hostBookings.reduce((sum, booking) => sum + getBookingIncome(booking).total, 0);
  const totalWithdrawn = withdrawals.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const pendingBalance = Math.max(0, totalEarned - totalWithdrawn);
  const closeWithdraw = () => {
    setWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawError('');
    setWithdrawDone(false);
  };
  const confirmWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Enter an amount greater than ₹0.');
      return;
    }
    if (amount > pendingBalance) {
      setWithdrawError(`You can withdraw up to ₹${pendingBalance.toLocaleString('en-IN')}.`);
      return;
    }
    if (!upi.trim()) {
      setWithdrawError('Enter your UPI ID.');
      return;
    }
    onWithdraw?.({ amount, upi: upi.trim(), timestamp: new Date().toISOString() });
    setWithdrawnAmount(amount);
    setWithdrawDone(true);
    setTimeout(closeWithdraw, 1000);
  };
  const activeNow = hostBookings.filter((booking) => booking.status?.toLowerCase().includes('active')).length;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    return { key: d.toDateString(), label: d.toLocaleDateString('en-IN', { weekday: 'short' }), full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), total: 0 };
  });
  hostBookings.forEach((booking) => {
    const d = getBookingDate(booking);
    const slot = d && last7.find((s) => s.key === d.toDateString());
    if (slot) slot.total += getBookingIncome(booking).total;
  });
  const maxDay = Math.max(1, ...last7.map((s) => s.total));
  const last7Label = `${last7[0].full} – ${last7[last7.length - 1].full}`;
  const sources = [
    { key: 'car', label: 'Car / EV parking', value: revenueTotals.car, color: '#059669' },
    { key: 'bike', label: 'Bike parking', value: revenueTotals.bike, color: '#0ea5e9' },
    { key: 'ev', label: 'EV charging', value: revenueTotals.ev, color: '#f59e0b' },
    { key: 'wash', label: 'Wash add-ons', value: revenueTotals.wash, color: '#8b5cf6' }
  ];
  const sourceTotal = sources.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const donutBackground = sourceTotal === 0
    ? '#e2e8f0'
    : `conic-gradient(${sources.map((s) => { const start = (acc / sourceTotal) * 360; acc += s.value; return `${s.color} ${start}deg ${(acc / sourceTotal) * 360}deg`; }).join(', ')})`;  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatTimestamp = (booking) => {
    const date = getBookingDate(booking);
    return date
      ? date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : booking.timestamp || 'Time unavailable';
  };
  const formatSlotEnd = (booking) => {
    const start = getBookingDate(booking);
    const end = booking.endAt ? new Date(booking.endAt) : new Date(start?.getTime() + Number(booking.hoursBooked || 0) * 3600000);
    return Number.isNaN(end.getTime()) ? 'Time unavailable' : end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const reportIsRollingMonth = reportRange === 'last-1-month';
  const reportStart = reportIsLastMonth
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : reportIsRollingMonth
      ? new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      : new Date(now.getFullYear(), now.getMonth() - reportRange + 1, 1);
  const reportEnd = reportIsLastMonth
    ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    : now;
  const monthlyGroups = new Map();
  hostBookings.forEach((booking) => {
    const date = getBookingDate(booking);
    if (!isSettled(booking) || !date || date < reportStart || date > reportEnd) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dateKey = `${monthKey}-${String(date.getDate()).padStart(2, '0')}`;
    if (!monthlyGroups.has(monthKey)) {
      monthlyGroups.set(monthKey, {
        key: monthKey,
        label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        totals: { car: 0, bike: 0, ev: 0, wash: 0, total: 0 },
        days: new Map()
      });
    }

    const month = monthlyGroups.get(monthKey);
    if (!month.days.has(dateKey)) {
      month.days.set(dateKey, {
        key: dateKey,
        label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        totals: { car: 0, bike: 0, ev: 0, wash: 0, total: 0 }
      });
    }

    const income = getBookingIncome(booking);
    [month.totals, month.days.get(dateKey).totals].forEach((totals) => {
      totals.car += income.car;
      totals.bike += income.bike;
      totals.ev += income.ev;
      totals.wash += income.wash;
      totals.total += income.total;
    });
  });

  const monthlyReports = [...monthlyGroups.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((month) => ({
      ...month,
      days: [...month.days.values()].sort((a, b) => b.key.localeCompare(a.key))
    }));
  const reportTotals = monthlyReports.reduce((totals, month) => {
    totals.car += month.totals.car;
    totals.bike += month.totals.bike;
    totals.ev += month.totals.ev;
    totals.wash += month.totals.wash;
    totals.total += month.totals.total;
    return totals;
  }, { car: 0, bike: 0, ev: 0, wash: 0, total: 0 });

  const selectedParkingEarning = selectedTransaction
    ? Number(selectedTransaction.parkingEarning ?? selectedTransaction.rateApplied * selectedTransaction.hoursBooked)
    : 0;
  const selectedEvEarning = Number(selectedTransaction?.evChargingEarning || 0);
  const selectedWashEarning = Number(selectedTransaction?.washEarning || 0);
  const transactionsPerPage = 5;
  const transactionPageCount = Math.ceil(ledgerBookings.length / transactionsPerPage);
  const currentTransactionPage = Math.min(transactionPage, Math.max(0, transactionPageCount - 1));
  const pageTransactions = ledgerBookings.slice(
    currentTransactionPage * transactionsPerPage,
    (currentTransactionPage + 1) * transactionsPerPage
  );
  const firstVisibleTransaction = ledgerBookings.length === 0 ? 0 : currentTransactionPage * transactionsPerPage + 1;
  const lastVisibleTransaction = Math.min((currentTransactionPage + 1) * transactionsPerPage, ledgerBookings.length);

  return (
    <div>
      <section className="hd-hero">
        <span className="hd-orb o1" /><span className="hd-orb o2" />
        <div className="hd-hero-text">
          <span className="hd-live"><i /> LIVE · SPACE HOST REVENUE CONSOLE</span>
          <h2>Revenue Generated</h2>
          <p>Welcome back, {user.name.split(' ')[0]}. Real-time booking income, occupied bays and instant settlements.</p>
          <div className="hd-hero-actions">
            <button className="hd-withdraw" onClick={() => setWithdrawModal(true)}>
              💸 Withdraw <CountUp value={pendingBalance} prefix="₹" />
            </button>
            <button className="hd-ghost" onClick={() => setCurrentTab('host-listings')}>+ Add another spot</button>
          </div>
        </div>
        <div className="hd-hero-total">
          <span>This month</span>
          <strong><CountUp value={thisMonthEarned} prefix="₹" /></strong>
          <small>↑ 14% vs last month</small>
        </div>
      </section>

      <div className="hd-kpis">
        <div className="hd-kpi green"><span>Realized revenue</span><strong><CountUp value={thisMonthEarned} prefix="₹" /></strong><small>This month · completed stays only</small></div>
        <div className="hd-kpi blue"><span>Available to withdraw</span><strong><CountUp value={pendingBalance} prefix="₹" /></strong><small>Earned ₹{totalEarned.toLocaleString('en-IN')} − withdrawn ₹{totalWithdrawn.toLocaleString('en-IN')}</small></div>
        <div className="hd-kpi amber"><span>Bays occupied now</span><strong><CountUp value={activeNow} /></strong><small>Earning hourly right now</small></div>
        <div className="hd-kpi violet"><span>Bays listed</span><strong><CountUp value={hostSpots.length} /></strong><small>Visible to drivers</small></div>
      </div>

      <section className="payout-ledger" aria-labelledby="payout-ledger-title">
        <div>
          <span className="payout-kicker">ACCOUNT RECONCILIATION</span>
          <h3 id="payout-ledger-title">Payout history</h3>
          <p>Lifetime earned {formatCurrency(totalEarned)} · withdrawn {formatCurrency(totalWithdrawn)} · available {formatCurrency(pendingBalance)}</p>
        </div>
        <div className="payout-list">
          {withdrawals.length === 0 ? <span className="payout-empty">No withdrawals recorded.</span> : withdrawals.map((payout) => (
            <div className="payout-row" key={payout.id}>
              <div><strong>{formatCurrency(payout.amount)}</strong><span>to {payout.upi}</span></div>
              <div><span>{formatTimestamp({ timestamp: payout.timestamp })}</span><small>{payout.id}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="hd-insights">
        <div className="hd-card">
          <div className="hd-card-head">
            <h3>Last 7 days</h3>
            <span>{dayHover ? `${dayHover.full}: ${formatCurrency(dayHover.total)}` : `Total ${formatCurrency(last7.reduce((s, d) => s + d.total, 0))}`}</span>
          </div>
          <p className="hd-period">{last7Label} · completed stays only</p>
          <div className="hd-bars">
            {last7.map((d) => (
              <button
                type="button"
                key={d.key}
                className={`hd-bar-col ${dayHover?.key === d.key ? 'on' : ''}`}
                onMouseEnter={() => setDayHover(d)}
                onMouseLeave={() => setDayHover(null)}
                onFocus={() => setDayHover(d)}
                onBlur={() => setDayHover(null)}
              >
                <em>{d.total > 0 ? formatCurrency(d.total) : ''}</em>
                <div className="hd-bar" style={{ height: `${Math.max(6, (d.total / maxDay) * 120)}px` }} />
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hd-card">
          <div className="hd-card-head"><h3>Where the money comes from</h3><span>This month</span></div>
          <div className="hd-donut-wrap">
            <div className="hd-donut" style={{ background: donutBackground }}>
              <div className="hd-donut-hole">
                <strong>{hoverSource ? formatCurrency(hoverSource.value) : formatCurrency(thisMonthEarned)}</strong>
                <span>{hoverSource ? `${hoverSource.label} · ${sourceTotal ? Math.round((hoverSource.value / sourceTotal) * 100) : 0}%` : 'All sources'}</span>
              </div>
            </div>
            <ul className="hd-legend">
              {sources.map((s) => (
                <li key={s.key} onMouseEnter={() => setHoverSource(s)} onMouseLeave={() => setHoverSource(null)} className={hoverSource?.key === s.key ? 'on' : ''}>
                  <i style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <strong>{formatCurrency(s.value)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="revenue-breakdown" aria-label="Revenue by source">
        <div className="revenue-source car-source">
          <span>Car / EV parking</span>
          <strong>{formatCurrency(revenueTotals.car)}</strong>
          <small>{revenueTotals.carCount} parking {revenueTotals.carCount === 1 ? 'booking' : 'bookings'}</small>
        </div>
        <div className="revenue-source bike-source">
          <span>Bike parking</span>
          <strong>{formatCurrency(revenueTotals.bike)}</strong>
          <small>{revenueTotals.bikeCount} parking {revenueTotals.bikeCount === 1 ? 'booking' : 'bookings'}</small>
        </div>
        <div className="revenue-source ev-source">
          <span>EV charging</span>
          <strong>{formatCurrency(revenueTotals.ev)}</strong>
          <small>{revenueTotals.evCount} charging {revenueTotals.evCount === 1 ? 'session' : 'sessions'}</small>
        </div>
        <div className="revenue-source wash-source">
          <span>Wash add-ons</span>
          <strong>{formatCurrency(revenueTotals.wash)}</strong>
          <small>{revenueTotals.washCount} paid {revenueTotals.washCount === 1 ? 'wash' : 'washes'}</small>
        </div>
      </section>

      <div className="ledger-heading">
        <div>
          <h3>Transactions & Earnings</h3>
          <p>Select a transaction to see its full booking and payment breakdown.</p>
        </div>
        <span>{ledgerBookings.length} transactions · newest first</span>
      </div>
      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vehicle Plate</th>
              <th>Driver</th>
              <th>Parking slot</th>
              <th>Duration</th>
              <th>Host Earnings</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {pageTransactions.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.id}</strong>{b.evChargingEarning > 0 && <span className="transaction-ev-tag">EV + charging</span>}</td>
                <td><span className="plate-pill">{b.vehiclePlate}</span><small className="transaction-vehicle-type">{b.vehicleType || 'Car'}</small></td>
                <td>{b.driverName}</td>
                <td>{formatTimestamp(b)}<small className="transaction-slot-end">Ends {formatSlotEnd(b)}</small></td>
                <td>{b.hoursBooked} hrs</td>
                <td className="transaction-earned">{isSettled(b) ? `+ ${formatCurrency(b.hostEarning ?? (Number(b.rateApplied) * Number(b.hoursBooked)))}` : `Pending ${formatCurrency(b.hostEarning ?? (Number(b.rateApplied) * Number(b.hoursBooked)))}`}</td>
                <td><span className="status-pill">{b.status}</span></td>
                <td><button className="transaction-detail-button" onClick={() => setSelectedTransaction(b)}>View details</button></td>
              </tr>
            ))}
            {ledgerBookings.length === 0 && (
              <tr><td className="ledger-empty" colSpan="8">No transactions yet. Completed bookings will appear here.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="transaction-pagination" aria-label="Transaction pages">
        <p aria-live="polite">
          Showing <strong>{firstVisibleTransaction}–{lastVisibleTransaction}</strong> of <strong>{ledgerBookings.length}</strong> payments, newest first
        </p>
        <div className="transaction-page-controls">
          <button
            type="button"
            onClick={() => setTransactionPage((page) => Math.max(0, page - 1))}
            disabled={currentTransactionPage === 0}
          >
            ← Previous
          </button>
          <span>Page {transactionPageCount === 0 ? 0 : currentTransactionPage + 1} of {transactionPageCount}</span>
          <button
            type="button"
            onClick={() => setTransactionPage((page) => Math.min(transactionPageCount - 1, page + 1))}
            disabled={currentTransactionPage >= transactionPageCount - 1}
          >
            Next →
          </button>
        </div>
      </div>

      <section className="monthly-report" aria-labelledby="monthly-report-title">
        <div className="monthly-report-heading">
          <div>
            <span className="monthly-report-kicker">REVENUE HISTORY</span>
            <h3 id="monthly-report-title">Monthly earnings report</h3>
            <p>Completed booking income only. Every total reconciles to the dated transaction ledger.</p>
          </div>
          <label className="report-range-control">
            Report period
            <select value={reportRange} onChange={(event) => setReportRange(['last-month', 'last-1-month'].includes(event.target.value) ? event.target.value : Number(event.target.value))}>
              <option value="last-1-month">Last 1 month</option>
              <option value="last-month">Previous calendar month</option>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>

        <div className="monthly-report-table-wrap">
          <table className="monthly-report-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Car / EV parking</th>
                <th>Bike parking</th>
                <th>EV charging</th>
                <th>Wash</th>
                <th>Monthly total</th>
                <th>Daily report</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReports.map((month) => (
                <tr key={month.key}>
                  <td><strong>{month.label}</strong><small>{month.days.length} booking dates</small></td>
                  <td>{formatCurrency(month.totals.car)}</td>
                  <td>{formatCurrency(month.totals.bike)}</td>
                  <td>{formatCurrency(month.totals.ev)}</td>
                  <td>{formatCurrency(month.totals.wash)}</td>
                  <td className="monthly-total-cell">{formatCurrency(month.totals.total)}</td>
                  <td>
                    <details className="monthly-days-details">
                      <summary>View dates</summary>
                      <div className="daily-report-list">
                        <div className="daily-report-row daily-report-labels">
                          <span>Booking date</span><span>Car/EV</span><span>Bike</span><span>EV charge</span><span>Wash</span><span>Total</span>
                        </div>
                        {month.days.map((day) => (
                          <div className="daily-report-row" key={day.key}>
                            <strong>{day.label}</strong>
                            <span>{formatCurrency(day.totals.car)}</span>
                            <span>{formatCurrency(day.totals.bike)}</span>
                            <span>{formatCurrency(day.totals.ev)}</span>
                            <span>{formatCurrency(day.totals.wash)}</span>
                            <strong>{formatCurrency(day.totals.total)}</strong>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {monthlyReports.length === 0 && (
                <tr><td className="monthly-report-empty" colSpan="7">No transactions were recorded in this period.</td></tr>
              )}
            </tbody>
            {monthlyReports.length > 0 && (
              <tfoot>
                <tr>
                  <th>Period total</th>
                  <th>{formatCurrency(reportTotals.car)}</th>
                  <th>{formatCurrency(reportTotals.bike)}</th>
                  <th>{formatCurrency(reportTotals.ev)}</th>
                  <th>{formatCurrency(reportTotals.wash)}</th>
                  <th>{formatCurrency(reportTotals.total)}</th>
                  <th>{reportIsLastMonth ? 'Previous month' : reportIsRollingMonth ? 'Last 1 month' : `${reportRange} months`}</th>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {selectedTransaction && (
        <div className="transaction-overlay" onClick={() => setSelectedTransaction(null)}>
          <section
            className="transaction-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="transaction-detail-header">
              <div>
                <span className="transaction-detail-kicker">HOST PAYMENT RECORD</span>
                <h3 id="transaction-detail-title">Transaction details</h3>
                <span className="transaction-reference">{selectedTransaction.id}</span>
              </div>
              <button className="transaction-close-button" aria-label="Close transaction details" onClick={() => setSelectedTransaction(null)}>×</button>
            </div>

            <div className="transaction-detail-body">
              <div className="transaction-total-banner">
                <span>Total host earnings</span>
                <strong>{formatCurrency(selectedParkingEarning + selectedEvEarning + selectedWashEarning)}</strong>
              </div>

              <div className="transaction-detail-grid">
                <div><span>Driver</span><strong>{selectedTransaction.driverName}</strong></div>
                <div><span>Driver email</span><strong>{selectedTransaction.driverEmail || 'Not provided'}</strong></div>
                <div><span>Vehicle</span><strong>{selectedTransaction.vehicleType || 'Car'} · {selectedTransaction.vehiclePlate}</strong></div>
                <div><span>Parking spot</span><strong>{selectedTransaction.spotName || 'Host parking space'}</strong></div>
                <div><span>Parking slot</span><strong>{formatTimestamp(selectedTransaction)} – {formatSlotEnd(selectedTransaction)}</strong></div>
                <div><span>Booking status</span><strong>{selectedTransaction.status}</strong></div>
                <div><span>Duration</span><strong>{selectedTransaction.hoursBooked} hours</strong></div>
                <div><span>Parking rate</span><strong>{formatCurrency(selectedTransaction.rateApplied)}/hour</strong></div>
              </div>

              <div className="transaction-payment-breakdown">
                <h4>{isSettled(selectedTransaction) ? 'Payment breakdown' : 'Expected payment breakdown'}</h4>
                <div><span>{selectedTransaction.vehicleType === 'Bike' ? 'Bike' : 'Car / EV'} parking ({selectedTransaction.hoursBooked} hours)</span><strong>{formatCurrency(selectedParkingEarning)}</strong></div>
                <div><span>EV charging{selectedTransaction.evChargerType ? ` · ${selectedTransaction.evChargerType}` : ''}</span><strong>{formatCurrency(selectedEvEarning)}</strong></div>
                <div><span>Wash add-on</span><strong>{formatCurrency(selectedWashEarning)}</strong></div>
                <div className="transaction-breakdown-total"><span>Total credited to host</span><strong>{formatCurrency(selectedParkingEarning + selectedEvEarning + selectedWashEarning)}</strong></div>
              </div>
            </div>
          </section>
        </div>
      )}

      {withdrawModal && (
        <div className="wd-backdrop" onClick={withdrawDone ? undefined : closeWithdraw}>
          <div className="wd-card" onClick={(e) => e.stopPropagation()}>
            {withdrawDone ? (
              <div className="wd-success">
                <div className="wd-check">✓</div>
                <h3>Successfully withdrawn</h3>
                <p>{formatCurrency(withdrawnAmount)} is on its way to {upi}</p>
              </div>
            ) : (
              <>
                <button className="wd-close" onClick={closeWithdraw} aria-label="Close">✕</button>
                <h3>Withdraw to UPI</h3>
                <p className="wd-balance">Available balance <strong>{formatCurrency(pendingBalance)}</strong></p>

                <label className="wd-label" htmlFor="wd-amount">Enter amount</label>
                <div className="wd-amount">
                  <span>₹</span>
                  <input
                    id="wd-amount"
                    type="number"
                    min="1"
                    max={pendingBalance}
                    inputMode="numeric"
                    placeholder="0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="wd-chips">
                  {[25, 50, 100].map((pct) => (
                    <button type="button" key={pct} onClick={() => setWithdrawAmount(String(Math.floor((pendingBalance * pct) / 100)))}>{pct === 100 ? 'All' : `${pct}%`}</button>
                  ))}
                </div>
                {withdrawError && <p className="wd-error">{withdrawError}</p>}

                <label className="wd-label" htmlFor="wd-upi">UPI ID</label>
                <input id="wd-upi" className="wd-upi" type="text" value={upi} onChange={(e) => setUpi(e.target.value)} />

                <button className="wd-submit" onClick={confirmWithdraw}>
                  Withdraw {Number(withdrawAmount) > 0 ? formatCurrency(Number(withdrawAmount)) : ''}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
