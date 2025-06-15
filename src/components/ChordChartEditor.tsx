import React, { useState } from 'react';
import type { ChordChart } from '../types';
import BasicInfoEditor from './BasicInfoEditor';
import SectionEditor from './SectionEditor';

interface ChordChartEditorProps {
  chart: ChordChart;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}


const ChordChartEditor: React.FC<ChordChartEditorProps> = ({ chart, onSave, onCancel }) => {
  const [editedChart, setEditedChart] = useState<ChordChart>({ ...chart });
  const [selectedChords, setSelectedChords] = useState<Set<string>>(new Set());
  const [lastSelectedChord, setLastSelectedChord] = useState<string | null>(null);
  
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


  const handleSave = () => {
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
              className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>


        <BasicInfoEditor
          chart={editedChart}
          onUpdate={handleBasicInfoChange}
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