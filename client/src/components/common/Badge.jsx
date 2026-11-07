import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    // Application statuses
    APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
    SHORTLISTED: 'bg-purple-50 text-purple-700 border-purple-200',
    SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    // Job Types
    FULL_TIME: 'bg-slate-900 text-slate-100 border-slate-800',
    INTERNSHIP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PART_TIME: 'bg-teal-50 text-teal-700 border-teal-200',
    CONTRACT: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const selectedClass = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
