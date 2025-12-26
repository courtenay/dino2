export interface LogLine {
  id: string;
  timestamp: Date;
  content: string;
}

export interface LogsStreamParams {
  namespace: string;
  pod: string;
  container: string;
  tailLines?: number;
  follow?: boolean;
}

export type LogsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface LogsModalState {
  isOpen: boolean;
  params: LogsStreamParams | null;
}
