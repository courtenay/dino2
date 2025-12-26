'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RefreshCw,
  Trash2,
  Download,
  ArrowDown,
  Pause,
  Play,
  Search,
} from 'lucide-react';
import { useLogsModal } from './LogsModalContext';
import { useLogsStream } from '@/hooks/useLogsStream';
import type { LogsStreamParams } from '@/types/logs';

const TAIL_OPTIONS = [50, 100, 500, 1000, 5000];

export function LogsModal() {
  const { state, closeLogs } = useLogsModal();
  const [tailLines, setTailLines] = useState(100);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Build stream params with current settings
  const streamParams: LogsStreamParams | null = useMemo(() => {
    if (!state.params) return null;
    return {
      ...state.params,
      tailLines,
      follow: !isPaused,
    };
  }, [state.params, tailLines, isPaused]);

  const { logs, status, error, clear, reconnect } = useLogsStream(
    state.isOpen ? streamParams : null
  );

  // Filter logs client-side
  const filteredLogs = useMemo(() => {
    if (!filter.trim()) return logs;
    const lowerFilter = filter.toLowerCase();
    return logs.filter((log) => log.content.toLowerCase().includes(lowerFilter));
  }, [logs, filter]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Handle scroll to detect manual scrolling (disable auto-scroll)
  const handleScroll = useCallback(() => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  }, [autoScroll]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setAutoScroll(true);
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, []);

  // Download logs
  const handleDownload = useCallback(() => {
    const content = filteredLogs.map((l) => l.content).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.params?.pod}-${state.params?.container}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs, state.params]);

  // Portal mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeLogs();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeLogs, state.isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (state.isOpen) {
      setFilter('');
      setAutoScroll(true);
      setIsPaused(false);
    }
  }, [state.isOpen]);

  if (!mounted || !state.isOpen) return null;

  const statusColor: Record<string, string> = {
    connecting: 'text-yellow-500',
    connected: 'text-green-500',
    disconnected: 'text-gray-500',
    error: 'text-red-500',
  };

  const statusText: Record<string, string> = {
    connecting: 'Connecting...',
    connected: 'Live',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeLogs}
      />

      {/* Modal */}
      <div className="relative w-[90vw] h-[80vh] max-w-6xl bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              {state.params?.pod}
              <span className="text-gray-400 font-normal"> / </span>
              {state.params?.container}
            </h2>
            <span className={`text-sm flex items-center gap-1 ${statusColor[status]}`}>
              {status === 'connected' && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
              {statusText[status]}
            </span>
          </div>
          <button
            onClick={closeLogs}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-3 border-b border-gray-700 bg-gray-800 flex-wrap">
          {/* Search/Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              className="flex-1 bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tail lines selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tail:</span>
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              className="bg-gray-700 text-white text-sm px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              {TAIL_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} lines
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded transition-colors ${
                isPaused
                  ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-white'
              }`}
              title={isPaused ? 'Resume streaming' : 'Pause streaming'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={scrollToBottom}
              className={`p-2 rounded transition-colors ${
                autoScroll
                  ? 'text-blue-400 hover:bg-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Scroll to bottom & auto-scroll"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={clear}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={reconnect}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Reconnect"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Download logs"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Log count */}
          <span className="text-sm text-gray-400">
            {filter ? `${filteredLogs.length} / ${logs.length}` : logs.length} lines
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-900/50 text-red-200 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={reconnect}
              className="text-red-200 hover:text-white underline text-sm"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Logs area */}
        <div
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto p-4 font-mono text-sm text-gray-100 bg-gray-900"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {status === 'connecting'
                ? 'Connecting to logs...'
                : logs.length === 0
                ? 'Waiting for logs...'
                : 'No logs match the filter'}
            </div>
          ) : (
            <div className="space-y-0">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="hover:bg-gray-800/50 py-0.5 whitespace-pre-wrap break-all leading-relaxed"
                >
                  {log.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auto-scroll indicator */}
        {!autoScroll && logs.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-8 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
            New logs
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
