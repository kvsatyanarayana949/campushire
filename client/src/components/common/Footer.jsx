import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Campus<span className="text-brand-600">Hire</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Modern full-stack university placement and recruitment automation platform connecting ambitious students with premier technology enterprises.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified university eligibility and PCI/RBAC security standards</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/jobs" className="hover:text-brand-600 transition">
                  Verified Job Openings
                </Link>
              </li>
              <li>
                <Link to="/register/student" className="hover:text-brand-600 transition">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/register/recruiter" className="hover:text-brand-600 transition">
                  Recruiter Sign Up
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 transition">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Engineering
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>React 18 + Vite</li>
              <li>Node.js + Express.js REST</li>
              <li>MySQL 8 Relational DB</li>
              <li>JWT & Role-Based Access</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CampusHire Platform. Built for recruitment excellence.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Production Full-Stack Demonstration</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
