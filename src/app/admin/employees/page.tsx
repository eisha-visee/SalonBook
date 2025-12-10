'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
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

// Custom Status Dropdown Component
const StatusDropdown = ({ currentStatus, onStatusChange }: { currentStatus: string, onStatusChange: (status: 'available' | 'busy' | 'off-duty') => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statusOptions = [
        { value: 'available', label: 'Available', color: '#10B981' }, // Emerald-500
        { value: 'busy', label: 'Busy', color: '#F59E0B' }, // Amber-500
        { value: 'off-duty', label: 'Off Duty', color: '#EF4444' }, // Red-500
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
        <>
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
                                    onStatusChange(option.value as any);
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
            <style jsx>{`
                .status-dropdown-container {
                    position: relative;
                    min-width: 160px;
                }
                .status-trigger-btn {
                    width: 100%;
                    height: 38px;
                    padding: 0 0.875rem;
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 9999px;
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
                    flex-shrink: 0;
                }
                .status-text {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    white-space: nowrap;
                }
                .dropdown-arrow {
                    color: #9CA3AF;
                    display: flex;
                    align-items: center;
                    transition: transform 0.2s;
                    margin-left: 0.5rem;
                }
                .dropdown-arrow.rotate { transform: rotate(180deg); }
                .status-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    width: 100%;
                    min-width: 180px;
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
                .status-option-item:hover { background: #F3F4F6; }
                .status-option-item.selected { background: #F0FDF4; }
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
            `}</style>
        </>
    );
};

// Custom View Button Component
const ViewButton = ({ onClick }: { onClick: () => void }) => (
    <>
        <button
            className="btn-action-view"
            onClick={onClick}
            type="button"
            title="View Details"
        >
            View
        </button>
        <style jsx>{`
            .btn-action-view {
                background: white;
                border: 1px solid #D1D5DB;
                color: #374151;
                padding: 0.5rem 1.25rem;
                border-radius: 9999px;
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                white-space: nowrap;
                font-family: inherit;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 38px;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
            .btn-action-view:hover {
                border-color: #D1D5DB;
                background: #F9FAFB;
                color: #111827;
                transform: translateY(-1px);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
        `}</style>
    </>
);

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
        const unsubscribe = fetchEmployees();
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const fetchEmployees = () => {
        try {
            const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
                const employeesData: Employee[] = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    totalBookings: doc.data().totalBookings || 0,
                    rating: doc.data().rating || 5.0,
                } as Employee));

                setEmployees(employeesData);
                setLoading(false);
            }, (error: any) => {
                console.error('Error fetching employees:', error);
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up employees listener:', error);
            setLoading(false);
            return () => { };
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

    const columns: Array<{
        header: string;
        accessor: keyof Employee | ((row: Employee) => React.ReactNode);
        sortable?: boolean;
        className?: string;
    }> = [
            {
                header: 'Name',
                accessor: (row: Employee) => <strong className="employee-name">{row.name}</strong>,
                sortable: true,
            },
            {
                header: 'Role',
                accessor: (row: Employee) => <div className="role-wrapper"><span className="role-badge">{row.role}</span></div>,
                sortable: true,
            },
            {
                header: 'Contact',
                accessor: (row: Employee) => (
                    <div className="contact-info">
                        <div className="email">{row.email}</div>
                        <div className="phone">{row.phone}</div>
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
                    <StatusDropdown
                        currentStatus={row.status}
                        onStatusChange={(newStatus) => handleUpdateStatus(row.id, newStatus)}
                    />
                ),
                sortable: true,
            },
        ];

    const actions = (row: Employee) => (
        <ViewButton onClick={() => setSelectedEmployee(row)} />
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
                <div>
                    <h1>Staff Directory</h1>
                    <p className="page-subtitle">
                        Manage your team, schedules, and performance
                    </p>
                </div>
                <div className="header-actions">
                    <div className="filter-group">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="status-filter"
                        >
                            <option value="all">All Employees</option>
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="off-duty">Off Duty</option>
                        </select>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Employee
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{employees.length}</div>
                        <div className="stat-label">Total Staff</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{employees.filter(e => e.status === 'available').length}</div>
                        <div className="stat-label">Available Now</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper yellow">⭐</div>
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
                title="Team Members"
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
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={newEmployee.name}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Role *</label>
                                    <input
                                        type="text"
                                        value={newEmployee.role}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                        placeholder="e.g. Senior Stylist"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={newEmployee.email}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={newEmployee.phone}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                        placeholder="+91..."
                                    />
                                </div>
                                <div className="form-field full-width">
                                    <label>Specialties</label>
                                    <input
                                        type="text"
                                        value={newEmployee.specialties}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, specialties: e.target.value })}
                                        placeholder="Comma separated (e.g. Cut, Color, Spa)"
                                    />
                                </div>
                                <div className="form-field full-width">
                                    <label>Work Schedule</label>
                                    <input
                                        type="text"
                                        value={newEmployee.workSchedule}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, workSchedule: e.target.value })}
                                        placeholder="e.g. Mon-Fri, 9AM-6PM"
                                    />
                                </div>
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

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .status-filter {
                    padding: 0.6rem 1rem;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    background: white;
                    color: #374151;
                }

                .btn-primary {
                    background: #111827;
                    color: white;
                    padding: 0.6rem 1.2rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }

                .btn-primary:hover {
                    background: #374151;
                    transform: translateY(-1px);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
                    border: 1px solid #E5E7EB;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .stat-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .stat-icon-wrapper.blue { background: #DBEAFE; color: #1E40AF; }
                .stat-icon-wrapper.green { background: #D1FAE5; color: #065F46; }
                .stat-icon-wrapper.purple { background: #EDE9FE; color: #5B21B6; }
                .stat-icon-wrapper.yellow { background: #FEF3C7; color: #92400E; }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #6B7280;
                }

                .employee-name {
                    color: #111827;
                    font-weight: 600;
                }

                .role-wrapper {
                   display: flex;
                   align-items: center;
                }

                .role-badge {
                    background: #F3F4F6;
                    color: #4B5563;
                    padding: 0.3rem 0.8rem;
                    border-radius: 9999px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: inline-block;
                    min-width: 80px;
                    text-align: center;
                }

                .contact-info .email { color: #111827; margin-bottom: 2px; }
                .contact-info .phone { color: #6B7280; font-size: 0.85rem; }

                .specialties-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                }

                .specialty-tag {
                    background: #F3F4F6;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: #4B5563;
                }

                .schedule-cell { color: #6B7280; font-size: 0.875rem; }

                .booking-count { color: #3B82F6; font-weight: 600; }

                .rating-cell { display: flex; align-items: center; gap: 0.3rem; }
                .rating-star { color: #F59E0B; }

                /* ------- STATUS DROPDOWN STYLES MOVED TO COMPONENT ------- */

                /* ------- ACTION BUTTON STYLES MOVED TO COMPONENT ------- */

                /* Modal Form Grid */
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-field.full-width {
                    grid-column: span 2;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
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

                .modal-header h2 { font-size: 1.25rem; margin: 0; }

                .close-btn {
                    background: none; border: none; font-size: 1.5rem;
                    cursor: pointer; color: #9CA3AF;
                }

                .modal-body { padding: 1.5rem; }

                .form-field label {
                    display: block; font-weight: 500; color: #374151; margin-bottom: 0.4rem; font-size: 0.9rem;
                }

                .form-field input {
                    width: 100%; padding: 0.6rem;
                    border: 1px solid #D1D5DB; border-radius: 6px;
                    font-size: 0.95rem;
                }

                .modal-footer {
                    padding: 1.5rem; border-top: 1px solid #E5E7EB;
                    display: flex; justify-content: flex-end; gap: 1rem;
                }

                .btn-secondary {
                    background: white; color: #374151;
                    padding: 0.6rem 1.2rem; border: 1px solid #D1D5DB;
                    border-radius: 6px; font-weight: 500; cursor: pointer;
                }

                .detail-grid {
                    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .detail-label { font-size: 0.85rem; color: #6B7280; display: block; margin-bottom: 0.2rem; }
                .detail-value { font-weight: 500; color: #111827; }

                .stats-row {
                    display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem;
                    background: #F9FAFB; border-radius: 8px;
                }

                .stat-item { flex: 1; text-align: center; }
                .stat-item .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #111827; }
                .stat-item .stat-label { font-size: 0.85rem; color: #6B7280; }

                .specialty-tag-large {
                    background: #F3F4F6; color: #374151;
                    padding: 0.4rem 0.8rem; border-radius: 6px;
                    font-size: 0.9rem; font-weight: 500;
                }
            `}</style>
        </div>
    );
}
