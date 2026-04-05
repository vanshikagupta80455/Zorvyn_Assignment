import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { UserModal, ConfirmModal } from '../components/Modals';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (data) => {
    await api.register(data);
    fetchUsers();
  };

  const handleUpdate = async (data) => {
    await api.updateUser(editingUser.id, data);
    setEditingUser(null);
    fetchUsers();
  };

  const handleDelete = async () => {
    await api.deleteUser(deleteUser.id);
    setDeleteUser(null);
    fetchUsers();
  };

  const handleToggleStatus = async () => {
    const newStatus = toggleUser.status === 'active' ? 'inactive' : 'active';
    await api.updateUser(toggleUser.id, { status: newStatus });
    setToggleUser(null);
    fetchUsers();
  };

  return (
    <div>
      <div className="page-header fade-in">
        <div className="page-header-actions">
          <div>
            <h2>User Management</h2>
            <p>Manage system users and their roles</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
            <Plus size={18} />
            New User
          </button>
        </div>
      </div>

      <div className="card fade-in" style={{ animationDelay: '0.1s', padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: user.role === 'admin'
                              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                              : user.role === 'analyst'
                              ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                              : 'linear-gradient(135deg, #64748b, #94a3b8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {user.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                            {user.full_name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status}`}>{user.status}</span>
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Edit"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => setToggleUser(user)}
                          style={{
                            color: user.status === 'active' ? 'var(--color-warning)' : 'var(--color-success)',
                          }}
                        >
                          {user.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Delete"
                          onClick={() => setDeleteUser(user)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserModal && (
        <UserModal onClose={() => setShowUserModal(false)} onSubmit={handleCreate} />
      )}

      {editingUser && (
        <UserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleteUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteUser.full_name}" (@${deleteUser.username})? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteUser(null)}
          danger
        />
      )}

      {toggleUser && (
        <ConfirmModal
          title={`${toggleUser.status === 'active' ? 'Deactivate' : 'Activate'} User`}
          message={`Are you sure you want to ${toggleUser.status === 'active' ? 'deactivate' : 'activate'} "${toggleUser.full_name}"?`}
          onConfirm={handleToggleStatus}
          onClose={() => setToggleUser(null)}
        />
      )}
    </div>
  );
}
