import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  Building,
  TrendingUp,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { StatsSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/recruiters/profile'),
      api.get('/jobs?status=all&limit=6'),
    ])
      .then(([profRes, jobsRes]) => {
        if (profRes.data.success) setProfile(profRes.data.data);
        if (jobsRes.data.success) {
          // Filter to this recruiter's jobs
          const recruiterJobs = jobsRes.data.data.filter(
            (j) => j.recruiter_id === user?.id
          );
          setJobs(recruiterJobs.length > 0 ? recruiterJobs : jobsRes.data.data);
        }
      })
      .catch((err) => console.error('Failed to load recruiter dashboard:', err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const stats = profile?.stats || {
    total_jobs_posted: 0,
    total_applicants: 0,
    shortlisted_count: 0,
    selected_count: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>{profile?.company_name || 'Enterprise'} Recruitment Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            {profile?.designation || 'Campus Recruiter'} • {profile?.company_location || 'Campus Drive Coordinator'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/recruiter/jobs/new"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition inline-flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish New Drive</span>
          </Link>
          <Link
            to="/recruiter/profile"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            Company Profile
          </Link>
        </div>
      </div>

      {/* Stats KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Openings</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total_jobs_posted || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Published campus drives</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Candidates</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-brand-600">{stats.total_applicants || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Verified applicants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">In Interview</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.shortlisted_count || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Shortlisted pipeline</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Selected Offers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.selected_count || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Successful campus hires</p>
        </div>
      </div>

      {/* Published Openings & Pipeline Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Your Campus Job Drives</h3>
          <Link
            to="/recruiter/jobs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manage All Drives →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title="No job openings published yet"
            description="Create your first campus recruitment opening to define academic eligibility criteria and receive applicants."
            action={
              <Link
                to="/recruiter/jobs/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm inline-block"
              >
                Publish First Opening
              </Link>
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Position</th>
                    <th className="py-3.5 px-6">Cutoffs</th>
                    <th className="py-3.5 px-6">Compensation</th>
                    <th className="py-3.5 px-6">Applicants</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                        <div className="text-slate-400 text-[11px]">Deadline: {job.deadline}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div>CGPA ≥ {parseFloat(job.min_cgpa).toFixed(1)}</div>
                        <div className="text-slate-400 text-[11px]">Backlogs ≤ {job.max_backlogs}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-900 font-semibold">{job.salary_range}</td>
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
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/recruiter/jobs/${job.id}/applicants`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold transition"
                        >
                          <span>Review Applicants</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
