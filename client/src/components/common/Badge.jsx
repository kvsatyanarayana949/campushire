import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-300',
    primary: 'bg-sky-100 text-sky-900 border-sky-300 font-semibold',
    success: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
    warning: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    danger: 'bg-rose-100 text-rose-950 border-rose-300 font-semibold',
    purple: 'bg-purple-100 text-purple-900 border-purple-300 font-semibold',
    
    // Application statuses
    APPLIED: 'bg-blue-100 text-blue-900 border-blue-300 font-semibold',
    UNDER_REVIEW: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    SHORTLISTED: 'bg-purple-100 text-purple-900 border-purple-300 font-semibold',
    SELECTED: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-semibold',
    REJECTED: 'bg-rose-100 text-rose-950 border-rose-300 font-semibold',
    
    // Job Types
    FULL_TIME: 'bg-slate-900 text-white border-slate-800 font-semibold',
    INTERNSHIP: 'bg-indigo-100 text-indigo-950 border-indigo-300 font-semibold',
    PART_TIME: 'bg-teal-100 text-teal-950 border-teal-300 font-semibold',
    CONTRACT: 'bg-orange-100 text-orange-950 border-orange-300 font-semibold',
  };

  const selectedClass = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${selectedClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
