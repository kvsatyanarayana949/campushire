import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, ShieldCheck, UserX, UserCheck, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Toggle user status modal state
  const [targetUser, setTargetUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      search: search || undefined,
      role: roleFilter || undefined,
      is_active: activeFilter !== '' ? activeFilter : undefined,
    };

    api
      .get('/admin/users', { params })
      .then((res) => {
        if (res.data.success) {
          setUsers(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => toast.error('Failed to load user records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleConfirm = async () => {
    if (!targetUser) return;
    setToggling(true);
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/toggle-status`);
      if (res.data.success) {
        toast.success(res.data.message);
        setTargetUser(null);
        fetchUsers(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Directory & Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, search, and manage candidate and enterprise recruiter access credentials.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="RECRUITER">Recruiters</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match this filter"
          description="Try relaxing your search terms or clearing role filters."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-slate-400 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'RECRUITER'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {u.is_active ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {u.created_at?.split(' ')[0] || 'N/A'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isCurrent ? (
                          <span className="text-[11px] text-slate-400 italic">Current Session</span>
                        ) : [1, 2, 5].includes(u.id) || ['rohit.verma@student.edu', 'priya.sharma@nexuscloud.com', 'admin@campushire.io'].includes(u.email) ? (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
                            Protected Demo
                          </span>
                        ) : (
                          <button
                            onClick={() => setTargetUser(u)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                              u.is_active
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!targetUser}
        onClose={() => setTargetUser(null)}
        onConfirm={handleToggleConfirm}
        title={targetUser?.is_active ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={
          targetUser?.is_active
            ? `Are you sure you want to deactivate ${targetUser?.name} (${targetUser?.email})? They will no longer be able to log in or apply.`
            : `Are you sure you want to reactivate access for ${targetUser?.name}?`
        }
        confirmText={targetUser?.is_active ? 'Deactivate Account' : 'Activate Account'}
        isDestructive={!!targetUser?.is_active}
        isLoading={toggling}
      />
    </div>
  );
};

export default UserManagementPage;
