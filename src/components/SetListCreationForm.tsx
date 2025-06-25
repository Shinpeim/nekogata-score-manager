import React, { useState, useRef, useEffect } from 'react';
import { useSetListManagement } from '../hooks/useSetListManagement';

interface SetListCreationFormProps {
  chartIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const SetListCreationForm: React.FC<SetListCreationFormProps> = ({
  chartIds,
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createNewSetList } = useSetListManagement();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      await createNewSetList({
        name: name.trim(),
        chartIds: chartIds
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create setlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          セットリスト作成
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="setlist-name" className="block text-sm font-medium text-slate-700 mb-2">
              セットリスト名
            </label>
            <input
              ref={inputRef}
              id="setlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例: Live Set 2024-06"
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7] focus:border-transparent"
              data-testid="setlist-name-input"
              disabled={isCreating}
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">
              {chartIds.length}曲を含むセットリストを作成します
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              data-testid="cancel-create-setlist"
              disabled={isCreating}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#85B0B7] hover:bg-[#6B9CA5] text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-create-setlist"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetListCreationForm;