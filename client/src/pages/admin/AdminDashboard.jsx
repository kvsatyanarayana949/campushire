import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users,
  Building,
  Briefcase,
  FileText,
  Award,
  TrendingUp,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Badge from '../../components/common/Badge';
import { StatsSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/dashboard')
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load admin dashboard:', err))
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

  const overview = data?.overview || {};
  const statusBreakdown = data?.statusBreakdown || [];
  const departmentStats = data?.departmentStats || [];
  const topCompanies = data?.topCompanies || [];
  const recentActivities = data?.recentActivities || [];

  // Format department chart data
  const chartData = departmentStats.map((d) => ({
    name: d.department.replace('Engineering', 'Eng.').replace('Computer Science &', 'CS &'),
    enrolled: parseInt(d.total_enrolled || 0, 10),
    placed: parseInt(d.placed_count || 0, 10),
  }));

  // Status breakdown chart data
  const statusColors = {
    APPLIED: '#3b82f6',
    UNDER_REVIEW: '#f59e0b',
    SHORTLISTED: '#a855f7',
    SELECTED: '#10b981',
    REJECTED: '#f43f5e',
  };

  const statusChartData = statusBreakdown.map((s) => ({
    name: s.status.replace('_', ' '),
    count: parseInt(s.count, 10),
    color: statusColors[s.status] || '#64748b',
  }));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Placement & Institutional Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Placement Console
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Real-time analytics on university campus recruitment drives, candidate eligibility fulfillment, and hiring velocity.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/jobs"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            All Openings
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Students
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{overview.total_students || 0}</span>
          <p className="text-[10px] text-slate-500">Enrolled candidates</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Recruiters
          </span>
          <span className="text-2xl font-extrabold text-indigo-600">{overview.total_recruiters || 0}</span>
          <p className="text-[10px] text-slate-500">Corporate leads</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Companies
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{overview.total_companies || 0}</span>
          <p className="text-[10px] text-slate-500">Hiring partners</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Active Jobs
          </span>
          <span className="text-2xl font-extrabold text-brand-600">{overview.active_jobs || 0}</span>
          <p className="text-[10px] text-slate-500">Of {overview.total_jobs || 0} total drives</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Applications
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{overview.total_applications || 0}</span>
          <p className="text-[10px] text-slate-500">Across all jobs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Offers Extended
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">{overview.total_placed_students || 0}</span>
          <p className="text-[10px] text-emerald-600 font-semibold">Placement success</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Placement Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Enrolled vs Placed</h3>
              <p className="text-xs text-slate-500">Distribution of candidates across academic departments</p>
            </div>
            <Award className="w-5 h-5 text-brand-600" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="enrolled" fill="#e2e8f0" name="Enrolled Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" fill="#0284c7" name="Offers Extended" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status Pipeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Application Status Distribution</h3>
              <p className="text-xs text-slate-500">Real-time candidate pipeline across all stages</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Hiring Companies & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hiring Companies */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Top Hiring Companies</h3>
            <span className="text-xs font-semibold text-slate-500">Openings & Offers</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topCompanies.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={c.logo_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'}
                    alt={c.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-slate-400 truncate">{c.industry}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {c.job_openings} Drives
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {c.selections_count || 0} Offers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Placement Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Candidate Activity</h3>
            <Link to="/admin/applications" className="text-xs font-semibold text-brand-600 hover:underline">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{act.student_name}</p>
                  <p className="text-slate-500 truncate">
                    {act.job_title} • {act.company_name}
                  </p>
                </div>
                <Badge variant={act.status}>{act.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
