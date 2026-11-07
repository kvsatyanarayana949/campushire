import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowLeft,
  Send,
  ExternalLink,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EligibilityModal from '../../components/common/EligibilityModal';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStudent, isAuthenticated } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  // Eligibility modal state
  const [eligibilityOpen, setEligibilityOpen] = useState(false);

  const fetchJob = () => {
    setLoading(true);
    api
      .get(`/jobs/${id}`)
      .then((res) => {
        if (res.data.success) {
          setJob(res.data.data);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load job opening.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const response = await api.post('/applications', {
        job_id: id,
        cover_letter: coverLetter,
      });

      if (response.data.success) {
        toast.success('Your application was submitted successfully! The recruiter has been notified.');
        setApplyModalOpen(false);
        fetchJob(); // Refresh job to update user_application status
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application.';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading position details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Position Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'This job opening does not exist or has expired.'}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Openings</span>
        </Link>
      </div>
    );
  }

  const hasApplied = !!job.user_application;
  const skillsArray = (job.required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Openings</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start space-x-4">
            <img
              src={
                job.company_logo ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop'
              }
              alt={job.company_name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 bg-slate-50 shadow-sm shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={job.job_type}>{job.job_type.replace('_', ' ')}</Badge>
                {job.is_active ? (
                  <Badge variant="success">Active Drive</Badge>
                ) : (
                  <Badge variant="danger">Closed</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>
              <p className="text-sm font-medium text-slate-600">
                {job.company_name} • {job.location}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {isStudent && (
              <button
                onClick={() => setEligibilityOpen(true)}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Check Eligibility</span>
              </button>
            )}

            {hasApplied ? (
              <div className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Applied: {job.user_application.status}</span>
              </div>
            ) : isStudent ? (
              <button
                onClick={() => setApplyModalOpen(true)}
                disabled={!job.is_active}
                className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-brand-600/20 transition"
              >
                <Send className="w-4 h-4" />
                <span>Apply for Position</span>
              </button>
            ) : !isAuthenticated ? (
              <Link
                to={`/login?redirect=/jobs/${job.id}`}
                className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
              >
                <span>Log In to Apply</span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Stipend / CTC</span>
            <span className="text-sm font-bold text-slate-900">{job.salary_range}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Application Deadline</span>
            <span className="text-sm font-bold text-slate-900">{job.deadline}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Applicants</span>
            <span className="text-sm font-bold text-slate-900">{job.applicant_count || 0} candidates</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Drive Location</span>
            <span className="text-sm font-bold text-slate-900">{job.location}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description & Skills */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Job Overview & Responsibilities</h3>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Academic Eligibility Requirements */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-bold text-slate-900">Academic Eligibility Criteria</h3>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated strictly on the backend when candidate applies. Profiles not meeting these requirements will not be processed.
            </p>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-sm">
              <div className="grid grid-cols-2 p-3.5 bg-slate-50/70 font-medium">
                <span className="text-slate-500">Minimum CGPA Required</span>
                <span className="font-bold text-slate-900">{parseFloat(job.min_cgpa).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5">
                <span className="text-slate-500">Maximum Active Backlogs Permitted</span>
                <span className="font-bold text-slate-900">{job.max_backlogs}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-slate-50/70">
                <span className="text-slate-500">Eligible Graduation Batch</span>
                <span className="font-bold text-slate-900">
                  {job.eligible_graduation_year ? `${job.eligible_graduation_year} Batch` : 'Any Batch'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-3.5">
                <span className="text-slate-500">Eligible Degrees</span>
                <span className="font-bold text-slate-900">{job.eligible_degrees}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-slate-50/70">
                <span className="text-slate-500">Eligible Departments</span>
                <span className="font-bold text-slate-900">{job.eligible_departments}</span>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Technical Skills Required</h3>
            <p className="text-xs text-slate-500">
              Proficiency in these competencies is verified during the backend eligibility evaluation.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {skillsArray.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Company Profile & Recruiter Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Hiring Organization</h3>
            <div className="space-y-3">
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
                  <h4 className="text-sm font-bold text-slate-900">{job.company_name}</h4>
                  <p className="text-xs text-slate-500">{job.company_industry}</p>
                </div>
              </div>

              {job.company_description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-2">
                  {job.company_description}
                </p>
              )}

              {job.company_website && (
                <a
                  href={job.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:underline pt-1"
                >
                  <span>Visit Company Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Application Process Note */}
          <div className="bg-gradient-to-br from-slate-900 to-navy-900 rounded-3xl p-6 text-white space-y-3 shadow-md">
            <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Verification Note</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All applications are tracked by the campus placement administration cell. Shortlisted candidates will receive official interview invites directly in their notification inbox.
            </p>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply for ${job.title}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-900">
            <strong>Candidate:</strong> {user?.name} ({user?.email})
            <p className="text-brand-700 mt-0.5">
              Your profile details (CGPA: {user?.profile?.cgpa || '0.00'}) will be verified by the eligibility engine upon submission.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Brief Cover Letter / Statement of Interest (Optional)
            </label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Highlight relevant projects, coursework, or why you are excited to join this team..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-xl shadow-sm transition"
            >
              {applying ? 'Submitting Application...' : 'Confirm & Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Eligibility Audit Modal */}
      {isStudent && (
        <EligibilityModal
          isOpen={eligibilityOpen}
          onClose={() => setEligibilityOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
          hasApplied={hasApplied}
          onApplyClick={() => setApplyModalOpen(true)}
        />
      )}
    </div>
  );
};

export default JobDetailsPage;
