/**
 * Accessible Table Components
 * Provides WCAG 2.1 AA compliant data table patterns
 */

import { ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from './VisuallyHidden';

// Table Caption - Required for accessible tables
interface TableCaptionProps {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}

export function TableCaption({ children, className, visuallyHidden = false }: TableCaptionProps) {
  if (visuallyHidden) {
    return (
      <caption className="sr-only">
        {children}
      </caption>
    );
  }

  return (
    <caption className={cn('text-sm text-muted-foreground mb-4 text-left', className)}>
      {children}
    </caption>
  );
}

// Accessible Table Wrapper
interface AccessibleTableProps {
  children: ReactNode;
  caption: string;
  captionHidden?: boolean;
  summary?: string; // Additional description for screen readers
  className?: string;
  responsive?: boolean;
}

export function AccessibleTable({
  children,
  caption,
  captionHidden = false,
  summary,
  className,
  responsive = true,
}: AccessibleTableProps) {
  const id = useId();
  const summaryId = summary ? `${id}-summary` : undefined;

  const table = (
    <table
      className={cn('w-full border-collapse', className)}
      aria-describedby={summaryId}
    >
      <TableCaption visuallyHidden={captionHidden}>
        {caption}
      </TableCaption>
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div className="relative w-full">
        {summary && (
          <p id={summaryId} className="sr-only">
            {summary}
          </p>
        )}
        <div
          className="overflow-x-auto"
          role="region"
          aria-label={`${caption} - scrollable table`}
          tabIndex={0}
        >
          {table}
        </div>
      </div>
    );
  }

  return (
    <>
      {summary && (
        <p id={summaryId} className="sr-only">
          {summary}
        </p>
      )}
      {table}
    </>
  );
}

// Table Header
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn('bg-muted/50', className)}>
      {children}
    </thead>
  );
}

// Table Body
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('[&>tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

// Table Footer
interface TableFooterProps {
  children: ReactNode;
  className?: string;
}

export function TableFooter({ children, className }: TableFooterProps) {
  return (
    <tfoot className={cn('bg-muted/50 font-medium', className)}>
      {children}
    </tfoot>
  );
}

// Table Row
interface TableRowProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}

export function TableRow({
  children,
  className,
  selected,
  onClick,
  'aria-label': ariaLabel,
}: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        selected && 'bg-muted',
        className
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-selected={selected}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  );
}

// Table Header Cell with Sorting Support
type SortDirection = 'asc' | 'desc' | null;

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  abbr?: string; // Abbreviation for screen readers
  colSpan?: number;
  rowSpan?: number;
}

export function TableHead({
  children,
  className,
  scope = 'col',
  sortable = false,
  sortDirection,
  onSort,
  abbr,
  colSpan,
  rowSpan,
}: TableHeadProps) {
  const renderSortIcon = () => {
    if (!sortable) return null;

    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" aria-hidden="true" />;
  };

  const getSortLabel = () => {
    if (sortDirection === 'asc') return 'sorted ascending';
    if (sortDirection === 'desc') return 'sorted descending';
    return 'sortable';
  };

  const content = sortable ? (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={onSort}
      aria-label={`Sort by ${children}, currently ${getSortLabel()}`}
    >
      {children}
      {renderSortIcon()}
    </Button>
  ) : (
    children
  );

  return (
    <th
      scope={scope}
      className={cn(
        'h-10 px-4 text-left align-middle font-semibold text-muted-foreground',
        sortable && 'cursor-pointer select-none',
        className
      )}
      aria-sort={
        sortDirection === 'asc' ? 'ascending' :
        sortDirection === 'desc' ? 'descending' :
        sortable ? 'none' : undefined
      }
      abbr={abbr}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {content}
    </th>
  );
}

// Table Cell
interface TableCellProps {
  children: ReactNode;
  className?: string;
  isHeader?: boolean; // For row headers
  colSpan?: number;
  rowSpan?: number;
}

export function TableCell({
  children,
  className,
  isHeader = false,
  colSpan,
  rowSpan,
}: TableCellProps) {
  if (isHeader) {
    return (
      <th
        scope="row"
        className={cn(
          'p-4 align-middle font-medium',
          className
        )}
        colSpan={colSpan}
        rowSpan={rowSpan}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={cn(
        'p-4 align-middle',
        className
      )}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}

// Empty State for Tables
interface TableEmptyStateProps {
  message: string;
  description?: string;
  colSpan: number;
  className?: string;
}

export function TableEmptyState({
  message,
  description,
  colSpan,
  className,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('p-8 text-center', className)}>
        <p className="font-medium text-muted-foreground">{message}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </td>
    </tr>
  );
}

// Loading State for Tables
interface TableLoadingStateProps {
  colSpan: number;
  rows?: number;
  className?: string;
}

export function TableLoadingState({
  colSpan,
  rows = 3,
  className,
}: TableLoadingStateProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className={className}>
          {Array.from({ length: colSpan }).map((_, cellIndex) => (
            <td key={cellIndex} className="p-4">
              <div
                className="h-4 bg-muted animate-pulse rounded"
                aria-hidden="true"
              />
            </td>
          ))}
        </tr>
      ))}
      <tr>
        <td colSpan={colSpan}>
          <VisuallyHidden>Loading data...</VisuallyHidden>
        </td>
      </tr>
    </>
  );
}

// Pagination Info for Screen Readers
interface TablePaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemName?: string;
}

export function TablePaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemName = 'items',
}: TablePaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
      Showing {startItem} to {endItem} of {totalItems} {itemName}.
      Page {currentPage} of {totalPages}.
    </p>
  );
}

// Example Usage Component
export function AccessibleTableExample() {
  const data = [
    { id: 1, name: 'Product A', price: 29.99, category: 'Electronics' },
    { id: 2, name: 'Product B', price: 49.99, category: 'Home' },
    { id: 3, name: 'Product C', price: 19.99, category: 'Electronics' },
  ];

  return (
    <AccessibleTable
      caption="Product inventory as of January 2026"
      summary="Table showing product names, prices, and categories. Click column headers to sort."
    >
      <TableHeader>
        <TableRow>
          <TableHead scope="col" sortable>Name</TableHead>
          <TableHead scope="col" sortable>Price</TableHead>
          <TableHead scope="col">Category</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell isHeader>{item.name}</TableCell>
            <TableCell>${item.price.toFixed(2)}</TableCell>
            <TableCell>{item.category}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AccessibleTable>
  );
}
