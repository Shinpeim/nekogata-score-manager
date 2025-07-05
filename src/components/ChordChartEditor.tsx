import React, { useState, useMemo } from 'react';
import type { ChordChart } from '../types';
import BasicInfoEditor from './BasicInfoEditor';
import SectionEditor from './SectionEditor';
import { validateChartInputs } from '../utils/chordValidation';
import { toDisplayChord } from '../utils/chordConversion';

interface ChordChartEditorProps {
  chart: ChordChart;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}


const ChordChartEditor: React.FC<ChordChartEditorProps> = ({ chart, onSave, onCancel }) => {
  // チャート読み込み時にコードにidを追加（idがない場合のみ）
  const chartWithIds = useMemo(() => {
    return {
      ...chart,
      sections: chart.sections?.map(section => ({
        ...section,
        chords: section.chords.map(chord => {
          // 既にidがある場合はそのまま、ない場合は追加
          if ('id' in chord && chord.id) {
            return chord;
          }
          return toDisplayChord(chord);
        })
      })) || []
    };
  }, [chart]);

  const [editedChart, setEditedChart] = useState<ChordChart>(chartWithIds);
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

  // バリデーション結果は保存時のみ実行（リアルタイムバリデーションを無効化）

  const handleSave = () => {
    // 保存前に最終バリデーション（フォームの値も考慮）
    const formErrors: string[] = [];
    
    // DOMから現在のフォーム値を取得してバリデーション
    editedChart.sections?.forEach((section) => {
      section.chords.forEach((chord, chordIndex) => {
        if (chord.isLineBreak) return; // 改行マーカーはスキップ
        
        // コード名フィールドの値を取得
        const chordInput = document.querySelector(
          `[data-chord-item="${section.id}-${chordIndex}"] input[placeholder="コード名"]`
        ) as HTMLInputElement;
        
        if (chordInput) {
          const formValue = chordInput.value.trim();
          if (!formValue) {
            formErrors.push(`セクション「${section.name}」の${chordIndex + 1}番目のコード名「」が無効です`);
          }
        }
        
        // 拍数フィールドの値を取得
        const durationInput = document.querySelector(
          `[data-chord-item="${section.id}-${chordIndex}"] input[placeholder="拍数"]`
        ) as HTMLInputElement;
        
        if (durationInput) {
          const durationValue = durationInput.value.trim();
          if (!durationValue) {
            formErrors.push(`セクション「${section.name}」の${chordIndex + 1}番目の拍数が入力されていません`);
          } else {
            const duration = parseFloat(durationValue);
            if (isNaN(duration) || duration < 0.5 || duration > 16) {
              formErrors.push(`セクション「${section.name}」の${chordIndex + 1}番目の拍数「${durationValue}」が無効です（0.5〜16の範囲で入力してください）`);
            } else if ((duration * 2) % 1 !== 0) {
              formErrors.push(`セクション「${section.name}」の${chordIndex + 1}番目の拍数「${durationValue}」は0.5刻みで入力してください`);
            }
          }
        }
      });
    });
    
    // 内部データのバリデーションも実行
    const result = validateChartInputs(editedChart);
    const allErrors = [...formErrors, ...result.errors];
    
    if (allErrors.length > 0) {
      // バリデーションエラーがある場合は保存しない
      setValidationResult({ isValid: false, errors: allErrors });
      return;
    }

    // バリデーション成功時はエラーメッセージをクリア
    setValidationResult({ isValid: true, errors: [] });
    
    onSave({
      ...editedChart,
      updatedAt: new Date()
    });
  };

  return (
    <div className="h-full bg-white overflow-y-auto" data-testid="chart-editor">
      <div className="p-6 pl-16">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900" data-testid="editor-title">{chart.title || '無題のコード譜'} - 編集</h2>
          <div className="flex gap-3" data-testid="editor-actions">
            <button
              onClick={onCancel}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium"
              data-testid="editor-cancel-button"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md text-sm font-medium bg-[#85B0B7] hover:bg-[#6B9CA5] text-white"
              data-testid="editor-save-button"
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