'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '@/components/admin/DataTable';
import EmployeeSelectionModal from '@/components/admin/EmployeeSelectionModal';

interface Booking {
    id: string;
    salonName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    services: Array<{
        id: string;
        name: string;
        price: number;
        duration: number;
    }>;
    date: string;
    time: string;
    totalAmount: number;
    status: 'not_assigned' | 'assigned' | 'pending' | 'reschedule';
    assignedEmployeeId?: string;
    assignedEmployeeName?: string;
    createdAt?: any;
    updatedAt?: any;
}

// Custom Status Dropdown Component
const StatusDropdown = ({ currentStatus, onStatusChange }: { currentStatus: string, onStatusChange: (status: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statusOptions = [
        { value: 'not_assigned', label: 'Not Assigned', color: '#6B7280' },
        { value: 'assigned', label: 'Assigned', color: '#059669' },
        { value: 'pending', label: 'Pending', color: '#D97706' },
        { value: 'reschedule', label: 'Reschedule', color: '#DC2626' },
    ];

    const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="status-dropdown-container" ref={dropdownRef}>
            <button
                className={`status-trigger-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <div className="status-content-wrapper">
                    <span
                        className="status-dot"
                        style={{ backgroundColor: currentOption.color }}
                    ></span>
                    <span className="status-text">{currentOption.label}</span>
                </div>
                <span className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="status-dropdown-menu">
                    {statusOptions.map((option) => (
                        <div
                            key={option.value}
                            className={`status-option-item ${currentStatus === option.value ? 'selected' : ''}`}
                            onClick={() => {
                                onStatusChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <span
                                className="option-dot"
                                style={{ backgroundColor: option.color }}
                            ></span>
                            <span className="option-text">{option.label}</span>
                            {currentStatus === option.value && (
                                <span className="check-mark">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'not_assigned' | 'assigned' | 'pending' | 'reschedule'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

    // Fetch bookings from Firestore in real-time
    useEffect(() => {
        const bookingsQuery = query(
            collection(db, 'bookings'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData: Booking[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Booking));

            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching bookings:', error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Update booking status
    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'bookings', bookingId), {
                status: newStatus,
                updatedAt: Timestamp.now()
            });
            console.log('✅ Status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    // Open modal for employee assignment
    const handleAssignEmployee = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setIsModalOpen(true);
    };

    // Handle employee selection from modal
    const handleEmployeeSelect = async (employee: any) => {
        if (!selectedBookingId) return;

        try {
            await updateDoc(doc(db, 'bookings', selectedBookingId), {
                assignedEmployeeId: employee.id,
                assignedEmployeeName: employee.name,
                status: 'assigned',
                updatedAt: Timestamp.now()
            });
            console.log('✅ Employee assigned successfully:', employee.name);
        } catch (error) {
            console.error('Error assigning employee:', error);
            alert('Failed to assign employee. Please try again.');
        }
    };

    // Filter bookings
    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(booking => booking.status === filter);

    const columns: Array<{
        header: string;
        accessor: keyof Booking | ((row: Booking) => React.ReactNode);
        sortable?: boolean;
        className?: string;
    }> = [
            {
                header: 'Booking ID',
                accessor: (row: Booking) => <span className="booking-id">#{row.id.substring(0, 6)}</span>,
                sortable: true,
            },
            {
                header: 'Customer',
                accessor: (row: Booking) => (
                    <div className="customer-info">
                        <strong>{row.customerName}</strong>
                    </div>
                ),
                sortable: true,
            },
            {
                header: 'Contact',
                accessor: (row: Booking) => (
                    <div className="contact-info">
                        <div className="email">{row.customerEmail}</div>
                        <div className="phone">{row.customerPhone}</div>
                    </div>
                ),
            },
            {
                header: 'Salon',
                accessor: 'salonName',
                sortable: true,
            },
            {
                header: 'Services',
                accessor: (row: Booking) => (
                    <div className="services-list">
                        {row.services?.map((service, idx) => (
                            <span key={idx} className="service-tag">
                                {service.name}
                            </span>
                        ))}
                    </div>
                ),
            },
            {
                header: 'Date & Time',
                accessor: (row: Booking) => (
                    <div className="datetime-info">
                        <div className="date">{new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="time">{row.time}</div>
                    </div>
                ),
                sortable: true,
            },
            {
                header: 'Amount',
                accessor: (row: Booking) => <span className="amount">₹{row.totalAmount}</span>,
                sortable: true,
            },
            {
                header: 'Status',
                accessor: (row: Booking) => (
                    <StatusDropdown
                        currentStatus={row.status}
                        onStatusChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                    />
                ),
                sortable: true,
            },
            {
                header: 'Employee',
                accessor: (row: Booking) => row.assignedEmployeeName ? (
                    <span className="employee-badge">
                        {row.assignedEmployeeName}
                    </span>
                ) : (
                    <span className="no-employee">—</span>
                ),
                sortable: true,
            },
        ];

    const actions = (row: Booking) => (
        <div className="action-buttons">
            <button
                className="btn-action-assign"
                onClick={() => handleAssignEmployee(row.id)}
                title="Assign / Reassign Employee"
            >
                Assign
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="bookings-page">
                <div className="page-header">
                    <h1>Bookings</h1>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loading-spinner">Loading bookings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bookings-page">
            <div className="page-header">
                <div>
                    <h1>Bookings</h1>
                    <p className="page-subtitle">
                        Manage your salon schedules and assignments
                    </p>
                </div>
                <button className="btn-export">
                    <span>↓</span> Export CSV
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All ({bookings.length})
                </button>
                <button
                    className={filter === 'not_assigned' ? 'active' : ''}
                    onClick={() => setFilter('not_assigned')}
                >
                    Not Assigned ({bookings.filter(b => b.status === 'not_assigned').length})
                </button>
                <button
                    className={filter === 'assigned' ? 'active' : ''}
                    onClick={() => setFilter('assigned')}
                >
                    Assigned ({bookings.filter(b => b.status === 'assigned').length})
                </button>
                <button
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button
                    className={filter === 'reschedule' ? 'active' : ''}
                    onClick={() => setFilter('reschedule')}
                >
                    Reschedule ({bookings.filter(b => b.status === 'reschedule').length})
                </button>
            </div>

            <DataTable
                data={filteredBookings}
                columns={columns}
                actions={actions}
                searchable={true}
                searchKeys={['customerName', 'customerEmail', 'salonName', 'id']}
                title="Requests"
            />

            <EmployeeSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleEmployeeSelect}
            />

            <style jsx>{`
                .bookings-page {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .page-header h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    color: #111827;
                }

                .page-subtitle {
                    color: #6B7280;
                    font-size: 0.95rem;
                }

                .btn-export {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    color: #374151;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-export:hover {
                    border-color: #D1D5DB;
                    background: #F9FAFB;
                }

                .filter-tabs {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    border-bottom: 1px solid #E5E7EB;
                    padding-bottom: 1rem;
                }

                .filter-tabs button {
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #6B7280;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }

                .filter-tabs button:hover {
                    color: #111827;
                    background: #F3F4F6;
                }

                .filter-tabs button.active {
                    background: #111827;
                    color: white;
                }

                .booking-id {
                    font-family: 'Courier New', monospace;
                    color: #6B7280;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .services-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                }

                .service-tag {
                    background: #F3F4F6;
                    color: #4B5563;
                    padding: 0.2rem 0.6rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    border: 1px solid #E5E7EB;
                }

                .datetime-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .datetime-info .date {
                    font-weight: 500;
                    color: #111827;
                }

                .datetime-info .time {
                    color: #6B7280;
                    font-size: 0.85rem;
                }

                .amount {
                    font-weight: 600;
                    color: #111827;
                }

                .contact-info .email {
                    color: #111827;
                }
                .contact-info .phone {
                    color: #6B7280;
                    font-size: 0.85rem;
                }

                /* ------- STATUS DROPDOWN STYLES ------- */
                .status-dropdown-container {
                    position: relative;
                    min-width: 160px; /* Ensure minimum width to prevent squashing */
                }

                .status-trigger-btn {
                    width: 100%;
                    height: 38px; /* Fixed height for consistency */
                    padding: 0 0.875rem;
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 9999px; /* Pill shape */
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    font-family: inherit;
                }

                .status-trigger-btn:hover {
                    border-color: #D1D5DB;
                    background: #F9FAFB;
                    transform: translateY(-1px);
                }

                .status-trigger-btn.active {
                    border-color: #3B82F6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }

                .status-content-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0; /* Prevent dot from shrinking */
                }

                .status-text {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    white-space: nowrap; /* Prevent text wrapping */
                }

                .dropdown-arrow {
                    color: #9CA3AF;
                    display: flex;
                    align-items: center;
                    transition: transform 0.2s;
                    margin-left: 0.5rem;
                }

                .dropdown-arrow.rotate {
                    transform: rotate(180deg);
                }

                .status-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    width: 100%;
                    min-width: 180px; /* Menu slightly wider than trigger */
                    background: white;
                    border-radius: 12px;
                    padding: 0.375rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border: 1px solid #F3F4F6;
                    z-index: 50;
                    animation: fadeIn 0.15s ease-out;
                }

                .status-option-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .status-option-item:hover {
                    background: #F3F4F6;
                }

                .status-option-item.selected {
                    background: #F0FDF4; /* Light hint of green */
                }

                .option-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .option-text {
                    font-size: 0.875rem;
                    color: #374151;
                    flex: 1;
                    white-space: nowrap;
                }

                .check-mark {
                    color: #10B981;
                    display: flex;
                    align-items: center;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ------- ACTION BUTTON STYLES ------- */
                .btn-action-assign {
                    background: white;
                    border: 1px solid #D1D5DB;
                    color: #374151;
                    padding: 0.4rem 1rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 32px;
                }

                .btn-action-assign:hover {
                    border-color: #9CA3AF;
                    background: #F9FAFB;
                    color: #111827;
                }

                /* ------- OTHER STYLES ------- */
                .employee-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #374151;
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding: 0.25rem 0.75rem;
                    background: #F9FAFB;
                    border-radius: 9999px;
                    border: 1px solid #F3F4F6;
                    white-space: nowrap;
                }
                
                .employee-badge::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: #10B981;
                    border-radius: 50%;
                }

                .no-employee {
                    color: #9CA3AF;
                    font-size: 0.875rem;
                    padding-left: 0.5rem;
                }

                .loading-spinner {
                    font-size: 1.25rem;
                    color: #6B7280;
                }
            `}</style>
        </div>
    );
}
