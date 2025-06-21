import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 px-4 py-3">
      <div className="flex justify-center items-center gap-2 text-xs text-slate-500">
        <div className="flex gap-4">
          <a
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-700 transition-colors"
          >
            プライバシーポリシー
          </a>
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-700 transition-colors"
          >
            利用規約
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;