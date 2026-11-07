import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, Award, ExternalLink, Mail, Phone, Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const StudentsDirectoryPage = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');
  const [skill, setSkill] = useState('');

  const fetchStudents = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 10,
      search: search || undefined,
      department: department || undefined,
      min_cgpa: minCgpa || undefined,
      max_backlogs: maxBacklogs || undefined,
      skill: skill || undefined,
    };

    api
      .get('/students', { params })
      .then((res) => {
        if (res.data.success) {
          setStudents(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => toast.error('Failed to load students directory.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents(1);
  }, [department, minCgpa, maxBacklogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">University Candidate Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore enrolled candidate talent pools filtered by academic achievement and verified technical competencies.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, roll number, or email..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Search Candidates
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Departments</option>
            <option value="Computer Science & Engineering">Computer Science</option>
            <option value="Information Technology">Information Tech</option>
            <option value="Electronics & Communication">Electronics & Comm</option>
          </select>

          <select
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Any CGPA</option>
            <option value="7.0">CGPA ≥ 7.0</option>
            <option value="8.0">CGPA ≥ 8.0</option>
            <option value="9.0">CGPA ≥ 9.0</option>
          </select>

          <select
            value={maxBacklogs}
            onChange={(e) => setMaxBacklogs(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Backlogs Filter</option>
            <option value="0">Zero Active Backlogs</option>
            <option value="1">Max 1 Backlog</option>
          </select>

          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (e.g. React, Python)"
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          />
        </div>
      </div>

      {/* Candidates Cards */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Try relaxing your filters or searching with another keyword."
        />
      ) : (
        <div className="space-y-4">
          {students.map((st) => (
            <div
              key={st.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{st.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Roll No: {st.roll_number} • {st.degree} in {st.department} • Batch {st.graduation_year}
                  </p>
                  <p className="text-xs text-slate-400">{st.email}</p>
                </div>

                <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-xs shrink-0">
                  <div>
                    <span className="text-slate-400 block font-medium">CGPA</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {parseFloat(st.cgpa).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-400 block font-medium">Backlogs</span>
                    <span className={`text-base font-extrabold ${st.active_backlogs === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {st.active_backlogs}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              {st.skills && st.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {st.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                    >
                      {s.skill_name} <span className="text-[10px] text-slate-400">({s.proficiency})</span>
                    </span>
                  ))}
                </div>
              )}

              {st.resume_url && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={st.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    <span>View Academic CV / Resume</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsDirectoryPage;
