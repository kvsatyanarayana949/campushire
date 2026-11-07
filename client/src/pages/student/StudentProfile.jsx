import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Award, BookOpen, Cpu, Plus, X, Save, ShieldCheck } from 'lucide-react';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

const StudentProfile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    degree: 'B.Tech',
    department: 'Computer Science & Engineering',
    cgpa: '',
    active_backlogs: 0,
    graduation_year: 2026,
    phone: '',
    resume_url: '',
    bio: '',
  });

  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('INTERMEDIATE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/students/profile')
      .then((res) => {
        if (res.data.success) {
          const p = res.data.data;
          setFormData({
            name: p.name || user?.name || '',
            roll_number: p.roll_number || '',
            degree: p.degree || 'B.Tech',
            department: p.department || 'Computer Science & Engineering',
            cgpa: p.cgpa !== undefined ? p.cgpa : '',
            active_backlogs: p.active_backlogs !== undefined ? p.active_backlogs : 0,
            graduation_year: p.graduation_year || 2026,
            phone: p.phone || '',
            resume_url: p.resume_url || '',
            bio: p.bio || '',
          });
          setSkills(p.skills || []);
        }
      })
      .catch((err) => toast.error('Failed to load profile details.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (trimmed) {
      if (!skills.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) {
        setSkills([...skills, { skill_name: trimmed, proficiency: newSkillProficiency }]);
        setNewSkillName('');
      } else {
        toast.warning('Skill already listed in your profile.');
      }
    }
  };

  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter((s) => s.skill_name !== skillName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        cgpa: parseFloat(formData.cgpa || 0),
        active_backlogs: parseInt(formData.active_backlogs || 0, 10),
        graduation_year: parseInt(formData.graduation_year || 2026, 10),
        skills,
      };

      const res = await api.put('/students/profile', payload);
      if (res.data.success) {
        toast.success('Your student profile was updated successfully.');
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile & Academic Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Maintain accurate academic records and skills. The backend eligibility engine verifies these records for all job applications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic Records Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 text-brand-600">
            <Award className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Academic & Institutional Records</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Roll / Registration Number</label>
              <input
                type="text"
                name="roll_number"
                value={formData.roll_number}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Degree</label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc Computer Science</option>
                <option value="B.E">B.E</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Electrical & Electronics">Electrical & Electronics</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Cumulative CGPA (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Active Backlogs Count</label>
              <input
                type="number"
                min="0"
                max="20"
                name="active_backlogs"
                value={formData.active_backlogs}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Graduation Year</label>
              <select
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Resume Link (Google Drive / GitHub / PDF)</label>
              <input
                type="url"
                name="resume_url"
                value={formData.resume_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/your-verified-resume.pdf"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Candidate Professional Bio</label>
              <textarea
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Summarize your engineering interests, key internships, or core projects..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Technical Skills Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-brand-600">
            <Cpu className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Technical Skills & Competencies</h3>
          </div>
          <p className="text-xs text-slate-500">
            These technical skills are matched against job requirements to calculate your eligibility score.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="e.g. AWS, React, Python, Docker..."
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Add Skill
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-medium border border-slate-200"
              >
                <span className="font-semibold">{s.skill_name}</span>
                <span className="text-[10px] text-slate-500 uppercase">({s.proficiency})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s.skill_name)}
                  className="text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-xl shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
