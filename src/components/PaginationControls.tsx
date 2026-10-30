import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages?: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  idPrefix?: string;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  idPrefix = 'pagination',
  className = ''
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const totalPagesCount = totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 font-sans ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <strong className="text-slate-900">{startItem}</strong> - <strong className="text-slate-900">{endItem}</strong> of <strong className="text-slate-900">{totalItems}</strong> items
        </span>
        <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
          <label htmlFor={`${idPrefix}-page-size`} className="text-[11px] font-medium text-slate-400">Rows per page:</label>
          <select
            id={`${idPrefix}-page-size`}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-revon-blue cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          id={`${idPrefix}-prev-btn`}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>
        <span className="font-mono font-semibold text-slate-600 px-2">
          Page {currentPage} of {totalPagesCount}
        </span>
        <button
          id={`${idPrefix}-next-btn`}
          disabled={currentPage >= totalPagesCount}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
