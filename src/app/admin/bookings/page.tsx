'use client';

import { useState } from 'react';
import { Booking } from '@/types';
import { services } from '@/data/services';

// Mock data for bookings (shared with dashboard for now)
const initialBookings: Booking[] = [
    {
        id: 'BK-001',
        salonId: '1',
        serviceId: 'hair-coloring',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        customerPhone: '+91 98765 43210',
        date: '2024-06-15',
        time: '10:00',
        status: 'assigned',
        totalAmount: 2500
    },
    {
        id: 'BK-002',
        salonId: '2',
        serviceId: 'haircut',
        customerName: 'Bob Smith',
        customerEmail: 'bob@example.com',
        customerPhone: '+91 98765 43211',
        date: '2024-06-15',
        time: '11:30',
        status: 'not_assigned',
        totalAmount: 800
    },
    {
        id: 'BK-003',
        salonId: '3',
        serviceId: 'spa-treatment',
        customerName: 'Carol White',
        customerEmail: 'carol@example.com',
        customerPhone: '+91 98765 43212',
        date: '2024-06-16',
        time: '14:00',
        status: 'reschedule',
        totalAmount: 3000
    },
    {
        id: 'BK-004',
        salonId: '1',
        serviceId: 'manicure-pedicure',
        customerName: 'David Brown',
        customerEmail: 'david@example.com',
        customerPhone: '+91 98765 43213',
        date: '2024-06-16',
        time: '16:00',
        status: 'assigned',
        totalAmount: 1200
    },
    {
        id: 'BK-005',
        salonId: '4',
        serviceId: 'makeup',
        customerName: 'Eva Green',
        customerEmail: 'eva@example.com',
        customerPhone: '+91 98765 43214',
        date: '2024-06-17',
        time: '09:00',
        status: 'not_assigned',
        totalAmount: 3500
    }
];

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const handleStatusChange = (id: string, newStatus: Booking['status']) => {
        setBookings(bookings.map(booking =>
            booking.id === id ? { ...booking, status: newStatus } : booking
        ));
    };

    const filteredBookings = filterStatus === 'all'
        ? bookings
        : bookings.filter(b => b.status === filterStatus);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'assigned': return 'badge-success';
            case 'not_assigned': return 'badge-warning';
            case 'reschedule': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getServiceName = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        return service?.name || 'Unknown Service';
    };

    return (
        <div className="bookings-page">
            <div className="dashboard-content-card">
                <div className="card-header-flex">
                    <h3>All Bookings</h3>
                    <div className="filter-controls">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="admin-select"
                        >
                            <option value="all">All Statuses</option>
                            <option value="assigned">Assigned</option>
                            <option value="not_assigned">Not Assigned</option>
                            <option value="reschedule">Reschedule</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Customer</th>
                                <th>Date & Time</th>
                                <th>Booked Services</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="font-mono">{booking.id}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <span className="customer-name">{booking.customerName}</span>
                                            <span className="customer-email">{booking.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="datetime-cell">
                                            <span>{booking.date}</span>
                                            <span className="text-secondary">{booking.time}</span>
                                        </div>
                                    </td>
                                    <td>{getServiceName(booking.serviceId)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                                            {formatStatus(booking.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons-group">
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'assigned')}
                                                className={`btn-action ${booking.status === 'assigned' ? 'active' : ''}`}
                                                title="Stylist Assigned"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'not_assigned')}
                                                className={`btn-action ${booking.status === 'not_assigned' ? 'active' : ''}`}
                                                title="Stylist Not Assigned"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="8.5" cy="7" r="4" />
                                                    <line x1="23" y1="11" x2="17" y2="11" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'reschedule')}
                                                className={`btn-action ${booking.status === 'reschedule' ? 'active' : ''}`}
                                                title="Reschedule"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 4v6h-6" />
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
