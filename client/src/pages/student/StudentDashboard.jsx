import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertCircle,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton, StatsSkeleton } from '../../components/common/LoadingSkeleton';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/students/profile'),
      api.get('/applications/my-applications'),
      api.get('/jobs?limit=4'),
    ])
      .then(([profRes, appsRes, jobsRes]) => {
        if (profRes.data.success) setProfile(profRes.data.data);
        if (appsRes.data.success) setRecentApplications(appsRes.data.data.slice(0, 5));
        if (jobsRes.data.success) setRecommendedJobs(jobsRes.data.data);
      })
      .catch((err) => console.error('Failed to load student dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const stats = profile?.stats || {
    total_applications: 0,
    shortlisted_count: 0,
    selected_count: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Candidate Placement Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            {profile?.department || 'Student Candidate'} • Roll No: {profile?.roll_number || 'N/A'} • Class of {profile?.graduation_year || '2026'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/jobs"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition inline-flex items-center space-x-2"
          >
            <span>Browse Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/student/profile"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Applied</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total_applications || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Total submissions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Shortlisted</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.shortlisted_count || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Advancing to interviews</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Selected Offers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.selected_count || 0}</div>
          <p className="text-xs text-slate-400 font-medium">Offers extended</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Academic Record</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {profile?.cgpa ? parseFloat(profile.cgpa).toFixed(2) : '0.00'}{' '}
            <span className="text-xs font-normal text-slate-400">CGPA</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Active Backlogs: <span className="font-semibold text-slate-700">{profile?.active_backlogs || 0}</span>
          </p>
        </div>
      </div>

      {/* Grid: Recent Applications & Recommended Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">My Recent Applications</h3>
            <Link
              to="/student/applications"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <EmptyState
              title="No applications submitted yet"
              description="Discover active campus drives and apply using our backend eligibility checker."
              action={
                <Link
                  to="/jobs"
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm inline-block"
                >
                  Explore Verified Jobs
                </Link>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <div key={app.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img
                      src={
                        app.company_logo ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'
                      }
                      alt={app.company_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{app.job_title}</h4>
                      <p className="text-xs text-slate-500 truncate">
                        {app.company_name} • Applied on {app.applied_at?.split(' ')[0] || 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <Badge variant={app.status}>{app.status.replace('_', ' ')}</Badge>
                    <Link
                      to={`/jobs/${app.job_id}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="View position"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recommended Job Openings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recommended For You</h3>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center space-x-1"
            >
              <span>More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-300 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate hover:text-brand-600">
                      <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{job.company_name}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    {job.salary_range}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Min CGPA: {parseFloat(job.min_cgpa).toFixed(1)}</span>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    View Opening →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
