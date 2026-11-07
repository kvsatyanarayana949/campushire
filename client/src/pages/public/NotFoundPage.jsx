import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <span className="text-7xl font-extrabold text-brand-600 block">404</span>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          The page or university placement resource you requested does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-brand-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
          >
            <span>Browse Jobs</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
