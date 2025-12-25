'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface NamespaceFilterProps {
  namespaces: string[];
  selected: string[];
  onChange: (namespaces: string[]) => void;
}

export function NamespaceFilter({ namespaces, selected, onChange }: NamespaceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNamespace = (ns: string) => {
    if (selected.includes(ns)) {
      onChange(selected.filter((n) => n !== ns));
    } else {
      onChange([...selected, ns]);
    }
  };

  const selectAll = () => onChange([]);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-sm font-medium text-gray-700">
          {selected.length === 0
            ? 'All Namespaces'
            : `${selected.length} namespace${selected.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {selected.length > 0 && (
        <button
          onClick={clearAll}
          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          title="Clear filter"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Show all namespaces
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {namespaces.map((ns) => {
              const isSelected = selected.includes(ns);
              return (
                <button
                  key={ns}
                  onClick={() => toggleNamespace(ns)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected || selected.length === 0
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {(isSelected || selected.length === 0) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{ns}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
