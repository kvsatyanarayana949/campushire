import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building, User, Save, Globe, MapPin } from 'lucide-react';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

const RecruiterProfile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phone: '',
    company_name: '',
    company_website: '',
    company_location: '',
    company_industry: '',
    company_description: '',
    company_logo: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/recruiters/profile')
      .then((res) => {
        if (res.data.success) {
          const p = res.data.data;
          setFormData({
            name: p.recruiter_name || user?.name || '',
            designation: p.designation || '',
            phone: p.phone || '',
            company_name: p.company_name || '',
            company_website: p.company_website || '',
            company_location: p.company_location || '',
            company_industry: p.company_industry || '',
            company_description: p.company_description || '',
            company_logo: p.company_logo || '',
          });
        }
      })
      .catch((err) => toast.error('Failed to load recruiter profile.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/recruiters/profile', formData);
      if (res.data.success) {
        toast.success('Company and recruiter profile updated successfully.');
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update recruiter profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enterprise & Recruiter Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Update your hiring organization branding, contact details, and headquarters location.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recruiter Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <User className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Recruiter Contact Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Designation / Title</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Phone Contact</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Company Organization Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Building className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Organization Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Headquarters Location</label>
              <input
                type="text"
                name="company_location"
                value={formData.company_location}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Industry Sector</label>
              <input
                type="text"
                name="company_industry"
                value={formData.company_industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Company Website</label>
              <input
                type="url"
                name="company_website"
                value={formData.company_website}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Logo Image URL</label>
              <input
                type="url"
                name="company_logo"
                value={formData.company_logo}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Company Overview</label>
              <textarea
                rows={3}
                name="company_description"
                value={formData.company_description}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterProfile;
