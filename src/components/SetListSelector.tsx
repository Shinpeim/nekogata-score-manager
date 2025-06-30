import React, { useState } from 'react';
import { useSetListManagement } from '../hooks/useSetListManagement';

const SetListSelector: React.FC = () => {
  const { setLists, currentSetListId, setCurrentSetList, deleteSetList } = useSetListManagement();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const setListArray = Object.values(setLists).sort((a, b) => 
    a.name.localeCompare(b.name, 'ja', { numeric: true })
  );

  const currentSetList = currentSetListId ? setLists[currentSetListId] : null;

  const handleSetListSelect = (setListId: string | null) => {
    setCurrentSetList(setListId);
    setShowDropdown(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, setListId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(setListId);
  };

  const handleDeleteConfirm = async (setListId: string) => {
    await deleteSetList(setListId);
    setShowDeleteConfirm(null);
    setShowDropdown(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-3 py-2 bg-white hover:bg-slate-50 rounded-md border border-slate-300 hover:border-slate-400 text-left flex items-center justify-between transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#85B0B7] focus:border-[#85B0B7]"
        data-testid="setlist-selector-button"
      >
        <div className="flex-1">
          {currentSetList ? (
            <div>
              <div className="text-sm font-medium text-slate-900">
                {currentSetList.name}
              </div>
              <div className="text-xs text-slate-500">
                ({currentSetList.chartIds.length}曲)
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              セットリストを選択
            </div>
          )}
        </div>
        <div className="pointer-events-none">
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
            <div 
              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
              onClick={() => handleSetListSelect(null)}
              data-testid="setlist-option-none"
            >
              <div className="text-sm text-slate-500">
                (セットリストなし)
              </div>
            </div>
            
            {setListArray.map((setList) => (
              <div
                key={setList.id}
                className={`p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                  currentSetListId === setList.id ? 'bg-slate-100' : ''
                }`}
                onClick={() => handleSetListSelect(setList.id)}
                data-testid={`setlist-option-${setList.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {currentSetListId === setList.id && (
                      <span className="text-[#85B0B7]">✓</span>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {setList.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ({setList.chartIds.length}曲)
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(e, setList.id)}
                  className="ml-2 p-1 text-slate-400 hover:text-[#EE5840] hover:bg-slate-100 rounded transition-colors"
                  data-testid={`delete-setlist-${setList.id}`}
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {setListArray.length === 0 && (
              <div className="p-3 text-sm text-slate-400 text-center">
                セットリストがありません
              </div>
            )}
          </div>
        </>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              セットリストを削除
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              「{setLists[showDeleteConfirm]?.name}」を削除しますか？
              この操作は取り消せません。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
                data-testid="cancel-delete-setlist"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="px-3 py-2 bg-[#EE5840] hover:bg-[#D14A2E] text-white text-sm rounded"
                data-testid="confirm-delete-setlist"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetListSelector;