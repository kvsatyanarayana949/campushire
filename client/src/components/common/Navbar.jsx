import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, ArrowRight, User, LogOut, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'RECRUITER') return '/recruiter';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition">
              Campus<span className="text-brand-600">Hire</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 -mt-1">
              Smart Placement Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-brand-600 transition">
            Home
          </Link>
          <Link to="/jobs" className="hover:text-brand-600 transition">
            Browse Openings
          </Link>
          <a href="#how-it-works" className="hover:text-brand-600 transition">
            How It Works
          </a>
          <a href="#benefits" className="hover:text-brand-600 transition">
            Benefits
          </a>
        </nav>

        {/* Auth CTA Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                Log In
              </Link>
              <div className="relative group">
                <button className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition">
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 hidden group-hover:block transition animate-fade-in z-50">
                  <Link
                    to="/register/student"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    As Student Candidate
                  </Link>
                  <Link
                    to="/register/recruiter"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    As Hiring Recruiter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
