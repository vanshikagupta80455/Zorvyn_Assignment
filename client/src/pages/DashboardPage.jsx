import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';
import { TrendChart, CategoryChart, IncomeBarChart } from '../components/Charts';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSummary(),
      api.getRecentActivity(8),
    ])
      .then(([summaryRes, recentRes]) => {
        setSummary(summaryRes.data);
        setRecent(recentRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header fade-in">
        <h2>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h2>
        <p>Here's what's happening with your finances</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card income stagger-1">
          <div className="summary-card-header">
            <span className="summary-card-label">Total Income</span>
            <div className="summary-card-icon">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="summary-card-value">{formatCurrency(summary?.total_income || 0)}</div>
        </div>

        <div className="summary-card expense stagger-2">
          <div className="summary-card-header">
            <span className="summary-card-label">Total Expenses</span>
            <div className="summary-card-icon">
              <TrendingDown size={22} />
            </div>
          </div>
          <div className="summary-card-value">{formatCurrency(summary?.total_expenses || 0)}</div>
        </div>

        <div className="summary-card balance stagger-3">
          <div className="summary-card-header">
            <span className="summary-card-label">Net Balance</span>
            <div className="summary-card-icon">
              <Wallet size={22} />
            </div>
          </div>
          <div className="summary-card-value">{formatCurrency(summary?.net_balance || 0)}</div>
        </div>

        <div className="summary-card records stagger-4">
          <div className="summary-card-header">
            <span className="summary-card-label">Total Records</span>
            <div className="summary-card-icon">
              <FileText size={22} />
            </div>
          </div>
          <div className="summary-card-value">{summary?.total_records || 0}</div>
        </div>
      </div>

      {/* Charts - Only for analyst and admin */}
      {hasRole('analyst', 'admin') && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>📈 Income vs Expenses Trend</h3>
            <TrendChart />
          </div>
          <div className="chart-card" style={{ animationDelay: '0.3s' }}>
            <h3>🍩 Expense Breakdown</h3>
            <CategoryChart />
          </div>
        </div>
      )}

      {/* Recent Activity + Income Chart */}
      <div className="charts-grid">
        <div className="chart-card" style={{ animationDelay: '0.4s' }}>
          <h3>🕐 Recent Activity</h3>
          <div className="activity-list">
            {recent.length === 0 ? (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            ) : (
              recent.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-dot ${item.type}`} />
                  <div className="activity-info">
                    <div className="activity-category">{item.category}</div>
                    <div className="activity-desc">{item.description || 'No description'}</div>
                  </div>
                  <div className={`activity-amount ${item.type}`}>
                    {item.type === 'income' ? '+' : '-'}${Number(item.amount).toLocaleString()}
                  </div>
                  <div className="activity-date">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {hasRole('analyst', 'admin') && (
          <div className="chart-card" style={{ animationDelay: '0.5s' }}>
            <h3>💰 Income by Category</h3>
            <IncomeBarChart />
          </div>
        )}
      </div>
    </div>
  );
}
