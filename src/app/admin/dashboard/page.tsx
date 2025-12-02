'use client';

import { useState } from 'react';
import { Booking } from '@/types';

// Mock data for bookings
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

export default function AdminDashboard() {
    const [bookings] = useState<Booking[]>(initialBookings);

    const stats = [
        {
            title: 'Total Clients',
            value: '17',
            subtitle: 'Total Clients',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: '#FFB8B8',
        },
        {
            title: 'Total Services',
            value: '35',
            subtitle: 'Total Clients',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m5.196-13.196l-4.243 4.243m0 5.657l-4.243 4.243M23 12h-6m-6 0H5m13.196 5.196l-4.243-4.243m0-5.657L18.196 2.804" />
                </svg>
            ),
            color: '#C9B3FF',
        },
        {
            title: 'Employees',
            value: '22',
            subtitle: 'Total Clients',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
            color: '#B8C9FF',
        },
        {
            title: 'Appointments',
            value: '07',
            subtitle: 'Total Clients',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            color: '#B8E7D4',
        },
    ];

    return (
        <div className="admin-dashboard">
            <div className="dashboard-stats-enhanced">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card-enhanced" style={{ backgroundColor: stat.color }}>
                        <div className="stat-card-icon">
                            {stat.icon}
                        </div>
                        <div className="stat-card-content">
                            <h3>{stat.title}</h3>
                            <p className="stat-value-large">{stat.value}</p>
                            <span className="stat-subtitle">{stat.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-welcome">
                <h3>Welcome back, Admin!</h3>
                <p>Select "Bookings" from the sidebar to manage appointments.</p>
            </div>
        </div>
    );
}
