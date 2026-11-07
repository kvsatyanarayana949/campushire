import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Briefcase, ArrowLeft, Plus, X, Award, CheckCircle } from 'lucide-react';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'FULL_TIME',
    location: 'Bengaluru, India',
    salary_range: '₹10,00,000 - ₹14,00,000 PA',
    min_cgpa: '7.00',
    max_backlogs: '0',
    eligible_graduation_year: '2026',
    eligible_degrees: 'B.Tech,M.Tech,MCA',
    eligible_departments: 'Computer Science & Engineering,Information Technology',
    deadline: '2026-12-31',
  });

  const [skills, setSkills] = useState(['React', 'Node.js', 'MySQL']);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (skills.length === 0) {
      toast.warning('Please specify at least one required technical skill.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        min_cgpa: parseFloat(formData.min_cgpa || 0),
        max_backlogs: parseInt(formData.max_backlogs || 0, 10),
        eligible_graduation_year: formData.eligible_graduation_year
          ? parseInt(formData.eligible_graduation_year, 10)
          : null,
        required_skills: skills.join(','),
      };

      const res = await api.post('/jobs', payload);
      if (res.data.success) {
        toast.success('Campus job opening published successfully!');
        navigate('/recruiter/jobs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish job opening.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Job Drives</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Publish Campus Recruitment Opening</h1>
        <p className="text-xs text-slate-500 mt-1">
          Specify role expectations, compensation, and mandatory academic cutoff thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Job Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900">1. Position Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Position / Job Title *</label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Associate Full Stack Engineer"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Employment Type *</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Drive / Job Location *</label>
              <input
                type="text"
                required
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bengaluru, India (Hybrid)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Salary / Stipend Range *</label>
              <input
                type="text"
                required
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g. ₹12,00,000 - ₹16,00,000 PA"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Application Deadline *</label>
              <input
                type="date"
                required
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Comprehensive Role Description *</label>
              <textarea
                rows={4}
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Outline core responsibilities, team structure, and technologies used..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Academic Eligibility Criteria */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 text-brand-600">
            <Award className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">2. Academic Eligibility Engine Cutoffs</h3>
          </div>
          <p className="text-xs text-slate-500">
            The backend engine strictly filters student candidates based on these parameters upon application.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Minimum CGPA Threshold *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                name="min_cgpa"
                value={formData.min_cgpa}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Max Permitted Backlogs *</label>
              <input
                type="number"
                min="0"
                max="20"
                required
                name="max_backlogs"
                value={formData.max_backlogs}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Graduation Batch</label>
              <select
                name="eligible_graduation_year"
                value={formData.eligible_graduation_year}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">Any Graduation Batch</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700">Eligible Degrees (Comma separated)</label>
              <input
                type="text"
                name="eligible_degrees"
                value={formData.eligible_degrees}
                onChange={handleChange}
                placeholder="e.g. B.Tech,M.Tech,MCA"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700">Eligible Departments</label>
              <input
                type="text"
                name="eligible_departments"
                value={formData.eligible_departments}
                onChange={handleChange}
                placeholder="e.g. Computer Science & Engineering,Information Technology or All Departments"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Required Technical Skills */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">3. Required Technical Skills</h3>
          <p className="text-xs text-slate-500">
            Candidates missing any of these required skills will be flagged as ineligible by the backend engine.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="e.g. Docker, Python, React..."
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Add Skill
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/recruiter/jobs"
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm transition"
          >
            {loading ? 'Publishing Drive...' : 'Publish Campus Drive'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPage;
