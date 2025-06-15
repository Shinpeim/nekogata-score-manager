import React, { useState, useEffect } from 'react';
import type { ChordChart } from '../types';
import BasicInfoEditor from './BasicInfoEditor';
import SectionEditor from './SectionEditor';
import { validateChartInputs } from '../utils/chordValidation';

interface ChordChartEditorProps {
  chart: ChordChart;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}


const ChordChartEditor: React.FC<ChordChartEditorProps> = ({ chart, onSave, onCancel }) => {
  const [editedChart, setEditedChart] = useState<ChordChart>({ ...chart });
  const [selectedChords, setSelectedChords] = useState<Set<string>>(new Set());
  const [lastSelectedChord, setLastSelectedChord] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ 
    isValid: true, 
    errors: [] 
  });
  
  const handleBasicInfoChange = (field: keyof ChordChart, value: string | number | undefined) => {
    const updated = {
      ...editedChart,
      [field]: value
    };
    
    // 拍子が変更された場合、全セクションのbeatsPerBarを更新
    if (field === 'timeSignature' && typeof value === 'string') {
      const beatsPerBar = parseInt(value.split('/')[0]);
      updated.sections = editedChart.sections?.map(section => ({
        ...section,
        beatsPerBar
      })) || [];
    }
    
    setEditedChart(updated);
  };

  const handleTranspose = (transposedChart: ChordChart) => {
    setEditedChart(transposedChart);
  };

  // チャートが変更されるたびにバリデーション実行
  useEffect(() => {
    const result = validateChartInputs(editedChart);
    setValidationResult(result);
  }, [editedChart]);

  const handleSave = () => {
    // 保存前に最終バリデーション
    const result = validateChartInputs(editedChart);
    if (!result.isValid) {
      // バリデーションエラーがある場合は保存しない
      setValidationResult(result);
      return;
    }

    onSave({
      ...editedChart,
      updatedAt: new Date()
    });
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">コード譜を編集</h2>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!validationResult.isValid}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                validationResult.isValid
                  ? 'bg-[#85B0B7] hover:bg-[#6B9CA5] text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
              title={!validationResult.isValid ? '無効な入力値があるため保存できません' : ''}
            >
              保存
            </button>
          </div>
        </div>

        {/* バリデーションエラー表示 */}
        {!validationResult.isValid && validationResult.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">入力エラーがあります</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-xs text-red-600">
                  エラーを修正してから保存してください
                </p>
              </div>
            </div>
          </div>
        )}

        <BasicInfoEditor
          chart={editedChart}
          onUpdate={handleBasicInfoChange}
          onTranspose={handleTranspose}
        />

        <SectionEditor
          chart={editedChart}
          onUpdateChart={setEditedChart}
          selectedChords={selectedChords}
          setSelectedChords={setSelectedChords}
          lastSelectedChord={lastSelectedChord}
          setLastSelectedChord={setLastSelectedChord}
        />

        <div className="mb-8">
          <label htmlFor="notes-textarea" className="block text-sm font-medium text-slate-700 mb-2">
            メモ
          </label>
          <textarea
            id="notes-textarea"
            value={editedChart.notes || ''}
            onChange={(e) => handleBasicInfoChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
            placeholder="コード譜に関するメモを入力してください"
          />
        </div>
      </div>
    </div>
  );
};

export default ChordChartEditor;