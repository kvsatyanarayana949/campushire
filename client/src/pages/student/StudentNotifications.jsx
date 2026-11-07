import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Bell, CheckCheck, Clock, Award, Video, FileText, Check } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = () => {
    setLoading(true);
    api
      .get('/notifications')
      .then((res) => {
        if (res.data.success) {
          setNotifications(res.data.data.notifications || []);
        }
      })
      .catch((err) => toast.error('Failed to load notifications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'APPLICATION_STATUS':
        return <Award className="w-5 h-5 text-brand-600" />;
      case 'INTERVIEW':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'JOB_ALERT':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding application evaluations, status transitions, and interviews.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <CheckCheck className="w-4 h-4 text-brand-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications right now"
          description="When recruiters update your application or schedule interviews, alerts will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 flex items-start justify-between gap-4 transition ${
                !item.is_read ? 'bg-brand-50/30' : 'bg-white'
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className="p-2.5 rounded-2xl bg-slate-100 shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {item.created_at?.replace('T', ' ').slice(0, 16) || 'Recently'}
                  </p>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
