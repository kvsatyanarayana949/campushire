import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, FileText, ExternalLink } from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchApplications = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      search: search || undefined,
      status: status || undefined,
    };

    api
      .get('/admin/applications', { params })
      .then((res) => {
        if (res.data.success) {
          setApplications(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => toast.error('Failed to load application logs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications(1);
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institutional Placement Applications Pool</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete institutional oversight of student submissions, status transitions, and offer extensions.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchApplications(1); }} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, company, or position..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="APPLIED">Applied</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="SELECTED">Selected Offer</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : applications.length === 0 ? (
        <EmptyState title="No applications found" description="No candidate applications match this filter." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Position & Company</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{app.student_name}</div>
                      <div className="text-slate-400 text-[11px]">{app.roll_number} • CGPA {app.cgpa}</div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{app.department}</td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{app.job_title}</div>
                      <div className="text-slate-400 text-[11px]">{app.company_name}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={app.status}>{app.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {app.applied_at?.split(' ')[0] || 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicationsPage;
