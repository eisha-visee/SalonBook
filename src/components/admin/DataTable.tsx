'use client';

import { useState, useMemo } from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    rowsPerPage?: number;
    actions?: (row: T) => React.ReactNode;
    onExport?: () => void;
    title?: string;
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    searchable = true,
    searchKeys = [],
    rowsPerPage = 10,
    actions,
    onExport,
    title,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null);

    // Filter data
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((row) => {
            return searchKeys.some((key) => {
                const value = row[key];
                if (typeof value === 'string' || typeof value === 'number') {
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                }
                return false;
            });
        });
    }, [data, searchTerm, searchKeys]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = sortConfig.key in a ? a[sortConfig.key as keyof T] : '';
            const bValue = sortConfig.key in b ? b[sortConfig.key as keyof T] : '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSort = (key: keyof T | string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        if (onExport) {
            onExport();
        } else {
            // Default CSV export
            const headers = columns.map(col => col.header).join(',');
            const csvContent = [
                headers,
                ...sortedData.map(row =>
                    columns.map(col => {
                        const val = typeof col.accessor === 'function'
                            ? 'Computed'
                            : row[col.accessor as keyof T];
                        return `"${val}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="data-table-container">
            <div className="data-table-header">
                {title && <h2 className="table-title">{title}</h2>}
                <div className="header-actions">
                    {searchable && (
                        <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => col.sortable && typeof col.accessor !== 'function' && handleSort(col.accessor as string)}
                                    className={col.sortable ? 'sortable' : ''}
                                >
                                    <div className="th-content">
                                        {col.header}
                                        {col.sortable && sortConfig?.key === col.accessor && (
                                            <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row) => (
                                <tr key={row.id}>
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={col.className}>
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(row)
                                                : (row[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td>
                                            <div className="row-actions">
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="no-data">
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <span className="pagination-info">
                    Showing {Math.min((currentPage - 1) * rowsPerPage + 1, sortedData.length)} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
                </span>
                <div className="pagination-controls">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={currentPage === page ? 'active' : ''}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            <style jsx>{`
                .data-table-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                }

                .data-table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .table-title {
                    font-size: 1.25rem;
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .search-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-box svg {
                    position: absolute;
                    left: 0.75rem;
                    color: #9CA3AF;
                }

                .search-box input {
                    padding: 0.625rem 1rem 0.625rem 2.5rem;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    width: 250px;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: #FF6B9D;
                    box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.1);
                }

                .btn-export {
                    padding: 0.625rem 1rem;
                    background: #F3F4F6;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    color: #374151;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-export:hover {
                    background: #E5E7EB;
                }

                .table-responsive {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    width: 100%;
                    max-width: 100%;
                    display: block;
                    padding-bottom: 0.5rem; /* Space for scrollbar */
                }

                .table-responsive::-webkit-scrollbar {
                    height: 8px;
                }

                .table-responsive::-webkit-scrollbar-track {
                    background: #F3F4F6;
                    border-radius: 4px;
                }

                .table-responsive::-webkit-scrollbar-thumb {
                    background: #D1D5DB;
                    border-radius: 4px;
                }

                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #9CA3AF;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th {
                    text-align: left;
                    padding: 0.75rem 1rem;
                    background: #F9FAFB;
                    color: #6B7280;
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #E5E7EB;
                    white-space: nowrap;
                }

                .data-table th.sortable {
                    cursor: pointer;
                }

                .data-table th.sortable:hover {
                    background: #F3F4F6;
                }

                .th-content {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .data-table td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid #E5E7EB;
                    color: #374151;
                    font-size: 0.875rem;
                    white-space: nowrap;
                }

                .data-table th:last-child {
                    position: sticky;
                    right: 0;
                    background: #F9FAFB;
                    z-index: 20;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.05);
                }

                .data-table td:last-child {
                    position: sticky;
                    right: 0;
                    background: white;
                    z-index: 10;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.05);
                }

                .data-table tr:last-child td {
                    border-bottom: none;
                }

                .no-data {
                    text-align: center;
                    padding: 3rem;
                    color: #9CA3AF;
                }

                .pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #E5E7EB;
                }

                .pagination-info {
                    font-size: 0.875rem;
                    color: #6B7280;
                }

                .pagination-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .pagination-controls button {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #E5E7EB;
                    background: white;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                }

                .pagination-controls button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .pagination-controls button.active {
                    background: #FF6B9D;
                    color: white;
                    border-color: #FF6B9D;
                }

                .pagination-controls button:hover:not(:disabled):not(.active) {
                    background: #F9FAFB;
                }

                .row-actions {
                    display: flex;
                    gap: 0.5rem;
                }
            `}</style>
        </div>
    );
}
