import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Chord Chart</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                新規作成
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden md:block w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-3">コード譜一覧</h2>
            <div className="space-y-2">
              {/* Sample chord charts list */}
              <div className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                <h3 className="text-sm font-medium text-gray-900">サンプル楽曲 1</h3>
                <p className="text-xs text-gray-500 mt-1">アーティスト名</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                <h3 className="text-sm font-medium text-gray-900">サンプル楽曲 2</h3>
                <p className="text-xs text-gray-500 mt-1">アーティスト名</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;