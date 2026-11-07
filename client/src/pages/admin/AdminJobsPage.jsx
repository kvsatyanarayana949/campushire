import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Briefcase, Archive, ExternalLink, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [targetJob, setTargetJob] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchJobs = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      search: search || undefined,
      status: status || undefined,
    };

    api
      .get('/admin/jobs', { params })
      .then((res) => {
        if (res.data.success) {
          setJobs(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => toast.error('Failed to load job postings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs(1);
  }, [status]);

  const handleToggleJob = async () => {
    if (!targetJob) return;
    setToggling(true);
    try {
      if (targetJob.is_active) {
        // Close job
        await api.delete(`/jobs/${targetJob.id}`);
        toast.success(`Job drive "${targetJob.title}" closed.`);
      } else {
        // Reopen job
        await api.put(`/jobs/${targetJob.id}`, { is_active: true });
        toast.success(`Job drive "${targetJob.title}" reactivated.`);
      }
      setTargetJob(null);
      fetchJobs(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institutional Job Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor and administer all corporate recruitment drives posted across the platform.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchJobs(1); }} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Drives Only</option>
          <option value="inactive">Archived / Closed Only</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : jobs.length === 0 ? (
        <EmptyState title="No job openings found" description="No jobs match your search filter." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Position & Company</th>
                  <th className="py-3.5 px-6">Compensation</th>
                  <th className="py-3.5 px-6">Cutoffs</th>
                  <th className="py-3.5 px-6">Applicants</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        <Link to={`/jobs/${job.id}`} className="hover:text-brand-600">
                          {job.title}
                        </Link>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {job.company_name} • Posted by {job.recruiter_name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-semibold">{job.salary_range}</td>
                    <td className="py-4 px-6">
                      <div>CGPA ≥ {parseFloat(job.min_cgpa).toFixed(1)}</div>
                      <div className="text-slate-400 text-[11px]">Backlogs ≤ {job.max_backlogs}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200">
                        {job.applicant_count || 0} candidates
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {job.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Closed</Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold inline-block"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => setTargetJob(job)}
                        className={`px-3 py-1 rounded-lg font-semibold transition ${
                          job.is_active
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {job.is_active ? 'Close' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!targetJob}
        onClose={() => setTargetJob(null)}
        onConfirm={handleToggleJob}
        title={targetJob?.is_active ? 'Close Job Opening?' : 'Reopen Job Opening?'}
        message={
          targetJob?.is_active
            ? `Are you sure you want to close "${targetJob?.title}"? Candidates will no longer be able to apply.`
            : `Reopen "${targetJob?.title}" for new candidate submissions?`
        }
        confirmText={targetJob?.is_active ? 'Close Opening' : 'Reopen Opening'}
        isLoading={toggling}
        isDestructive={!!targetJob?.is_active}
      />
    </div>
  );
};

export default AdminJobsPage;
