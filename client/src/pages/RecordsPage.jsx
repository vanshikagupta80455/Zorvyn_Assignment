import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { RecordModal, ConfirmModal } from '../components/Modals';
import {
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';

export default function RecordsPage() {
  const { hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    start_date: '',
    end_date: '',
    search: '',
    sort_by: 'date',
    sort_order: 'desc',
    page: 1,
    limit: 15,
  });

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRecords(filters);
      setRecords(res.data);
      setPagination(res.pagination);
      if (res.filters?.categories) {
        setCategories(res.filters.categories);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreate = async (data) => {
    await api.createRecord(data);
    fetchRecords();
  };

  const handleUpdate = async (data) => {
    await api.updateRecord(editingRecord.id, data);
    setEditingRecord(null);
    fetchRecords();
  };

  const handleDelete = async () => {
    await api.deleteRecord(deleteRecord.id);
    setDeleteRecord(null);
    fetchRecords();
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  return (
    <div>
      <div className="page-header fade-in">
        <div className="page-header-actions">
          <div>
            <h2>Financial Records</h2>
            <p>Manage all income and expense entries</p>
          </div>
          {hasRole('admin') && (
            <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
              <Plus size={18} />
              New Record
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search records..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <select
          className="form-select"
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          className="form-select"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="date"
          className="form-input"
          value={filters.start_date}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
          placeholder="Start Date"
          style={{ minWidth: '140px' }}
        />

        <input
          type="date"
          className="form-input"
          value={filters.end_date}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          placeholder="End Date"
          style={{ minWidth: '140px' }}
        />
      </div>

      {/* Table */}
      <div className="card fade-in" style={{ animationDelay: '0.2s', padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Filter size={40} className="empty-state-icon" />
            <h3>No Records Found</h3>
            <p>Try adjusting your filters or create a new record.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Created By</th>
                  {hasRole('admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`badge badge-${record.type}`}>
                        {record.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{record.category}</td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.description || '—'}
                    </td>
                    <td style={{
                      fontWeight: 700,
                      color: record.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </td>
                    <td>{record.created_by_name || '—'}</td>
                    {hasRole('admin') && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Edit"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Delete"
                            onClick={() => setDeleteRecord(record)}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <span className="pagination-info">
            {pagination.total} records
          </span>

          <button
            className="pagination-btn"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showRecordModal && (
        <RecordModal onClose={() => setShowRecordModal(false)} onSubmit={handleCreate} />
      )}

      {editingRecord && (
        <RecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleteRecord && (
        <ConfirmModal
          title="Delete Record"
          message={`Are you sure you want to delete this ${deleteRecord.type} record of ${formatCurrency(deleteRecord.amount)} in "${deleteRecord.category}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteRecord(null)}
          danger
        />
      )}
    </div>
  );
}
