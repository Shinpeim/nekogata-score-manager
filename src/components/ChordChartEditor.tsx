import React, { useState } from 'react';
import type { ChordChart, ChordSection, Chord } from '../types';

interface ChordChartEditorProps {
  chart: ChordChart;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}

const ChordChartEditor: React.FC<ChordChartEditorProps> = ({ chart, onSave, onCancel }) => {
  const [editedChart, setEditedChart] = useState<ChordChart>({ ...chart });
  
  const handleBasicInfoChange = (field: keyof ChordChart, value: string | number | undefined) => {
    setEditedChart(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // 拍子が変更された場合、全セクションのbeatsPerBarを更新
      if (field === 'timeSignature' && typeof value === 'string') {
        const beatsPerBar = parseInt(value.split('/')[0]);
        updated.sections = prev.sections?.map(section => ({
          ...section,
          beatsPerBar
        })) || [];
      }
      
      return updated;
    });
  };

  const handleSectionChange = (sectionId: string, field: keyof ChordSection, value: string | number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      ) || []
    }));
  };

  const addSection = () => {
    const beatsPerBar = editedChart.timeSignature ? parseInt(editedChart.timeSignature.split('/')[0]) : 4;
    const newSection: ChordSection = {
      id: `section-${Date.now()}`,
      name: '新しいセクション',
      beatsPerBar,
      chords: []
    };
    
    setEditedChart(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const deleteSection = (sectionId: string) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.id !== sectionId) || []
    }));
  };

  const addChordToSection = (sectionId: string) => {
    const newChord: Chord = {
      name: 'C',
      duration: 4
    };
    
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [...section.chords, newChord]
            }
          : section
      ) || []
    }));
  };

  const updateChordInSection = (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.map((chord, index) =>
                index === chordIndex
                  ? { ...chord, [field]: value }
                  : chord
              )
            }
          : section
      ) || []
    }));
  };

  const deleteChordFromSection = (sectionId: string, chordIndex: number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.filter((_, index) => index !== chordIndex)
            }
          : section
      ) || []
    }));
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
          <h2 className="text-2xl font-bold text-gray-900">コード譜を編集</h2>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                id="title-input"
                type="text"
                value={editedChart.title}
                onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="artist-input" className="block text-sm font-medium text-gray-700 mb-1">
                アーティスト
              </label>
              <input
                id="artist-input"
                type="text"
                value={editedChart.artist}
                onChange={(e) => handleBasicInfoChange('artist', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="key-select" className="block text-sm font-medium text-gray-700 mb-1">
                キー
              </label>
              <select
                id="key-select"
                value={editedChart.key}
                onChange={(e) => handleBasicInfoChange('key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
              </select>
            </div>
            <div>
              <label htmlFor="tempo-input" className="block text-sm font-medium text-gray-700 mb-1">
                テンポ (BPM)
              </label>
              <input
                id="tempo-input"
                type="number"
                value={editedChart.tempo || ''}
                onChange={(e) => handleBasicInfoChange('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="time-signature-select" className="block text-sm font-medium text-gray-700 mb-1">
                拍子
              </label>
              <select
                id="time-signature-select"
                value={editedChart.timeSignature}
                onChange={(e) => handleBasicInfoChange('timeSignature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
                <option value="6/8">6/8</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">セクション</h3>
            <button
              onClick={addSection}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
            >
              セクション追加
            </button>
          </div>

          {editedChart.sections?.map((section) => (
            <div key={section.id} className="mb-6 p-4 border border-gray-300 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => handleSectionChange(section.id, 'name', e.target.value)}
                  className="text-lg font-medium bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => deleteSection(section.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs"
                >
                  削除
                </button>
              </div>

              <div className="mb-3">
                <button
                  onClick={() => addChordToSection(section.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  コード追加
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {section.chords.map((chord, chordIndex) => (
                  <div key={chordIndex} className="p-2 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">#{chordIndex + 1}</span>
                      <button
                        onClick={() => deleteChordFromSection(section.id, chordIndex)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={chord.name}
                      onChange={(e) => updateChordInSection(section.id, chordIndex, 'name', e.target.value)}
                      className="w-full mb-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="コード名"
                    />
                    <input
                      type="number"
                      value={chord.duration || 4}
                      onChange={(e) => updateChordInSection(section.id, chordIndex, 'duration', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="拍数"
                      min="1"
                      max="16"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-700 mb-2">
            メモ
          </label>
          <textarea
            id="notes-textarea"
            value={editedChart.notes || ''}
            onChange={(e) => handleBasicInfoChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="コード譜に関するメモを入力してください"
          />
        </div>
      </div>
    </div>
  );
};

export default ChordChartEditor;