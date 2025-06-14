import React from 'react';

const ChordChart: React.FC = () => {
  return (
    <div className="h-full bg-white">
      <div className="p-6">
        {/* Chart Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">楽曲タイトル</h2>
          <p className="text-gray-600">アーティスト名 | キー: C major</p>
        </div>

        {/* Chart Content */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6 min-h-96">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {/* Sample chord progression */}
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">C</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">Am</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">F</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">G</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">Dm</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">G</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">C</span>
            </div>
            <div className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200">
              <span className="text-base sm:text-lg font-semibold">C</span>
            </div>
          </div>

          {/* Placeholder for more content */}
          <div className="text-center text-gray-500 mt-8">
            <p>コード譜の編集機能はこちらに実装予定</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            編集
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
            複製
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChordChart;