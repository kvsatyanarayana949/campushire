import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../../api/axios';
import { CheckCircle2, XCircle, AlertCircle, Award, BookOpen, Cpu, ArrowRight } from 'lucide-react';

const EligibilityModal = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onApplyClick,
  hasApplied = false,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      setError(null);
      api
        .get(`/jobs/${jobId}/eligibility`)
        .then((res) => {
          setData(res.data.data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Could not verify eligibility.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, jobId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Eligibility Audit: ${jobTitle || 'Job Position'}`}
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Checking criteria against your student profile...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-5 rounded-2xl border flex items-start space-x-4 ${
              data.isEligible
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {data.isEligible ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-600" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold">
                {data.isEligible ? 'You Are Eligible to Apply' : 'Currently Not Eligible'}
              </h4>
              <p className="text-sm mt-1 opacity-90 leading-relaxed">{data.summary}</p>
            </div>
          </div>

          {/* Academic Criteria Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-brand-600" />
                <span>CGPA Requirement</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-slate-900">{data.studentCgpa.toFixed(2)}</span>
                <span className="text-xs text-slate-500">/ min {data.minCgpa.toFixed(2)}</span>
              </div>
              <p className={`text-xs mt-1 font-medium ${data.studentCgpa >= data.minCgpa ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.studentCgpa >= data.minCgpa ? '✓ Satisfied' : '✕ Below cutoff'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>Active Backlogs</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-slate-900">{data.studentBacklogs}</span>
                <span className="text-xs text-slate-500">/ max {data.maxBacklogs}</span>
              </div>
              <p className={`text-xs mt-1 font-medium ${data.studentBacklogs <= data.maxBacklogs ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.studentBacklogs <= data.maxBacklogs ? '✓ Satisfied' : '✕ Exceeds limit'}
              </p>
            </div>
          </div>

          {/* Technical Skills Matching Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Technical Skills Match</h5>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Matched Required Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.matchedSkills && data.matchedSkills.length > 0 ? (
                    data.matchedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skills matched yet</span>
                  )}
                </div>
              </div>

              {data.missingSkills && data.missingSkills.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-xs font-medium text-slate-500 mb-2">Missing Skills from Profile:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.missingSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-100 text-rose-800"
                      >
                        ✕ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unmet Criteria Reasons List */}
          {!data.isEligible && data.reasons && data.reasons.length > 0 && (
            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                Unsatisfied Requirements ({data.reasons.length})
              </h5>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                {data.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>
            {data.isEligible && !hasApplied && onApplyClick && (
              <button
                onClick={() => {
                  onClose();
                  onApplyClick();
                }}
                className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
              >
                <span>Proceed to Apply</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default EligibilityModal;
