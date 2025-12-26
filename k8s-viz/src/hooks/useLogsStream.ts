import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogLine, LogsStreamParams, LogsConnectionStatus } from '@/types/logs';

const MAX_BUFFER_SIZE = 10000;

interface UseLogsStreamResult {
  logs: LogLine[];
  status: LogsConnectionStatus;
  error: string | null;
  clear: () => void;
  reconnect: () => void;
}

export function useLogsStream(
  params: LogsStreamParams | null,
  maxLines: number = 1000
): UseLogsStreamResult {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<LogsConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lineCountRef = useRef(0);
  const paramsRef = useRef(params);

  // Keep params ref updated
  paramsRef.current = params;

  const connect = useCallback(() => {
    const currentParams = paramsRef.current;
    if (!currentParams) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');
    setError(null);

    const url = new URL('/api/k8s/logs', window.location.origin);
    url.searchParams.set('namespace', currentParams.namespace);
    url.searchParams.set('pod', currentParams.pod);
    url.searchParams.set('container', currentParams.container);
    if (currentParams.tailLines !== undefined) {
      url.searchParams.set('tailLines', String(currentParams.tailLines));
    }
    url.searchParams.set('follow', String(currentParams.follow !== false));

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setStatus('connected');
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as { line?: string };
        if (data.line) {
          const newLog: LogLine = {
            id: `${Date.now()}-${lineCountRef.current++}`,
            timestamp: new Date(),
            content: data.line,
          };

          setLogs((prev) => {
            const updated = [...prev, newLog];
            // Keep buffer under max size
            if (updated.length > MAX_BUFFER_SIZE) {
              return updated.slice(-maxLines);
            }
            return updated;
          });
        }
      } catch {
        // Ignore malformed messages
      }
    });

    eventSource.addEventListener('error', (event) => {
      // Check if this is a custom error event or connection error
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data) as { error?: string };
          setError(data.error || 'Unknown error');
        } catch {
          setError('Connection error');
        }
      }

      if (eventSource.readyState === EventSource.CLOSED) {
        setStatus('disconnected');
      } else {
        setStatus('error');
        if (!error) {
          setError('Connection lost. Click reconnect to try again.');
        }
      }
    });

    eventSource.addEventListener('end', () => {
      setStatus('disconnected');
      eventSource.close();
    });
  }, [maxLines, error]);

  const clear = useCallback(() => {
    setLogs([]);
    lineCountRef.current = 0;
  }, []);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // Connect when params change
  useEffect(() => {
    if (params) {
      // Reset state for new connection
      setLogs([]);
      lineCountRef.current = 0;
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [params?.namespace, params?.pod, params?.container, params?.tailLines, params?.follow, connect]);

  return { logs, status, error, clear, reconnect };
}
