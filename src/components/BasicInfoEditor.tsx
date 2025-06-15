import React from 'react';
import type { ChordChart } from '../types';

interface BasicInfoEditorProps {
  chart: ChordChart;
  onUpdate: (field: keyof ChordChart, value: string | number | undefined) => void;
}

const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({ chart, onUpdate }) => {
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
            onChange={(e) => onUpdate('key', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
          >
            <option value="C">C</option>
            <option value="C#">C#</option>
            <option value="Db">D♭</option>
            <option value="D">D</option>
            <option value="D#">D#</option>
            <option value="Eb">E♭</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="F#">F#</option>
            <option value="Gb">G♭</option>
            <option value="G">G</option>
            <option value="G#">G#</option>
            <option value="Ab">A♭</option>
            <option value="A">A</option>
            <option value="A#">A#</option>
            <option value="Bb">B♭</option>
            <option value="B">B</option>
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
    </div>
  );
};

export default BasicInfoEditor;