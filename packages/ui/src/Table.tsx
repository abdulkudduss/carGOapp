import type { ReactNode } from 'react';
import { cx } from './util.ts';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. Badge columns return a StatusBadge/ClaimBadge here. */
  render: (row: T) => ReactNode;
  /** Monospace cell (codes: parcel_code, box code, track). */
  mono?: boolean;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
}

export interface TableProps<T> {
  columns: Array<Column<T>>;
  rows: readonly T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Shown in place of the body when `rows` is empty (e.g. <EmptyState/>). */
  empty?: ReactNode;
  className?: string;
}

/**
 * Table — compact, density-aware rows (the row padding tracks `data-density`,
 * so web-ops gets tight rows and pvz roomier ones). Columns are
 * config-driven; badge columns just return a StatusBadge / ClaimBadge from
 * `render`, which keeps both axes side by side in their own columns (TZ §3).
 * Header is sticky for long scrolls.
 */
export function Table<T>({ columns, rows, getRowKey, onRowClick, empty, className }: TableProps<T>) {
  if (rows.length === 0 && empty) {
    return <div className={cx('cui', 'cui-table-wrap', className)}>{empty}</div>;
  }
  return (
    <div className={cx('cui', 'cui-table-wrap', className)}>
      <table className="cui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width, textAlign: col.align }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cx(col.mono && 'cui-table--mono-col')}
                  style={{ textAlign: col.align }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
