import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse space-y-4">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
      </div>
    </div>
    <div className="space-y-2 py-2">
      <div className="h-3 bg-slate-100 rounded w-full"></div>
      <div className="h-3 bg-slate-100 rounded w-4/5"></div>
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
      <div className="h-4 bg-slate-200 rounded w-20"></div>
      <div className="h-8 bg-slate-200 rounded w-24"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 flex items-center px-6 space-x-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/6"></div>
          <div className="h-4 bg-slate-100 rounded w-1/6"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
          <div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
        <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

export default CardSkeleton;
