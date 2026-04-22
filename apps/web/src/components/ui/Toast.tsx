import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Convenience hook
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  
  return { addToast, removeToast };
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`px-4 py-3 rounded-xl shadow-2xl text-white pointer-events-auto border animate-in slide-in-from-right-10 flex flex-col gap-1 ${
            t.type === 'success' 
              ? 'bg-emerald-600 border-emerald-500' 
              : t.type === 'error' 
                ? 'bg-red-600 border-red-500' 
                : 'bg-blue-600 border-blue-500'
          }`}
        >
          {t.title && <p className="font-bold text-sm">{t.title}</p>}
          <p className="text-xs opacity-90 leading-relaxed font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
