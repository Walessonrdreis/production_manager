import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { router } from './router';
import './index.css';

// Função auxiliar para extrair a mensagem de erro
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Tenta remover o prefixo padrão do nosso apiClient, se existir
    const msg = error.message.replace('Erro na requisição: ', '');
    return msg;
  }
  return 'Ocorreu um erro inesperado.';
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = getErrorMessage(error);
      
      // Tratamento especial para erro amigável de Setor Padrão Ausente
      if (message.includes('MISSING_DEFAULT_SECTOR') || message.includes('Bad Request')) {
        toast.error(
          'Este produto não possui um Setor Padrão configurado. Por favor, selecione um setor.',
          { duration: 5000 }
        );
      } else {
        toast.error(message);
      }
    },
  }),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
