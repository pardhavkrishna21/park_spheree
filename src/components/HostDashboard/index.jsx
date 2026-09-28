import React, { useState } from 'react';
import './index.css';

const getBookingDate = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getBookingIncome = (booking) => {
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

export default function HostDashboard({ user, hostBookings, hostSpots, setHostSpots, showToast, setCurrentTab }) {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reportRange, setReportRange] = useState(3);
  const reportIsLastMonth = reportRange === 'last-month';
  const [transactionPage, setTransactionPage] = useState(0);
  const [upi, setUpi] = useState('vikram@okaxis');

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
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthBookings = hostBookings.filter((booking) => {
    const date = getBookingDate(booking.timestamp);
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
  const pendingBalance = 3720;
  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatTimestamp = (timestamp) => {
    const date = getBookingDate(timestamp);
    return date
      ? date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : timestamp || 'Time unavailable';
  };

  const reportStart = reportIsLastMonth
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth() - reportRange + 1, 1);
  const reportEnd = reportIsLastMonth
    ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    : now;
  const monthlyGroups = new Map();
  hostBookings.forEach((booking) => {
    const date = getBookingDate(booking.timestamp);
    if (!date || date < reportStart || date > reportEnd) return;

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
  const transactionPageCount = Math.ceil(hostBookings.length / transactionsPerPage);
  const currentTransactionPage = Math.min(transactionPage, Math.max(0, transactionPageCount - 1));
  const pageTransactions = hostBookings.slice(
    currentTransactionPage * transactionsPerPage,
    (currentTransactionPage + 1) * transactionsPerPage
  );
  const firstVisibleTransaction = hostBookings.length === 0 ? 0 : currentTransactionPage * transactionsPerPage + 1;
  const lastVisibleTransaction = Math.min((currentTransactionPage + 1) * transactionsPerPage, hostBookings.length);

  return (
    <div>
      <div className="dash-header">
        <div>
          <span className="confidential-tag">CONFIDENTIAL • SPACE HOST REVENUE CONSOLE</span>
          <h2>Revenue Generated & Payouts ({user.name})</h2>
          <p>Real-time booking income, live occupied bays, and automated settlements.</p>
        </div>
        <button className="btn-primary" onClick={() => setWithdrawModal(true)}>
          Withdraw Balance (₹{pendingBalance})
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card emerald">
          <span>This Month's Realized Revenue</span>
          <div className="kpi-value">₹{thisMonthEarned.toLocaleString('en-IN')}</div>
          <small>↑ 14% higher than last month</small>
        </div>
        <div className="kpi-card blue">
          <span>Available Wallet Balance</span>
          <div className="kpi-value" style={{ color: '#2563eb' }}>₹{pendingBalance.toLocaleString('en-IN')}</div>
          <small>Ready for instant UPI settlement</small>
        </div>
        <div className="kpi-card amber">
          <span>Bays Occupied Now</span>
          <div className="kpi-value" style={{ color: '#d97706' }}>{hostBookings.filter((booking) => booking.status?.toLowerCase().includes('active')).length} Active Vehicles</div>
          <small>Accumulating hourly returns</small>
        </div>
      </div>

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
        <span>{hostBookings.length} transactions</span>
      </div>
      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vehicle Plate</th>
              <th>Driver</th>
              <th>Booked At</th>
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
                <td>{formatTimestamp(b.timestamp)}</td>
                <td>{b.hoursBooked} hrs</td>
                <td className="transaction-earned">+ {formatCurrency(b.hostEarning ?? (Number(b.rateApplied) * Number(b.hoursBooked)))}</td>
                <td><span className="status-pill">{b.status}</span></td>
                <td><button className="transaction-detail-button" onClick={() => setSelectedTransaction(b)}>View details</button></td>
              </tr>
            ))}
            {hostBookings.length === 0 && (
              <tr><td className="ledger-empty" colSpan="8">No transactions yet. Completed bookings will appear here.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="transaction-pagination" aria-label="Transaction pages">
        <p aria-live="polite">
          Showing <strong>{firstVisibleTransaction}–{lastVisibleTransaction}</strong> of <strong>{hostBookings.length}</strong> payments
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
            <p>Review income by source for each month, then expand a month to see booking dates.</p>
          </div>
          <label className="report-range-control">
            Report period
            <select value={reportRange} onChange={(event) => setReportRange(event.target.value === 'last-month' ? 'last-month' : Number(event.target.value))}>
              <option value="last-month">Last month</option>
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
                  <th>{reportIsLastMonth ? 'Last month' : `${reportRange} months`}</th>
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
                <div><span>Booking time</span><strong>{formatTimestamp(selectedTransaction.timestamp)}</strong></div>
                <div><span>Booking status</span><strong>{selectedTransaction.status}</strong></div>
                <div><span>Duration</span><strong>{selectedTransaction.hoursBooked} hours</strong></div>
                <div><span>Parking rate</span><strong>{formatCurrency(selectedTransaction.rateApplied)}/hour</strong></div>
              </div>

              <div className="transaction-payment-breakdown">
                <h4>Payment breakdown</h4>
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
        <div className="modal-overlay" onClick={() => setWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Instant UPI Settlement</h3>
            <p>Available balance: <strong>₹{pendingBalance}</strong></p>
            <input type="text" value={upi} onChange={(e) => setUpi(e.target.value)} style={{ margin: '14px 0', width: '100%', padding: '10px' }} />
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
              setWithdrawModal(false);
              showToast(`💸 ₹${pendingBalance} successfully transferred to ${upi}!`);
            }}>
              Confirm Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}