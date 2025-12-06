'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '@/components/admin/DataTable';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: string;
    preferredServices: string[];
    status: 'active' | 'inactive';
    createdAt?: any;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Fetch clients and aggregate booking data
    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            // Get all bookings to aggregate client data
            const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
            const clientMap = new Map<string, Client>();

            bookingsSnapshot.docs.forEach(doc => {
                const booking = doc.data();
                const email = booking.customerEmail;

                if (!clientMap.has(email)) {
                    clientMap.set(email, {
                        id: email,
                        name: booking.customerName,
                        email: email,
                        phone: booking.customerPhone,
                        totalBookings: 0,
                        totalSpent: 0,
                        preferredServices: [],
                        status: 'active',
                        lastBookingDate: booking.date,
                    });
                }

                const client = clientMap.get(email)!;
                client.totalBookings += 1;
                client.totalSpent += booking.totalAmount || 0;

                // Track service preferences
                if (booking.services && Array.isArray(booking.services)) {
                    booking.services.forEach((service: any) => {
                        if (!client.preferredServices.includes(service.name)) {
                            client.preferredServices.push(service.name);
                        }
                    });
                }
            });

            setClients(Array.from(clientMap.values()));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setLoading(false);
        }
    };

    const handleAddClient = async () => {
        if (!newClient.name || !newClient.email || !newClient.phone) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await addDoc(collection(db, 'clients'), {
                ...newClient,
                totalBookings: 0,
                totalSpent: 0,
                preferredServices: [],
                status: 'active',
                createdAt: Timestamp.now(),
            });

            setShowAddModal(false);
            setNewClient({ name: '', email: '', phone: '' });
            fetchClients();
            alert('✅ Client added successfully!');
        } catch (error) {
            console.error('Error adding client:', error);
            alert('Failed to add client');
        }
    };

    const columns: Array<{
        header: string;
        accessor: keyof Client | ((row: Client) => React.ReactNode);
        sortable?: boolean;
        className?: string;
    }> = [
            {
                header: 'Client Name',
                accessor: (row: Client) => <strong>{row.name}</strong>,
                sortable: true,
            },
            {
                header: 'Contact Info',
                accessor: (row: Client) => (
                    <div className="contact-info">
                        <div>📧 {row.email}</div>
                        <small>📱 {row.phone}</small>
                    </div>
                ),
            },
            {
                header: 'Total Bookings',
                accessor: 'totalBookings',
                sortable: true,
                className: 'booking-count',
            },
            {
                header: 'Total Spent',
                accessor: (row: Client) => <span className="amount">₹{row.totalSpent.toLocaleString()}</span>,
                sortable: true,
            },
            {
                header: 'Preferred Services',
                accessor: (row: Client) => (
                    <div className="services-list">
                        {row.preferredServices.slice(0, 2).map((service, idx) => (
                            <span key={idx} className="service-tag">
                                {service}
                            </span>
                        ))}
                        {row.preferredServices.length > 2 && (
                            <span className="service-tag more">
                                +{row.preferredServices.length - 2}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: 'Last Booking',
                accessor: (row: Client) => row.lastBookingDate || 'N/A',
                sortable: true,
            },
            {
                header: 'Status',
                accessor: (row: Client) => (
                    <span className={`status-badge ${row.status}`}>
                        {row.status}
                    </span>
                ),
                sortable: true,
            },
        ];

    if (loading) {
        return (
            <div className="clients-page">
                <div className="page-header">
                    <h1>Client Management</h1>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loading-spinner">Loading clients...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="clients-page">
            <div className="page-header">
                <h1>Client Management</h1>
                <p className="page-subtitle">
                    Manage customer profiles and track booking history
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{clients.length}</div>
                        <div className="stat-label">Total Clients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{clients.filter(c => c.status === 'active').length}</div>
                        <div className="stat-label">Active Clients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <div className="stat-value">{clients.reduce((sum, c) => sum + c.totalBookings, 0)}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-value">₹{clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</div>
                        <div className="stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            <div className="toolbar">
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Client
                </button>
            </div>

            <DataTable
                data={clients}
                columns={columns}
                searchable={true}
                searchKeys={['name', 'email', 'phone']}
                title="All Clients"
            />

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Client</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-field">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="Enter client name"
                                />
                            </div>
                            <div className="form-field">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div className="form-field">
                                <label>Phone *</label>
                                <input
                                    type="tel"
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleAddClient}>
                                Add Client
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .clients-page {
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
                }

                .toolbar {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 1rem;
                }

                .btn-primary {
                    background: #FF6B9D;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    background: #E5427A;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .stat-icon {
                    font-size: 2.5rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1F2937;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #6B7280;
                }

                .contact-info div {
                    margin-bottom: 0.25rem;
                }

                .contact-info small {
                    color: #6B7280;
                }

                .booking-count {
                    font-weight: 700;
                    color: #3B82F6;
                }

                .amount {
                    font-weight: 700;
                    color: #10B981;
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

                .service-tag.more {
                    background: #E5E7EB;
                    font-weight: 600;
                }

                .status-badge {
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .status-badge.active {
                    background: #D1FAE5;
                    color: #065F46;
                }

                .status-badge.inactive {
                    background: #FEE2E2;
                    color: #991B1B;
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

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #E5E7EB;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #6B7280;
                    line-height: 1;
                }

                .close-btn:hover {
                    color: #1F2937;
                }

                .modal-body {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-field label {
                    font-weight: 600;
                    color: #374151;
                }

                .form-field input {
                    padding: 0.75rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-field input:focus {
                    outline: none;
                    border-color: #FF6B9D;
                }

                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid #E5E7EB;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .btn-secondary {
                    background: white;
                    color: #374151;
                    padding: 0.75rem 1.5rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .btn-secondary:hover {
                    background: #F9FAFB;
                }
            `}</style>
        </div>
    );
}
