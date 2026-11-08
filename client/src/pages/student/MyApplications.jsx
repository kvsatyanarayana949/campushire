import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Calendar,
  ExternalLink,
  Trash2,
  Video,
  Clock,
  ArrowRight,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Withdraw dialog state
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = () => {
    setLoading(true);
    setError(null);
    api
      .get('/applications/my-applications')
      .then((res) => {
        if (res.data.success) {
          setApplications(res.data.data || []);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load applications. Server or database is warming up.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      const res = await api.delete(`/applications/${withdrawTarget.id}`);
      if (res.data.success) {
        toast.success('Application withdrawn successfully.');
        setWithdrawTarget(null);
        fetchApplications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'ALL') return true;
    return app.status === activeFilter;
  });

  const filterTabs = [
    { key: 'ALL', label: 'All Applications' },
    { key: 'APPLIED', label: 'Applied' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'SHORTLISTED', label: 'Shortlisted' },
    { key: 'SELECTED', label: 'Selected Offers' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Tracking Pipeline</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your application lifecycle, recruiter decisions, and scheduled technical interview rounds.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4 my-6">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Unable to Load Applications</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchApplications}
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
          >
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title="No applications in this category"
          description="Explore current openings and apply to companies that match your profile."
          action={
            <Link
              to="/jobs"
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm inline-block"
            >
              Browse Open Positions
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredApps.map((app) => (
            <div key={app.id} className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img
                    src={
                      app.company_logo ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'
                    }
                    alt={app.company_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition">
                      <Link to={`/jobs/${app.job_id}`}>{app.job_title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {app.company_name} • {app.job_location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <Badge variant={app.status}>{app.status.replace('_', ' ')}</Badge>

                  {/* Withdraw Button (only allowed if APPLIED) */}
                  {app.status === 'APPLIED' && (
                    <button
                      onClick={() => setWithdrawTarget(app)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Withdraw application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status details & interview notice if any */}
              {app.interview_time && (
                <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-950">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      <strong>Interview Scheduled:</strong> {app.interview_time} ({app.interview_mode || 'ONLINE'})
                    </span>
                  </div>
                  {app.interview_link && (
                    <a
                      href={app.interview_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shrink-0"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                <span>Applied on: {app.applied_at?.split(' ')[0]}</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {app.salary_range}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdraw Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdrawConfirm}
        title="Withdraw Job Application?"
        message={`Are you sure you want to withdraw your application for "${withdrawTarget?.job_title}" at ${withdrawTarget?.company_name}? This action cannot be reversed.`}
        confirmText="Confirm Withdrawal"
        isLoading={withdrawing}
        isDestructive={true}
      />
    </div>
  );
};

export default MyApplications;
