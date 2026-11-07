import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, ArrowRight, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'RECRUITER') return '/recruiter';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition">
              Campus<span className="text-brand-600">Hire</span>
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 -mt-1">
              Smart Placement Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-slate-700">
          <Link to="/" className="hover:text-brand-600 transition">
            Home
          </Link>
          <Link to="/jobs" className="hover:text-brand-600 transition">
            Browse Openings
          </Link>
          <a href="/#how-it-works" className="hover:text-brand-600 transition">
            How It Works
          </a>
          <a href="/#benefits" className="hover:text-brand-600 transition">
            Benefits
          </a>
        </nav>

        {/* Auth CTA Actions (Desktop) */}
        <div className="hidden sm:flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-transparent hover:border-slate-200"
              >
                Log In
              </Link>
              <div className="relative group">
                <button className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition">
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block transition z-50">
                  <Link
                    to="/register/student"
                    className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    As Student Candidate
                  </Link>
                  <Link
                    to="/register/recruiter"
                    className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    As Hiring Recruiter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Home
          </Link>
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Browse Openings
          </Link>
          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </a>
          <a
            href="/#benefits"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Benefits
          </a>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-xl"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 px-4 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-slate-800 bg-slate-100 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-brand-600 rounded-xl shadow-xs"
                >
                  Register as Student
                </Link>
                <Link
                  to="/register/recruiter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-4 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  Register as Recruiter
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
