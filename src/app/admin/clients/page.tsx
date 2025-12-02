'use client';

import { useState } from 'react';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    joinDate: string;
    totalBookings: number;
    totalSpent: number;
    preferredServices: string[];
    status: 'active' | 'inactive';
}

// Mock client data
const initialClients: Client[] = [
    {
        id: 'CL-001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+91 98765 43210',
        joinDate: '2024-01-15',
        totalBookings: 12,
        totalSpent: 28500,
        preferredServices: ['Hair Coloring', 'Spa Treatment'],
        status: 'active',
    },
    {
        id: 'CL-002',
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+91 98765 43211',
        joinDate: '2024-02-20',
        totalBookings: 8,
        totalSpent: 15200,
        preferredServices: ['Haircut & Styling', 'Facial Treatment'],
        status: 'active',
    },
    {
        id: 'CL-003',
        name: 'Carol White',
        email: 'carol@example.com',
        phone: '+91 98765 43212',
        joinDate: '2023-11-10',
        totalBookings: 15,
        totalSpent: 42000,
        preferredServices: ['Spa Treatment', 'Professional Makeup'],
        status: 'active',
    },
    {
        id: 'CL-004',
        name: 'David Brown',
        email: 'david@example.com',
        phone: '+91 98765 43213',
        joinDate: '2024-03-05',
        totalBookings: 6,
        totalSpent: 9800,
        preferredServices: ['Manicure & Pedicure'],
        status: 'active',
    },
    {
        id: 'CL-005',
        name: 'Eva Green',
        email: 'eva@example.com',
        phone: '+91 98765 43214',
        joinDate: '2023-12-22',
        totalBookings: 10,
        totalSpent: 32500,
        preferredServices: ['Professional Makeup', 'Hair Coloring'],
        status: 'active',
    },
    {
        id: 'CL-006',
        name: 'Frank Miller',
        email: 'frank@example.com',
        phone: '+91 98765 43215',
        joinDate: '2024-01-30',
        totalBookings: 3,
        totalSpent: 4500,
        preferredServices: ['Haircut & Styling'],
        status: 'inactive',
    },
];

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const filteredClients = filterStatus === 'all'
        ? clients
        : clients.filter(c => c.status === filterStatus);

    const getStatusBadgeClass = (status: string) => {
        return status === 'active' ? 'badge-success' : 'badge-secondary';
    };

    const formatStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="clients-page">
            <div className="dashboard-content-card">
                <div className="card-header-flex">
                    <h3>Clients Management</h3>
                    <div className="filter-controls">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="admin-select"
                        >
                            <option value="all">All Clients</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Client ID</th>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Join Date</th>
                                <th>Total Bookings</th>
                                <th>Total Spent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr key={client.id}>
                                    <td className="font-mono">{client.id}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <span className="customer-name">{client.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            <span>{client.email}</span>
                                            <span className="text-secondary">{client.phone}</span>
                                        </div>
                                    </td>
                                    <td>{new Date(client.joinDate).toLocaleDateString()}</td>
                                    <td className="text-center">{client.totalBookings}</td>
                                    <td className="font-medium">₹{client.totalSpent.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(client.status)}`}>
                                            {formatStatus(client.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedClient(client)}
                                            className="btn-action"
                                            title="View Details"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Details Modal */}
            {selectedClient && (
                <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Client Details</h3>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="client-detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Client ID</span>
                                    <span className="detail-value font-mono">{selectedClient.id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Name</span>
                                    <span className="detail-value">{selectedClient.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{selectedClient.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{selectedClient.phone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Join Date</span>
                                    <span className="detail-value">
                                        {new Date(selectedClient.joinDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`status-badge ${getStatusBadgeClass(selectedClient.status)}`}>
                                        {formatStatus(selectedClient.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="client-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{selectedClient.totalBookings}</span>
                                    <span className="stat-label">Total Bookings</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">₹{selectedClient.totalSpent.toLocaleString()}</span>
                                    <span className="stat-label">Total Spent</span>
                                </div>
                            </div>

                            <div className="preferences-section">
                                <h4>Preferred Services</h4>
                                <div className="preferences-tags">
                                    {selectedClient.preferredServices.map((service, index) => (
                                        <span key={index} className="preference-tag">
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
