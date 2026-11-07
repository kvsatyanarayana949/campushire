import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import EligibilityModal from '../../components/common/EligibilityModal';

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isStudent } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minCgpa, setMinCgpa] = useState(searchParams.get('min_cgpa') || '');

  // Eligibility modal state
  const [auditJob, setAuditJob] = useState(null);

  const fetchJobs = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 9,
      search: search || undefined,
      job_type: jobType || undefined,
      location: location || undefined,
      min_cgpa: minCgpa || undefined,
    };

    api
      .get('/jobs', { params })
      .then((res) => {
        if (res.data.success) {
          setJobs(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => console.error('Error fetching jobs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs(1);
  }, [jobType, location, minCgpa]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setJobType('');
    setLocation('');
    setMinCgpa('');
    setSearchParams({});
    fetchJobs(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Verified Campus Placement Openings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore campus drives, check academic cutoff eligibility, and submit direct applications.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, company, or required skill (e.g. React, Node.js)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-bold rounded-xl shadow-xs transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-3.5 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-sky-600"
          >
            <option value="">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3.5 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-sky-600"
          >
            <option value="">All Locations</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Remote">Remote</option>
          </select>

          <select
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            className="px-3.5 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-sky-600"
          >
            <option value="">Any CGPA Cutoff</option>
            <option value="7.0">Max 7.0 CGPA Cutoff</option>
            <option value="8.0">Max 8.0 CGPA Cutoff</option>
          </select>

          {(search || jobType || location || minCgpa) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-700 font-bold hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No job openings matched your criteria"
          description="Try broadening your search keywords or resetting filters to see available openings."
          action={
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
            >
              Reset All Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        job.company_logo ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'
                      }
                      alt={job.company_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition">
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {job.company_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant={job.job_type}>{job.job_type.replace('_', ' ')}</Badge>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {job.salary_range}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Academic Criteria Tags */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    Min CGPA: {parseFloat(job.min_cgpa).toFixed(1)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    Max Backlogs: {job.max_backlogs}
                  </span>
                  {job.has_applied && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200 ml-auto">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{job.application_status}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                {isStudent && (
                  <button
                    onClick={() => setAuditJob(job)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-brand-600 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                    <span>Audit Eligibility</span>
                  </button>
                )}

                <Link
                  to={`/jobs/${job.id}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition ml-auto shadow-sm"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => fetchJobs(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-medium px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchJobs(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Eligibility Modal */}
      {auditJob && (
        <EligibilityModal
          isOpen={!!auditJob}
          onClose={() => setAuditJob(null)}
          jobId={auditJob.id}
          jobTitle={auditJob.title}
          hasApplied={auditJob.has_applied}
          onApplyClick={() => {
            window.location.href = `/jobs/${auditJob.id}`;
          }}
        />
      )}
    </div>
  );
};

export default JobsPage;
