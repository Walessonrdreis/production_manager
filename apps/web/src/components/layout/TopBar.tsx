import React from 'react';
import { Menu } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  title: string;
}

export function Topbar({ onToggleSidebar, title }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="font-semibold text-slate-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500">Matriz</span>
          <span className="text-[8px] sm:text-[10px] text-emerald-600 font-bold uppercase">Online</span>
        </div>
      </div>
    </header>
  );
}
