'use client';

import { useState } from 'react';

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    joinDate: string;
    specialties: string[];
    workSchedule: string;
    totalBookings: number;
    rating: number;
    status: 'available' | 'busy' | 'off-duty';
}

// Mock employee data
const initialEmployees: Employee[] = [
    {
        id: 'EMP-001',
        name: 'Sarah Martinez',
        email: 'sarah.m@salonbook.com',
        phone: '+91 98765 55001',
        role: 'Senior Stylist',
        joinDate: '2023-06-15',
        specialties: ['Hair Coloring', 'Haircut & Styling'],
        workSchedule: 'Mon-Fri, 9AM-6PM',
        totalBookings: 156,
        rating: 4.8,
        status: 'available',
    },
    {
        id: 'EMP-002',
        name: 'Michael Chen',
        email: 'michael.c@salonbook.com',
        phone: '+91 98765 55002',
        role: 'Makeup Artist',
        joinDate: '2023-08-20',
        specialties: ['Professional Makeup', 'Bridal Makeup'],
        workSchedule: 'Tue-Sat, 10AM-7PM',
        totalBookings: 124,
        rating: 4.9,
        status: 'busy',
    },
    {
        id: 'EMP-003',
        name: 'Priya Sharma',
        email: 'priya.s@salonbook.com',
        phone: '+91 98765 55003',
        role: 'Spa Specialist',
        joinDate: '2023-05-10',
        specialties: ['Spa Treatment', 'Facial Treatment'],
        workSchedule: 'Mon-Sat, 8AM-5PM',
        totalBookings: 189,
        rating: 4.7,
        status: 'available',
    },
    {
        id: 'EMP-004',
        name: 'Rahul Kapoor',
        email: 'rahul.k@salonbook.com',
        phone: '+91 98765 55004',
        role: 'Nail Technician',
        joinDate: '2024-01-15',
        specialties: ['Manicure & Pedicure', 'Nail Art'],
        workSchedule: 'Wed-Sun, 11AM-8PM',
        totalBookings: 78,
        rating: 4.6,
        status: 'available',
    },
    {
        id: 'EMP-005',
        name: 'Lisa Anderson',
        email: 'lisa.a@salonbook.com',
        phone: '+91 98765 55005',
        role: 'Hair Stylist',
        joinDate: '2023-09-01',
        specialties: ['Haircut & Styling', 'Hair Treatment'],
        workSchedule: 'Mon-Fri, 10AM-7PM',
        totalBookings: 142,
        rating: 4.8,
        status: 'off-duty',
    },
];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const filteredEmployees = filterStatus === 'all'
        ? employees
        : employees.filter(e => e.status === filterStatus);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available': return 'badge-success';
            case 'busy': return 'badge-warning';
            case 'off-duty': return 'badge-secondary';
            default: return 'badge-secondary';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="employees-page">
            <div className="dashboard-content-card">
                <div className="card-header-flex">
                    <h3>Employees Management</h3>
                    <div className="filter-controls">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="admin-select"
                        >
                            <option value="all">All Employees</option>
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="off-duty">Off Duty</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Schedule</th>
                                <th>Bookings</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="font-mono">{employee.id}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <span className="customer-name">{employee.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge">{employee.role}</span>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            <span>{employee.email}</span>
                                            <span className="text-secondary">{employee.phone}</span>
                                        </div>
                                    </td>
                                    <td className="schedule-cell">{employee.workSchedule}</td>
                                    <td className="text-center">{employee.totalBookings}</td>
                                    <td>
                                        <div className="rating-cell">
                                            <span className="rating-star">★</span>
                                            <span>{employee.rating}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                                            {formatStatus(employee.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedEmployee(employee)}
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

            {/* Employee Details Modal */}
            {selectedEmployee && (
                <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Employee Details</h3>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="client-detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Employee ID</span>
                                    <span className="detail-value font-mono">{selectedEmployee.id}</span>
                                </div>
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
                                    <span className="detail-value">
                                        {new Date(selectedEmployee.joinDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Work Schedule</span>
                                    <span className="detail-value">{selectedEmployee.workSchedule}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`status-badge ${getStatusBadgeClass(selectedEmployee.status)}`}>
                                        {formatStatus(selectedEmployee.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="client-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{selectedEmployee.totalBookings}</span>
                                    <span className="stat-label">Total Bookings</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">★ {selectedEmployee.rating}</span>
                                    <span className="stat-label">Average Rating</span>
                                </div>
                            </div>

                            <div className="preferences-section">
                                <h4>Specialties</h4>
                                <div className="preferences-tags">
                                    {selectedEmployee.specialties.map((specialty, index) => (
                                        <span key={index} className="preference-tag">
                                            {specialty}
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
