import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingCart, 
  CalendarRange, 
  LogOut,
  X,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../services/auth/authService';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos Omie', path: '/products', icon: Package },
  { id: 'my-products', label: 'Meus Produtos', path: '/my-products', icon: User },
  { id: 'sectors', label: 'Setores', path: '/sectors', icon: Layers },
  { id: 'orders', label: 'Ordens Pendentes', path: '/orders', icon: ShoppingCart },
  { id: 'planning', label: 'Gerador de Plano', path: '/planning', icon: CalendarRange },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
  const { user } = useAuthStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col h-screen fixed inset-y-0 left-0 z-[60] lg:sticky lg:translate-x-0 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full shrink-0">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers className="text-white" size={20} />
              </div>
              <span className="font-bold text-lg text-white">ProdManager</span>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@admin.com'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-medium text-left"
            >
              <LogOut size={16} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
