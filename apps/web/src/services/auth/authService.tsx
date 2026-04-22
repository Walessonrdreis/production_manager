import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, AuthResponse } from '../../types';

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: {
        id: 'dev-user',
        name: 'Desenvolvedor (Acesso Liberado)',
        email: 'dev@prodmanager.com',
        role: 'admin'
      },
      token: 'dev-token-secret',
      isAuthenticated: true,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('prod-manager-auth');
      },
    }),
    {
      name: 'prod-manager-auth',
    }
  )
);

export const authService = {
  getToken: () => useAuthStore.getState().token,
  getUser: () => useAuthStore.getState().user,
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  logout: () => {
    useAuthStore.getState().logout();
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulação de login - Em produção seria uma chamada de API real
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (password === 'admin' || password === 'prodmanager') {
      return {
        user: {
          id: 'dev-user',
          name: 'Desenvolvedor (Acesso Liberado)',
          email: email,
          role: 'admin'
        },
        token: 'dev-token-' + Math.random().toString(36).substring(7)
      };
    }
    
    throw new Error('E-mail ou senha inválidos.');
  }
};
