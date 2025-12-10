'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    specialties: string[];
    status: string;
}

interface EmployeeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (employee: Employee) => void;
}

export default function EmployeeSelectionModal({ isOpen, onClose, onSelect }: EmployeeSelectionModalProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAvailableEmployees();
        }
    }, [isOpen]);

    const fetchAvailableEmployees = async () => {
        try {
            setLoading(true);
            const employeesSnapshot = await getDocs(collection(db, 'employees'));
            const employeesData: Employee[] = employeesSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Employee))
                .filter(emp => emp.status === 'available'); // Only show available employees

            setEmployees(employeesData);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.specialties || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (employee: Employee) => {
        onSelect(employee);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>👨‍💼 Select Employee</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-search">
                    <input
                        type="text"
                        placeholder="🔍 Search by name, role, or specialty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading available employees...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="empty-state">
                            <p>😕 No available employees found</p>
                            <small>All employees might be busy or there are no registered employees</small>
                        </div>
                    ) : (
                        <div className="employees-grid">
                            {filteredEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="employee-card"
                                    onClick={() => handleSelect(employee)}
                                >
                                    <div className="employee-avatar">
                                        {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="employee-info">
                                        <h3>{employee.name}</h3>
                                        <p className="employee-role">🎯 {employee.role}</p>
                                        <div className="employee-specialties">
                                            {(employee.specialties || []).slice(0, 3).map((specialty, idx) => (
                                                <span key={idx} className="specialty-badge">
                                                    {specialty}
                                                </span>
                                            ))}
                                            {(employee.specialties || []).length > 3 && (
                                                <span className="specialty-badge more">
                                                    +{(employee.specialties || []).length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="employee-contact">
                                            <small>📧 {employee.email}</small>
                                        </div>
                                    </div>
                                    <div className="select-indicator">✓</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(4px);
                }

                .employee-modal {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    border-bottom: 2px solid #f3f4f6;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1f2937;
                }

                .close-btn {
                    background: #f3f4f6;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #6b7280;
                }

                .close-btn:hover {
                    background: #e5e7eb;
                    transform: rotate(90deg);
                }

                .modal-search {
                    padding: 1rem 2rem;
                    border-bottom: 1px solid #f3f4f6;
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #ec4899;
                    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
                }

                .modal-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem 2rem;
                }

                .loading-state,
                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #6b7280;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #ec4899;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .employees-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1rem;
                }

                .employee-card {
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    display: flex;
                    gap: 1rem;
                }

                .employee-card:hover {
                    background: white;
                    border-color: #ec4899;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(236, 72, 153, 0.15);
                }

                .employee-card:hover .select-indicator {
                    opacity: 1;
                }

                .employee-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .employee-info {
                    flex: 1;
                }

                .employee-info h3 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.1rem;
                    color: #1f2937;
                }

                .employee-role {
                    margin: 0.25rem 0;
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                .employee-specialties {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin: 0.75rem 0;
                }

                .specialty-badge {
                    background: #fce7f3;
                    color: #be185d;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .specialty-badge.more {
                    background: #e5e7eb;
                    color: #6b7280;
                }

                .employee-contact {
                    margin-top: 0.5rem;
                }

                .employee-contact small {
                    color: #9ca3af;
                    font-size: 0.8rem;
                }

                .select-indicator {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: #10b981;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    opacity: 0;
                    transition: all 0.2s;
                }

                @media (max-width: 768px) {
                    .employee-modal {
                        width: 95%;
                        max-height: 90vh;
                    }

                    .employees-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
