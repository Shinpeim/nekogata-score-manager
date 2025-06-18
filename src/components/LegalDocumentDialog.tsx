import React from 'react';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../data/legalDocuments';

interface LegalDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'privacy' | 'terms';
}

const LegalDocumentDialog: React.FC<LegalDocumentDialogProps> = ({
  isOpen,
  onClose,
  documentType
}) => {
  if (!isOpen) return null;

  const content = documentType === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const title = documentType === 'privacy' ? 'プライバシーポリシー' : '利用規約';

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-slate-900 mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-semibold text-slate-800 mt-6 mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith('- **') && line.includes('**:')) {
        const [, boldPart, rest] = line.match(/^- \*\*(.*?)\*\*:\s*(.*)$/) || [];
        if (boldPart && rest) {
          return (
            <li key={index} className="mb-1">
              <span className="font-semibold">{boldPart}</span>: {rest}
            </li>
          );
        }
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="mb-1">{line.slice(2)}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-slate-800 mt-4 mb-2">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-slate-200" />;
      }
      if (line.trim() === '') {
        return <div key={index} className="mb-2"></div>;
      }
      return <p key={index} className="mb-2 text-slate-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-slate max-w-none">
            {formatContent(content)}
          </div>
        </div>
        
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#85B0B7] hover:bg-[#6B9CA5] text-white rounded-md font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentDialog;