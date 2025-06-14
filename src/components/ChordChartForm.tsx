import React, { useState } from 'react';
import type { ChordChart } from '../types';
import { 
  createNewChordChart, 
  validateChordChart, 
  COMMON_KEYS, 
  COMMON_TIME_SIGNATURES
} from '../utils/chordUtils';

interface ChordChartFormProps {
  initialData?: Partial<ChordChart>;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}

const ChordChartForm: React.FC<ChordChartFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '新しいコード譜',
    artist: initialData?.artist || '',
    key: initialData?.key || 'C',
    tempo: initialData?.tempo || 120,
    timeSignature: initialData?.timeSignature || '4/4',
    tags: initialData?.tags?.join(', ') || '',
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const chartData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      sections: initialData?.sections
    };

    const validationErrors = validateChordChart(chartData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newChart = createNewChordChart(chartData);
    onSave(newChart);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {initialData?.id ? 'コード譜を編集' : '新しいコード譜を作成'}
        </h2>

        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-2">エラーがあります:</h3>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" role="form">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="楽曲のタイトル"
              />
            </div>

            <div>
              <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
                アーティスト
              </label>
              <input
                id="artist"
                type="text"
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="アーティスト名"
              />
            </div>

            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-2">
                キー *
              </label>
              <select
                id="key"
                value={formData.key}
                onChange={(e) => handleChange('key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_KEYS.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tempo" className="block text-sm font-medium text-gray-700 mb-2">
                テンポ (BPM)
              </label>
              <input
                id="tempo"
                type="number"
                value={formData.tempo}
                onChange={(e) => handleChange('tempo', parseInt(e.target.value) || 120)}
                min="40"
                max="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="timeSignature" className="block text-sm font-medium text-gray-700 mb-2">
                拍子 *
              </label>
              <select
                id="timeSignature"
                value={formData.timeSignature}
                onChange={(e) => handleChange('timeSignature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_TIME_SIGNATURES.map(sig => (
                  <option key={sig} value={sig}>{sig}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                タグ (カンマ区切り)
              </label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: ポップス, バラード"
              />
            </div>
          </div>

          {/* メモ */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="楽曲に関するメモや注意点"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {initialData?.id ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChordChartForm;