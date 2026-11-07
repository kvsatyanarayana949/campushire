import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Bell,
  PlusCircle,
  Users,
  Building2,
  BarChart3,
  LogOut,
} from 'lucide-react';

const Sidebar = ({ unreadNotifications = 0, isOpen = true, onClose = () => {} }) => {
  const { user, logout, isStudent, isRecruiter } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { label: 'Overview', to: '/student', icon: LayoutDashboard, end: true },
    { label: 'Verified Jobs', to: '/jobs', icon: Briefcase, end: false },
    { label: 'My Applications', to: '/student/applications', icon: FileText, end: true },
    { label: 'Profile & Skills', to: '/student/profile', icon: User, end: true },
    {
      label: 'Notifications',
      to: '/student/notifications',
      icon: Bell,
      end: true,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
    },
  ];

  const recruiterLinks = [
    { label: 'Overview', to: '/recruiter', icon: LayoutDashboard, end: true },
    { label: 'Publish Job', to: '/recruiter/jobs/new', icon: PlusCircle, end: true },
    { label: 'Manage Jobs', to: '/recruiter/jobs', icon: Briefcase, end: false },
    { label: 'Company Profile', to: '/recruiter/profile', icon: Building2, end: true },
    { label: 'Students Directory', to: '/recruiter/students', icon: Users, end: true },
  ];

  const adminLinks = [
    { label: 'Placement Analytics', to: '/admin', icon: BarChart3, end: true },
    { label: 'User Directory', to: '/admin/users', icon: Users, end: true },
    { label: 'All Job Postings', to: '/admin/jobs', icon: Briefcase, end: true },
    { label: 'Applications Pool', to: '/admin/applications', icon: FileText, end: true },
  ];

  const navLinks = isStudent ? studentLinks : isRecruiter ? recruiterLinks : adminLinks;

  const isLinkActive = (to, end) => {
    const currentPath = location.pathname;

    // Direct exact match
    if (currentPath === to) {
      return true;
    }

    // Special isolation for recruiter job routes:
    // "Publish Job" (/recruiter/jobs/new) must only be active on /recruiter/jobs/new
    if (to === '/recruiter/jobs/new') {
      return currentPath === '/recruiter/jobs/new';
    }

    // "Manage Jobs" (/recruiter/jobs) must NEVER match /recruiter/jobs/new
    if (to === '/recruiter/jobs') {
      if (currentPath === '/recruiter/jobs/new') {
        return false;
      }
      return currentPath === '/recruiter/jobs' || currentPath.startsWith('/recruiter/jobs/');
    }

    // If explicit end matching requested (like root dashboards)
    if (end) {
      return currentPath === to;
    }

    return currentPath.startsWith(to + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                Campus<span className="text-brand-400">Hire</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 -mt-1">
                {isStudent ? 'Student Portal' : isRecruiter ? 'Recruiter Hub' : 'Admin Console'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Navigation
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                aria-current={isLinkActive(item.to, item.end) ? 'page' : undefined}
                className={() => {
                  const active = isLinkActive(item.to, item.end);
                  return `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`;
                }}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-brand-500 text-white rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-semibold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <span className="inline-block text-[10px] font-medium text-brand-400 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
