import React from 'react';
import Modal from './Modal';

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const PrinterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 6,2 18,2 18,9"/>
    <path d="M6,18H4A2,2 0 0,1 2,16V11A2,2 0 0,1 4,9H20A2,2 0 0,1 22,11V16A2,2 0 0,1 20,18H18"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ReportModal = ({ isOpen, onClose, title, reportData, exportCSV, exportPDF }) => {
  if (!isOpen || !reportData) return null;

  const formatReportData = (data) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Report Summary */}
        <div className="p-4 rounded-xl border border-white-10" 
             style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 className="text-white font-semibold mb-3">Report Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white-60">Period</p>
              <p className="text-white" style={{ textTransform: 'capitalize' }}>{reportData.period}</p>
            </div>
            <div>
              <p className="text-white-60">Generated</p>
              <p className="text-white">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-white-60">False Positive Alerts</p>
              <p className="text-white font-semibold">{reportData.falsePositiveAlerts || 0}</p>
            </div>
            <div>
              <p className="text-white-60">Blocked Attempts</p>
              <p className="text-white font-semibold">{reportData.falsePositiveBlocked || 0}</p>
            </div>
          </div>
        </div>

        {/* Report Data Preview */}
        <div className="p-4 rounded-xl border border-white-10" 
             style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">Data Preview</h4>
            <div className="text-white-60">
              <EyeIcon />
            </div>
          </div>
          <pre
            className="p-4 rounded-lg overflow-auto text-xs font-mono text-white-80 custom-scrollbar"
            style={{
              background: 'rgba(0,0,0,0.35)',
              maxHeight: '380px',
              width: '100%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'hidden'
            }}
          >
            {formatReportData(reportData)}
          </pre>
        </div>

        {/* Export Actions */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Export Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className="btn btn-outline btn-md flex items-center justify-center space-x-2"
              onClick={() => window.print()}
            >
              <PrinterIcon />
              <span>Print</span>
            </button>
            
            <button
              className="btn btn-success btn-md flex items-center justify-center space-x-2"
              onClick={() => exportCSV(reportData)}
            >
              <DownloadIcon />
              <span>CSV</span>
            </button>
            
            <button
              className="btn btn-danger btn-md flex items-center justify-center space-x-2"
              onClick={() => exportPDF(reportData)}
            >
              <FileTextIcon />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="p-4 rounded-xl border" 
             style={{ 
               background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
               border: '1px solid rgba(59, 130, 246, 0.2)'
             }}>
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <div className="text-blue-400">
                <FileTextIcon />
              </div>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Report Information</p>
              <p className="text-white-60 text-xs mt-1">
                This report contains security analytics data for the selected time period. 
                Data is automatically filtered to show potential false positives for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;