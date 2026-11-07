import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Users,
  Award,
  Video,
  FileText,
  Mail,
  Phone,
  Search,
  ExternalLink,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const JobApplicantsPage = () => {
  const { jobId } = useParams();
  const toast = useToast();

  const [jobTitle, setJobTitle] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Status Change & Interview Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplicants = () => {
    setLoading(true);
    api
      .get(`/applications/job/${jobId}`)
      .then((res) => {
        if (res.data.success) {
          setJobTitle(res.data.data.job_title);
          setApplicants(res.data.data.applicants || []);
        }
      })
      .catch((err) => toast.error('Failed to load job applicant pool.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const handleOpenStatusModal = (app, status) => {
    setSelectedApp(app);
    setNewStatus(status);
    setInterviewTime(app.interview_time || '');
    setMeetingLink(app.meeting_link || '');
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdating(true);
    try {
      const payload = {
        status: newStatus,
        scheduled_at: interviewTime || undefined,
        meeting_link: meetingLink || undefined,
      };

      const res = await api.patch(`/applications/${selectedApp.id}/status`, payload);
      if (res.data.success) {
        toast.success(`Candidate status transitioned to ${newStatus}. Notification sent!`);
        setSelectedApp(null);
        fetchApplicants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update candidate status.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = applicants.filter((app) => {
    const matchesFilter = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      app.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Job Openings</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Candidate Pipeline: {jobTitle || 'Opening'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review verified academic cutoffs, technical skill proficiency, and advance qualified candidates.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
          Total Candidates: <span className="text-brand-600 font-bold">{applicants.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll no..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['ALL', 'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No candidates match this criteria"
          description="Check another status filter or wait for students to submit applications."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-bold text-slate-900">{app.student_name}</h3>
                    <Badge variant={app.status}>{app.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Roll No: {app.roll_number} • {app.degree} ({app.department}) • Class of {app.graduation_year}
                  </p>
                  <p className="text-xs text-slate-400">
                    Email: {app.student_email} {app.student_phone && `• Phone: ${app.student_phone}`}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenStatusModal(app, 'UNDER_REVIEW')}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 rounded-xl border border-amber-300 shadow-2xs transition"
                  >
                    Under Review
                  </button>
                  <button
                    onClick={() => handleOpenStatusModal(app, 'SHORTLISTED')}
                    className="px-3.5 py-1.5 text-xs font-bold text-purple-950 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 rounded-xl border border-purple-300 shadow-2xs transition"
                  >
                    Shortlist & Interview
                  </button>
                  <button
                    onClick={() => handleOpenStatusModal(app, 'SELECTED')}
                    className="px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 rounded-xl border border-emerald-300 shadow-2xs transition"
                  >
                    Extend Offer
                  </button>
                  <button
                    onClick={() => handleOpenStatusModal(app, 'REJECTED')}
                    className="px-3.5 py-1.5 text-xs font-bold text-rose-950 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 rounded-xl border border-rose-300 shadow-2xs transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Verified Academic Profile Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Verified CGPA</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {parseFloat(app.cgpa).toFixed(2)} / 10.0
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Active Backlogs</span>
                  <span className={`font-bold ${app.active_backlogs === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {app.active_backlogs}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Applied Date</span>
                  <span className="font-medium text-slate-700">{app.applied_at?.split(' ')[0]}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Resume</span>
                  {app.resume_url ? (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-brand-600 font-semibold hover:underline"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not attached</span>
                  )}
                </div>
              </div>

              {/* Skills Chips */}
              {app.skills && app.skills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Candidate Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {app.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                      >
                        {s.skill_name} <span className="text-[10px] text-slate-400 uppercase">({s.proficiency})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {app.cover_letter && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Candidate Statement:</span>
                  {app.cover_letter}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Update / Interview Scheduling Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={`Update Status: ${selectedApp?.student_name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1 border border-slate-200">
            <p>
              Transitioning candidate to status: <strong>{newStatus}</strong>
            </p>
            <p className="text-slate-500 text-[11px]">
              An automated notification alert will be delivered to the student’s portal.
            </p>
          </div>

          {newStatus === 'SHORTLISTED' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Interview Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abc"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl shadow-sm"
            >
              {updating ? 'Updating...' : 'Confirm Status Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobApplicantsPage;
