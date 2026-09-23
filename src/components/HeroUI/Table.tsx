import React, { createContext, useContext, ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableContextType {
  isStriped?: boolean;
  isCompact?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
}

const TableContext = createContext<TableContextType>({
  isStriped: false,
  isCompact: false,
  selectionMode: 'none',
});

// --- Table Root ---
export interface TableProps {
  children: ReactNode;
  isStriped?: boolean;
  isCompact?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
  className?: string;
  'aria-label'?: string;
}

export const Table: React.FC<TableProps> & {
  Header: typeof TableHeader;
  Column: typeof TableColumn;
  Body: typeof TableBody;
  Row: typeof TableRow;
  Cell: typeof TableCell;
} = ({
  children,
  isStriped = false,
  isCompact = false,
  selectionMode = 'none',
  className = '',
  'aria-label': ariaLabel = 'Data table',
}) => {
  return (
    <TableContext.Provider value={{ isStriped, isCompact, selectionMode }}>
      <div
        className={`w-full overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-xl ${className}`}
        style={{
          background: 'var(--table-bg, rgba(10, 15, 26, 0.65))',
          borderColor: 'var(--table-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <table
          aria-label={ariaLabel}
          className="w-full text-left border-collapse text-xs"
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
};

// --- Table Header ---
export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <thead
      className={`border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] ${className}`}
      style={{
        backgroundColor: 'var(--table-header-bg, rgba(15, 23, 42, 0.75))',
        borderBottomColor: 'var(--table-header-border, rgba(255, 255, 255, 0.08))',
      }}
    >
      <tr>{children}</tr>
    </thead>
  );
};

// --- Table Column ---
export interface TableColumnProps {
  id?: string;
  children: ReactNode;
  allowsSorting?: boolean;
  sortDirection?: 'ascending' | 'descending' | null;
  onSortChange?: (id?: string) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const TableColumn: React.FC<TableColumnProps> = ({
  id,
  children,
  allowsSorting = false,
  sortDirection,
  onSortChange,
  align = 'start',
  className = '',
}) => {
  const { isCompact } = useContext(TableContext);

  const alignClass = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
  }[align];

  return (
    <th
      scope="col"
      onClick={() => allowsSorting && onSortChange?.(id)}
      className={`${
        isCompact ? 'px-3 py-2' : 'px-4 py-3'
      } ${alignClass} font-semibold select-none ${
        allowsSorting ? 'cursor-pointer hover:text-white transition-colors' : ''
      } ${className}`}
    >
      <div
        className={`inline-flex items-center gap-1.5 ${
          align === 'center'
            ? 'justify-center'
            : align === 'end'
            ? 'justify-end'
            : 'justify-start'
        }`}
      >
        <span>{children}</span>
        {allowsSorting && (
          <span className="flex flex-col text-[8px] leading-none opacity-60">
            {sortDirection === 'ascending' && (
              <ChevronUp className="w-3 h-3 text-cyan-400" />
            )}
            {sortDirection === 'descending' && (
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            )}
            {!sortDirection && (
              <span className="flex flex-col">
                <ChevronUp className="w-2.5 h-2.5 -mb-1 opacity-40" />
                <ChevronDown className="w-2.5 h-2.5 opacity-40" />
              </span>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// --- Table Body ---
export interface TableBodyProps {
  children?: ReactNode;
  emptyContent?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const TableBody: React.FC<TableBodyProps> = ({
  children,
  emptyContent = 'No data available',
  isLoading = false,
  className = '',
}) => {
  const childCount = React.Children.count(children);

  return (
    <tbody className={`divide-y divide-white/5 ${className}`}>
      {isLoading ? (
        <tr>
          <td colSpan={100} className="p-8 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Loading table contents...</span>
            </div>
          </td>
        </tr>
      ) : childCount === 0 ? (
        <tr>
          <td colSpan={100} className="p-8 text-center text-slate-500 italic">
            {emptyContent}
          </td>
        </tr>
      ) : (
        children
      )}
    </tbody>
  );
};

// --- Table Row ---
export interface TableRowProps {
  id?: string | number;
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const TableRow: React.FC<TableRowProps> = ({
  children,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const { isStriped } = useContext(TableContext);

  return (
    <tr
      onClick={onClick}
      data-selected={isSelected}
      className={`transition-colors duration-150 ${
        isStriped ? 'even:bg-white/[0.02]' : ''
      } ${
        onClick
          ? 'cursor-pointer hover:bg-cyan-500/[0.06] hover:text-white'
          : 'hover:bg-white/[0.02]'
      } ${
        isSelected ? '!bg-cyan-500/15 border-l-2 border-cyan-400' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
};

// --- Table Cell ---
export interface TableCellProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'start',
  className = '',
}) => {
  const { isCompact } = useContext(TableContext);

  const alignClass = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
  }[align];

  return (
    <td
      className={`${
        isCompact ? 'px-3 py-2' : 'px-4 py-3'
      } ${alignClass} text-slate-300 font-medium ${className}`}
    >
      {children}
    </td>
  );
};

Table.Header = TableHeader;
Table.Column = TableColumn;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;

export default Table;
