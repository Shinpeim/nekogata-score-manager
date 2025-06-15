import React from 'react';
import { KEY_DISPLAY_NAMES } from '../utils/chordUtils';

interface TransposeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transposeChords: boolean) => void;
  fromKey: string;
  toKey: string;
}

const TransposeConfirmDialog: React.FC<TransposeConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromKey,
  toKey
}) => {
  if (!isOpen) return null;

  const handleKeyOnlyClick = () => {
    onConfirm(false);
  };

  const handleTransposeClick = () => {
    onConfirm(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          キーの変更
        </h3>
        
        <div className="mb-6">
          <p className="text-slate-700 mb-2">
            キーを <span className="font-medium">{KEY_DISPLAY_NAMES[fromKey] || fromKey}</span> から{' '}
            <span className="font-medium">{KEY_DISPLAY_NAMES[toKey] || toKey}</span> に変更します。
          </p>
          <p className="text-slate-600">
            コードも一緒に移調しますか？
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleTransposeClick}
            className="w-full px-4 py-2 bg-[#85B0B7] hover:bg-[#6B9CA5] text-white rounded-md font-medium transition-colors"
          >
            はい、コードも一緒に移調する
          </button>
          
          <button
            onClick={handleKeyOnlyClick}
            className="w-full px-4 py-2 bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 rounded-md font-medium transition-colors"
          >
            いいえ、キーのみ変更する
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransposeConfirmDialog;