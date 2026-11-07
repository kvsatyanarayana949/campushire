import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  PlusCircle,
  Users,
  Archive,
  ArrowRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const ManageJobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closeTarget, setCloseTarget] = useState(null);
  const [closing, setClosing] = useState(false);
  const toast = useToast();

  const fetchJobs = () => {
    setLoading(true);
    api
      .get(`/jobs?status=all&recruiter_id=${user?.id}`)
      .then((res) => {
        if (res.data.success) {
          setJobs(res.data.data);
        }
      })
      .catch((err) => toast.error('Failed to load company openings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.id) fetchJobs();
  }, [user]);

  const handleCloseConfirm = async () => {
    if (!closeTarget) return;
    setClosing(true);
    try {
      const res = await api.delete(`/jobs/${closeTarget.id}`);
      if (res.data.success) {
        toast.success(`Job drive "${closeTarget.title}" archived successfully.`);
        setCloseTarget(null);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close job.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Campus Recruitment Drives</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review active postings, track applicant submission volume, or archive completed recruitment drives.
          </p>
        </div>
        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Drive</span>
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No recruitment drives found"
          description="You haven't posted any campus drives yet."
          action={
            <Link
              to="/recruiter/jobs/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm inline-block"
            >
              Post a Position
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {jobs.map((job) => (
            <div key={job.id} className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={job.job_type}>{job.job_type.replace('_', ' ')}</Badge>
                    {job.is_active ? (
                      <Badge variant="success">Active Drive</Badge>
                    ) : (
                      <Badge variant="default">Archived / Closed</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {job.location} • Compensation: {job.salary_range}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    to={`/recruiter/jobs/${job.id}/applicants`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Candidates ({job.applicant_count || 0})</span>
                  </Link>

                  {job.is_active && (
                    <button
                      onClick={() => setCloseTarget(job)}
                      title="Close & archive opening"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-50">
                <div className="flex items-center space-x-4">
                  <span>
                    <strong>Cutoff:</strong> CGPA ≥ {parseFloat(job.min_cgpa).toFixed(1)}
                  </span>
                  <span>
                    <strong>Max Backlogs:</strong> {job.max_backlogs}
                  </span>
                </div>
                <span>Deadline: {job.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseConfirm}
        title="Archive Recruitment Drive?"
        message={`Are you sure you want to close "${closeTarget?.title}"? New candidates will no longer be able to submit applications.`}
        confirmText="Confirm Archive"
        isLoading={closing}
        isDestructive={true}
      />
    </div>
  );
};

export default ManageJobsPage;
