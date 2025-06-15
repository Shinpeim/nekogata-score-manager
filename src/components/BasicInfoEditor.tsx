import React, { useState } from 'react';
import type { ChordChart } from '../types';
import TransposeConfirmDialog from './TransposeConfirmDialog';
import { transposeChart } from '../utils/chordUtils';

interface BasicInfoEditorProps {
  chart: ChordChart;
  onUpdate: (field: keyof ChordChart, value: string | number | undefined) => void;
  onTranspose?: (transposedChart: ChordChart) => void;
}

const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({ chart, onUpdate, onTranspose }) => {
  const [showTransposeDialog, setShowTransposeDialog] = useState(false);
  const [pendingKey, setPendingKey] = useState<string>('');

  const handleKeyChange = (newKey: string) => {
    if (newKey === chart.key) return;

    // コードが存在するかチェック
    const hasChords = chart.sections.some(section => 
      section.chords.some(chord => !chord.isLineBreak)
    );

    if (hasChords) {
      // コードが存在する場合は移調確認ダイアログを表示
      setPendingKey(newKey);
      setShowTransposeDialog(true);
    } else {
      // コードが存在しない場合は直接キーのみ変更
      onUpdate('key', newKey);
    }
  };

  const handleTransposeConfirm = (transposeChords: boolean) => {
    if (transposeChords && onTranspose) {
      // 移調処理を実行
      const transposedChart = transposeChart(chart, pendingKey);
      onTranspose(transposedChart);
    } else {
      // キーのみ変更
      onUpdate('key', pendingKey);
    }
    
    setShowTransposeDialog(false);
    setPendingKey('');
  };

  const handleTransposeCancel = () => {
    setShowTransposeDialog(false);
    setPendingKey('');
  };

  return (
    <div className="mb-8 p-4 bg-slate-50 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">基本情報</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title-input" className="block text-sm font-medium text-slate-700 mb-1">
            タイトル
          </label>
          <input
            id="title-input"
            type="text"
            value={chart.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          />
        </div>
        <div>
          <label htmlFor="artist-input" className="block text-sm font-medium text-slate-700 mb-1">
            アーティスト
          </label>
          <input
            id="artist-input"
            type="text"
            value={chart.artist}
            onChange={(e) => onUpdate('artist', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          />
        </div>
        <div>
          <label htmlFor="key-select" className="block text-sm font-medium text-slate-700 mb-1">
            キー
          </label>
          <select
            id="key-select"
            value={chart.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          >
            <option value="C">C / Am</option>
            <option value="Db">D♭ / B♭m</option>
            <option value="D">D / Bm</option>
            <option value="Eb">E♭ / Cm</option>
            <option value="E">E / C#m</option>
            <option value="F">F / Dm</option>
            <option value="Gb">G♭ / E♭m</option>
            <option value="G">G / Em</option>
            <option value="Ab">A♭ / Fm</option>
            <option value="A">A / F#m</option>
            <option value="Bb">B♭ / Gm</option>
            <option value="B">B / G#m</option>
          </select>
        </div>
        <div>
          <label htmlFor="tempo-input" className="block text-sm font-medium text-slate-700 mb-1">
            テンポ (BPM)
          </label>
          <input
            id="tempo-input"
            type="number"
            value={chart.tempo || ''}
            onChange={(e) => onUpdate('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="time-signature-select" className="block text-sm font-medium text-slate-700 mb-1">
            拍子
          </label>
          <select
            id="time-signature-select"
            value={chart.timeSignature}
            onChange={(e) => onUpdate('timeSignature', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="2/4">2/4</option>
            <option value="6/8">6/8</option>
          </select>
        </div>
      </div>

      <TransposeConfirmDialog
        isOpen={showTransposeDialog}
        onClose={handleTransposeCancel}
        onConfirm={handleTransposeConfirm}
        fromKey={chart.key}
        toKey={pendingKey}
      />
    </div>
  );
};

export default BasicInfoEditor;