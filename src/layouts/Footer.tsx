import React, { useState } from 'react';
import LegalDocumentDialog from '../components/LegalDocumentDialog';

const Footer: React.FC = () => {
  const [legalDocumentOpen, setLegalDocumentOpen] = useState(false);
  const [legalDocumentType, setLegalDocumentType] = useState<'privacy' | 'terms'>('privacy');

  return (
    <>
      <footer className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Nekogata Score Manager
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setLegalDocumentType('privacy');
                setLegalDocumentOpen(true);
              }}
              className="hover:text-slate-700 transition-colors"
            >
              プライバシーポリシー
            </button>
            <button
              onClick={() => {
                setLegalDocumentType('terms');
                setLegalDocumentOpen(true);
              }}
              className="hover:text-slate-700 transition-colors"
            >
              利用規約
            </button>
          </div>
        </div>
      </footer>
      
      <LegalDocumentDialog
        isOpen={legalDocumentOpen}
        onClose={() => setLegalDocumentOpen(false)}
        documentType={legalDocumentType}
      />
    </>
  );
};

export default Footer;