import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Briefcase,
  CheckCircle,
  GraduationCap,
  Building,
  TrendingUp,
  Shield,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Users,
  Target,
} from 'lucide-react';
import Badge from '../../components/common/Badge';

const LandingPage = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [stats, setStats] = useState({
    total_jobs: 6,
    total_companies: 3,
    total_students: 4,
    total_placed_students: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured jobs from backend
    api
      .get('/jobs?limit=4')
      .then((res) => {
        if (res.data.success) {
          setFeaturedJobs(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load featured jobs:', err))
      .finally(() => setLoading(false));

    // Try fetching public platform statistics
    api
      .get('/admin/dashboard')
      .then((res) => {
        if (res.data.success && res.data.data.overview) {
          setStats(res.data.data.overview);
        }
      })
      .catch(() => {
        // Fallback to initial seed count
      });
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-white via-brand-50/20 to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Smart Campus Recruitment & Placement Automation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Connecting Top Campus Talent with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                Industry Leaders
              </span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              CampusHire unifies universities, students, and recruiters with an automated backend eligibility engine, real-time application pipelines, and placement transparency.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link
                to="/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md shadow-sky-600/30 transition-all hover:-translate-y-0.5"
              >
                <Search className="w-5 h-5 text-white" />
                <span className="text-white font-bold">Explore Verified Openings</span>
              </Link>
              <Link
                to="/register/recruiter"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-bold text-slate-800 bg-white hover:bg-slate-100 hover:text-slate-900 border-2 border-slate-300 rounded-xl shadow-xs transition-all hover:-translate-y-0.5"
              >
                <Building className="w-5 h-5 text-slate-700" />
                <span className="text-slate-800 font-bold">Post Campus Jobs</span>
              </Link>
            </div>

            {/* Quick Demo Credentials Info Pill */}
            <div className="pt-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Looking to test?</span> Demo accounts ready for{' '}
              <span className="underline decoration-brand-400">Student</span>,{' '}
              <span className="underline decoration-brand-400">Recruiter</span>, and{' '}
              <span className="underline decoration-brand-400">Admin</span> on the{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">
                Login page
              </Link>
              .
            </div>
          </div>
        </div>
      </section>

      {/* Real Platform Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{stats.total_jobs || 6}+</p>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Verified Openings</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-600">{stats.total_companies || 3}+</p>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Hiring Tech Companies</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{stats.total_students || 4}+</p>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Enrolled Candidates</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">100%</p>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Automated Eligibility Check</p>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Campus Drives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Featured Opportunities
            </h2>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View All Openings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={job.company_logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'}
                      alt={job.company_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition">
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{job.company_name} • {job.location}</p>
                    </div>
                  </div>
                  <Badge variant={job.job_type}>{job.job_type.replace('_', ' ')}</Badge>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Eligibility chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                    Min CGPA: {parseFloat(job.min_cgpa).toFixed(1)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                    Backlogs: ≤ {job.max_backlogs}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-semibold border border-emerald-300">
                    {job.salary_range}
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Deadline: <span className="font-semibold text-slate-800">{job.deadline}</span>
                </span>
                <Link
                  to={`/jobs/${job.id}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition"
                >
                  <span>Check Criteria & Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Workflow Automation</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">How CampusHire Powers Placement</h2>
          <p className="text-sm text-slate-500">
            Automating manual verification hurdles so students and recruiters focus on talent matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-200">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900">Profile & Skills Setup</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Students record verified academic credentials (CGPA, department, roll number, active backlogs) and technical skill proficiencies.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900">Backend Eligibility Audit</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When applying, the backend engine cross-checks CGPA thresholds, backlogs, department eligibility, and required skills, preventing invalid submissions.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900">Interview & Status Tracking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Recruiters shortlist candidates and schedule interviews. Students receive instant notification alerts at every step from review to final offer.
            </p>
          </div>
        </div>
      </section>

      {/* User Benefits Comparison */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl text-white p-8 sm:p-12 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Student Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-brand-400 font-bold text-sm uppercase tracking-wider">
                <GraduationCap className="w-5 h-5" />
                <span>For Students</span>
              </div>
              <h3 className="text-2xl font-bold">Never Wonder If You Qualify</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instant eligibility diagnosis with missing skills feedback</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time status updates: Applied, Under Review, Shortlisted, Selected</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>No duplicate applications confusion or missed deadlines</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/register/student"
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
                >
                  <span>Register as Student Candidate</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Recruiter Benefits */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-8 md:pt-0 md:pl-10">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <Building className="w-5 h-5" />
                <span>For Recruiters</span>
              </div>
              <h3 className="text-2xl font-bold">Zero Resume Spam, Verified Candidates</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Enforce minimum CGPA, active backlog caps, and degree filters</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Rank candidates by academic scores and matched technical skills</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Schedule interviews and update candidate statuses in one click</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/register/recruiter"
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Set Up Company Hiring Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
