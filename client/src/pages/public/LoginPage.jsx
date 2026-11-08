import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Lock, Mail, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const redirectUrl = searchParams.get('redirect') || '';
  const sessionExpired = searchParams.get('session_expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (result.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (result.user.role === 'RECRUITER') {
        navigate('/recruiter');
      } else {
        navigate('/student');
      }
    } else {
      setFormError(result.message || 'Invalid email or password.');
    }
  };

  // Demo account quick fill
  const fillDemoAccount = (demoEmail, demoPassword = 'Password@123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Campus<span className="text-brand-600">Hire</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 pt-2">Sign in to your account</h2>
          <p className="text-xs text-slate-500">
            Access your university placement portal, job applications, or recruiter hub.
          </p>
        </div>

        {sessionExpired && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            Your previous session has expired. Please sign in again to continue.
          </div>
        )}

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {formError}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu or company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 rounded-xl shadow-md shadow-sky-600/25 transition-all"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              One-Click Role Demonstration Accounts
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => fillDemoAccount('rohit.verma@student.edu')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Student: Rohit Verma</span>
                  <span className="text-[10px] text-slate-500">CGPA 8.75 • Computer Science • 2026 Batch</span>
                </div>
                <span className="text-[10px] font-bold text-brand-600 uppercase">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('priya.sharma@nexuscloud.com')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Recruiter: Priya Sharma</span>
                  <span className="text-[10px] text-slate-500">NexusCloud Technologies • Talent Acquisition</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@campushire.io')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Administrator: System Admin</span>
                  <span className="text-[10px] text-slate-500">Campus Placement Cell Director • Full Access</span>
                </div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">Fill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          New to CampusHire?{' '}
          <Link to="/register/student" className="font-semibold text-brand-600 hover:underline">
            Register as Student
          </Link>{' '}
          or{' '}
          <Link to="/register/recruiter" className="font-semibold text-brand-600 hover:underline">
            Register as Recruiter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
