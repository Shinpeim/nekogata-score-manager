import React from 'react';
import type { SyncConflict } from '../../types/sync';

interface ConflictWarningDialogProps {
  isOpen: boolean;
  conflicts: SyncConflict[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConflictWarningDialog: React.FC<ConflictWarningDialogProps> = ({
  isOpen,
  conflicts,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">同期コンフリクトの警告</h2>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-slate-700 mb-4">
            以下のコード譜で変更が競合しています。続行すると、より新しい変更で上書きされます。
          </p>
          
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.localChart.id} className="border border-slate-200 rounded-md p-3">
                <h3 className="font-medium text-slate-900 mb-2">
                  {conflict.localChart.title}
                </h3>
                
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>ローカル変更:</span>
                    <span>{new Date(conflict.localMetadata.lastModifiedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>リモート変更:</span>
                    <span>{new Date(conflict.remoteMetadata.lastModifiedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>デバイス:</span>
                    <span className="font-mono text-[10px]">
                      {conflict.remoteMetadata.deviceId.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs">
                  {new Date(conflict.localMetadata.lastModifiedAt) > 
                   new Date(conflict.remoteMetadata.lastModifiedAt) ? (
                    <span className="text-[#85B0B7] font-medium">
                      → ローカルの変更が採用されます
                    </span>
                  ) : (
                    <span className="text-[#EE5840] font-medium">
                      → リモートの変更で上書きされます
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[#EE5840] hover:bg-[#D14A2E] rounded-md transition-colors"
          >
            上書きして続行
          </button>
        </div>
      </div>
    </div>
  );
};