import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Users,
  LogOut,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <TrendingUp size={22} color="white" />
        </div>
        <div>
          <h1>EasyFinance</h1>
          <p>Control Panel</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard className="sidebar-link-icon" />
            Dashboard
          </NavLink>

          {hasRole('analyst', 'admin') && (
            <NavLink
              to="/records"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Receipt className="sidebar-link-icon" />
              Financial Records
            </NavLink>
          )}
        </div>

        {hasRole('admin') && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Administration</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users className="sidebar-link-icon" />
              User Management
            </NavLink>
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-title">Account</div>
          <div className="sidebar-link" style={{ cursor: 'default' }}>
            <Shield className="sidebar-link-icon" />
            <span>
              Role: <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user ? getInitials(user.full_name) : '??'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.full_name || 'Unknown'}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
