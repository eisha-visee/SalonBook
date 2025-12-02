'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '@/components/admin/DataTable';

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    specialties: string[];
    workSchedule: string;
    totalBookings: number;
    rating: number;
    status: 'available' | 'busy' | 'off-duty';
    joinDate?: string;
    createdAt?: any;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        specialties: '',
        workSchedule: '',
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const employeesSnapshot = await getDocs(collection(db, 'employees'));
            const employeesData: Employee[] = employeesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                totalBookings: doc.data().totalBookings || 0,
                rating: doc.data().rating || 5.0,
            } as Employee));

            setEmployees(employeesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setLoading(false);
        }
    };

    const handleAddEmployee = async () => {
        if (!newEmployee.name || !newEmployee.email || !newEmployee.role) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addDoc(collection(db, 'employees'), {
                ...newEmployee,
                specialties: newEmployee.specialties.split(',').map(s => s.trim()),
                totalBookings: 0,
                rating: 5.0,
                status: 'available',
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: Timestamp.now(),
            });

            setShowAddModal(false);
            setNewEmployee({ name: '', email: '', phone: '', role: '', specialties: '', workSchedule: '' });
            fetchEmployees();
            alert('✅ Employee added successfully!');
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Failed to add employee');
        }
    };

    const handleUpdateStatus = async (employeeId: string, newStatus: 'available' | 'busy' | 'off-duty') => {
        try {
            await updateDoc(doc(db, 'employees', employeeId), {
                status: newStatus,
            });
            fetchEmployees();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available': return 'badge-success';
            case 'busy': return 'badge-warning';
            case 'off-duty': return 'badge-secondary';
            default: return 'badge-secondary';
        }
    };

    const columns = [
        {
            header: 'Name',
            accessor: (row: Employee) => <strong>{row.name}</strong>,
            sortable: true,
        },
        {
            header: 'Role',
            accessor: (row: Employee) => <span className="role-badge">{row.role}</span>,
            sortable: true,
        },
        {
            header: 'Contact',
            accessor: (row: Employee) => (
                <div className="contact-info">
                    <div>📧 {row.email}</div>
                    <small>📱 {row.phone}</small>
                </div>
            ),
        },
        {
            header: 'Specialties',
            accessor: (row: Employee) => (
                <div className="specialties-list">
                    {row.specialties?.slice(0, 2).map((specialty, idx) => (
                        <span key={idx} className="specialty-tag">
                            {specialty}
                        </span>
                    ))}
                    {row.specialties?.length > 2 && (
                        <span className="specialty-tag more">
                            +{row.specialties.length - 2}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Schedule',
            accessor: 'workSchedule',
            className: 'schedule-cell',
        },
        {
            header: 'Bookings',
            accessor: 'totalBookings',
            sortable: true,
            className: 'booking-count',
        },
        {
            header: 'Rating',
            accessor: (row: Employee) => (
                <div className="rating-cell">
                    <span className="rating-star">★</span>
                    <span>{row.rating}</span>
                </div>
            ),
            sortable: true,
        },
        {
            header: 'Status',
            accessor: (row: Employee) => (
                <select
                    value={row.status}
                    onChange={(e) => handleUpdateStatus(row.id, e.target.value as any)}
                    className={`status-badge ${getStatusBadgeClass(row.status)}`}
                >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="off-duty">Off Duty</option>
                </select>
            ),
            sortable: true,
        },
    ];

    const actions = (row: Employee) => (
        <button
            onClick={() => setSelectedEmployee(row)}
            className="btn-icon"
            title="View Details"
        >
            👁️
        </button>
    );

    const filteredEmployees = filterStatus === 'all'
        ? employees
        : employees.filter(e => e.status === filterStatus);

    if (loading) {
        return (
            <div className="employees-page">
                <div className="page-header">
                    <h1>Employee Management</h1>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loading-spinner">Loading employees...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="employees-page">
            <div className="page-header">
                <h1>Employee Management</h1>
                <p className="page-subtitle">
                    Manage staff profiles and track performance
                </p>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="filter-controls">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="status-filter"
                    >
                        <option value="all">All Employees ({employees.length})</option>
                        <option value="available">Available ({employees.filter(e => e.status === 'available').length})</option>
                        <option value="busy">Busy ({employees.filter(e => e.status === 'busy').length})</option>
                        <option value="off-duty">Off Duty ({employees.filter(e => e.status === 'off-duty').length})</option>
                    </select>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Employee
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{employees.length}</div>
                        <div className="stat-label">Total Staff</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{employees.filter(e => e.status === 'available').length}</div>
                        <div className="stat-label">Available Now</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <div className="stat-value">{employees.reduce((sum, e) => sum + e.totalBookings, 0)}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                        <div className="stat-value">
                            {(employees.reduce((sum, e) => sum + e.rating, 0) / employees.length || 0).toFixed(1)}
                        </div>
                        <div className="stat-label">Avg Rating</div>
                    </div>
                </div>
            </div>

            <DataTable
                data={filteredEmployees}
                columns={columns}
                actions={actions}
                searchable={true}
                searchKeys={['name', 'email', 'role', 'specialties']}
                title="Staff Directory"
            />

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Employee</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-field">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                    placeholder="Enter employee name"
                                />
                            </div>
                            <div className="form-field">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    placeholder="employee@salonbook.com"
                                />
                            </div>
                            <div className="form-field">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={newEmployee.phone}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <div className="form-field">
                                <label>Role *</label>
                                <input
                                    type="text"
                                    value={newEmployee.role}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                    placeholder="e.g., Senior Stylist, Makeup Artist"
                                />
                            </div>
                            <div className="form-field">
                                <label>Specialties (comma-separated)</label>
                                <input
                                    type="text"
                                    value={newEmployee.specialties}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, specialties: e.target.value })}
                                    placeholder="Hair Coloring, Styling, Spa"
                                />
                            </div>
                            <div className="form-field">
                                <label>Work Schedule</label>
                                <input
                                    type="text"
                                    value={newEmployee.workSchedule}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, workSchedule: e.target.value })}
                                    placeholder="e.g., Mon-Fri, 9AM-6PM"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleAddEmployee}>
                                Add Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Details Modal */}
            {selectedEmployee && (
                <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Employee Details</h2>
                            <button className="close-btn" onClick={() => setSelectedEmployee(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Name</span>
                                    <span className="detail-value">{selectedEmployee.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Role</span>
                                    <span className="detail-value">{selectedEmployee.role}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{selectedEmployee.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{selectedEmployee.phone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Join Date</span>
                                    <span className="detail-value">{selectedEmployee.joinDate || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Schedule</span>
                                    <span className="detail-value">{selectedEmployee.workSchedule || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="stats-row">
                                <div className="stat-item">
                                    <span className="stat-value">{selectedEmployee.totalBookings}</span>
                                    <span className="stat-label">Total Bookings</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">★ {selectedEmployee.rating}</span>
                                    <span className="stat-label">Rating</span>
                                </div>
                            </div>

                            <div className="specialties-section">
                                <h4>Specialties</h4>
                                <div className="specialties-tags">
                                    {selectedEmployee.specialties?.map((specialty, index) => (
                                        <span key={index} className="specialty-tag-large">
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .employees-page {
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
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .status-filter {
                    padding: 0.75rem 1rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                }

                .status-filter:focus {
                    outline: none;
                    border-color: #FF6B9D;
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

                .role-badge {
                    background: #DBEAFE;
                    color: #1E40AF;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .contact-info div {
                    margin-bottom: 0.25rem;
                }

                .contact-info small {
                    color: #6B7280;
                }

                .specialties-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .specialty-tag {
                    background: #F3F4F6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    display: inline-block;
                }

                .specialty-tag.more {
                    background: #E5E7EB;
                    font-weight: 600;
                }

                .schedule-cell {
                    color: #6B7280;
                    font-size: 0.875rem;
                }

                .booking-count {
                    font-weight: 700;
                    color: #3B82F6;
                }

                .rating-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .rating-star {
                    color: #F59E0B;
                    font-size: 1.25rem;
                }

                .status-badge {
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                }

                .status-badge.badge-success {
                    background: #D1FAE5;
                    color: #065F46;
                }

                .status-badge.badge-warning {
                    background: #FEF3C7;
                    color: #92400E;
                }

                .status-badge.badge-secondary {
                    background: #F3F4F6;
                    color: #374151;
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
                    max-width: 600px;
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
                }

                .form-field {
                    margin-bottom: 1rem;
                }

                .form-field label {
                    display: block;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .form-field input {
                    width: 100%;
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

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .detail-label {
                    font-size: 0.875rem;
                    color: #6B7280;
                }

                .detail-value {
                    font-weight: 600;
                    color: #1F2937;
                }

                .stats-row {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: #F9FAFB;
                    border-radius: 8px;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .specialties-section h4 {
                    margin-bottom: 1rem;
                    color: #374151;
                }

                .specialties-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .specialty-tag-large {
                    background: #EDE9FE;
                    color: #6B21A8;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
