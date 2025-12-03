'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '@/components/admin/DataTable';

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

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'not_assigned' | 'assigned' | 'pending' | 'reschedule'>('all');

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

    // Assign employee to booking
    const handleAssignEmployee = async (bookingId: string) => {
        const employeeName = prompt('Enter employee name:');
        if (employeeName) {
            try {
                await updateDoc(doc(db, 'bookings', bookingId), {
                    assignedEmployeeName: employeeName,
                    status: 'assigned',
                    updatedAt: Timestamp.now()
                });
                console.log('✅ Employee assigned successfully');
            } catch (error) {
                console.error('Error assigning employee:', error);
                alert('Failed to assign employee. Please try again.');
            }
        }
    };

    // Filter bookings
    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(booking => booking.status === filter);

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'assigned':
                return '#10B981';
            case 'pending':
                return '#F59E0B';
            case 'reschedule':
                return '#EF4444';
            case 'not_assigned':
            default:
                return '#6B7280';
        }
    };

    const columns: Array<{
        header: string;
        accessor: keyof Booking | ((row: Booking) => React.ReactNode);
        sortable?: boolean;
        className?: string;
    }> = [
            {
                header: 'Booking ID',
                accessor: (row: Booking) => <span className="booking-id">{row.id.substring(0, 8)}</span>,
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
                        <div>{row.customerEmail}</div>
                        <small>{row.customerPhone}</small>
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
                        <div>📅 {row.date}</div>
                        <small>🕐 {row.time}</small>
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
                    <select
                        className="status-select"
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        style={{
                            backgroundColor: getStatusColor(row.status),
                            color: 'white'
                        }}
                    >
                        <option value="not_assigned">Not Assigned</option>
                        <option value="assigned">Assigned</option>
                        <option value="pending">Pending</option>
                        <option value="reschedule">Reschedule</option>
                    </select>
                ),
                sortable: true,
            },
            {
                header: 'Employee',
                accessor: (row: Booking) => row.assignedEmployeeName ? (
                    <span className="employee-badge">
                        👤 {row.assignedEmployeeName}
                    </span>
                ) : (
                    <span className="no-employee">Not assigned</span>
                ),
                sortable: true,
            },
        ];

    const actions = (row: Booking) => (
        <div className="action-buttons">
            <button
                className="btn-icon"
                onClick={() => handleAssignEmployee(row.id)}
                title="Assign Employee"
            >
                👤
            </button>
            <button
                className="btn-icon"
                onClick={() => alert(`View details for: ${row.id}`)}
                title="View Details"
            >
                👁️
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="bookings-page">
                <div className="page-header">
                    <h1>Bookings Management</h1>
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
                <h1>Bookings Management</h1>
                <p className="page-subtitle">
                    Manage and track all salon bookings in real-time
                </p>
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
                title="Recent Bookings"
            />

            <style jsx>{`
                .bookings-page {
                    padding: 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #6B7280;
                    font-size: 1rem;
                }

                .filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .filter-tabs button {
                    padding: 0.75rem 1.5rem;
                    border: 2px solid #E5E7EB;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .filter-tabs button:hover {
                    border-color: #FF6B9D;
                }

                .filter-tabs button.active {
                    background: #FF6B9D;
                    border-color: #FF6B9D;
                    color: white;
                }

                .booking-id {
                    font-family: monospace;
                    color: #6B7280;
                }

                .services-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .service-tag {
                    background: #F3F4F6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    display: inline-block;
                }

                .datetime-info div {
                    margin-bottom: 0.25rem;
                }

                .datetime-info small {
                    color: #6B7280;
                }

                .amount {
                    font-weight: 700;
                    color: #10B981;
                }

                .status-select {
                    padding: 0.5rem;
                    border-radius: 6px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .employee-badge {
                    background: #DBEAFE;
                    color: #1E40AF;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: inline-block;
                }

                .no-employee {
                    color: #9CA3AF;
                    font-style: italic;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-icon {
                    background: #F3F4F6;
                    border: none;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1.25rem;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: #E5E7EB;
                    transform: scale(1.1);
                }

                .loading-spinner {
                    font-size: 1.25rem;
                    color: #6B7280;
                }

                .contact-info {
                    font-size: 0.875rem;
                }

                .contact-info div {
                    margin-bottom: 0.25rem;
                }

                .contact-info small {
                    color: #6B7280;
                }
            `}</style>
        </div>
    );
}
