'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LogsStreamParams, LogsModalState } from '@/types/logs';

interface LogsModalContextValue {
  state: LogsModalState;
  openLogs: (params: LogsStreamParams) => void;
  closeLogs: () => void;
}

const LogsModalContext = createContext<LogsModalContextValue | null>(null);

export function LogsModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LogsModalState>({
    isOpen: false,
    params: null,
  });

  const openLogs = useCallback((params: LogsStreamParams) => {
    setState({ isOpen: true, params });
  }, []);

  const closeLogs = useCallback(() => {
    setState({ isOpen: false, params: null });
  }, []);

  return (
    <LogsModalContext.Provider value={{ state, openLogs, closeLogs }}>
      {children}
    </LogsModalContext.Provider>
  );
}

export function useLogsModal(): LogsModalContextValue {
  const context = useContext(LogsModalContext);
  if (!context) {
    throw new Error('useLogsModal must be used within LogsModalProvider');
  }
  return context;
}
