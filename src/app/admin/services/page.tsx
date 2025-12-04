'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    imageUrl: string;
    isPopular?: boolean;
    createdAt?: any;
}

export default function ServicesManagementPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 60,
        price: 1000,
        imageUrl: '/salon-1.jpg',
        isPopular: false,
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const servicesSnapshot = await getDocs(collection(db, 'services'));
            const servicesData: Service[] = servicesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            } as Service));

            setServices(servicesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching services:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description,
                duration: service.duration,
                price: service.price,
                imageUrl: service.imageUrl,
                isPopular: service.isPopular || false,
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: 1000,
                imageUrl: '/salon-1.jpg',
                isPopular: false,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const serviceData = {
            name: formData.name,
            description: formData.description,
            duration: Number(formData.duration),
            price: Number(formData.price),
            imageUrl: formData.imageUrl,
            isPopular: formData.isPopular,
        };

        try {
            if (editingService) {
                await updateDoc(doc(db, 'services', editingService.id), serviceData);
                alert('✅ Service updated successfully!');
            } else {
                await addDoc(collection(db, 'services'), {
                    ...serviceData,
                    createdAt: Timestamp.now(),
                });
                alert('✅ Service added successfully!');
            }

            setShowModal(false);
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Failed to save service');
        }
    };

    const handleDelete = async (serviceId: string, serviceName: string) => {
        if (confirm(`Are you sure you want to delete "${serviceName}"?`)) {
            try {
                await deleteDoc(doc(db, 'services', serviceId));
                alert('✅ Service deleted successfully!');
                fetchServices();
            } catch (error) {
                console.error('Error deleting service:', error);
                alert('Failed to delete service');
            }
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="services-page">
                <h1>Service Management</h1>
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading services...</div>
            </div>
        );
    }

    return (
        <div className="services-page">
            <div className="page-header">
                <div>
                    <h1>Service Management</h1>
                    <p className="page-subtitle">Manage beauty services and pricing</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    + Add New Service
                </button>
            </div>

            {/* Search */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder="🔍 Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-value">{services.length}</div>
                    <div className="stat-label">Total Services</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{services.filter(s => s.isPopular).length}</div>
                    <div className="stat-label">Popular Services</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">₹{Math.round(services.reduce((acc, s) => acc + s.price, 0) / (services.length || 1))}</div>
                    <div className="stat-label">Avg Price</div>
                </div>
            </div>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
                <div className="empty-state">
                    <p>💆‍♀️ No services found</p>
                    <small>Add services to get started</small>
                </div>
            ) : (
                <div className="services-grid">
                    {filteredServices.map((service) => (
                        <div key={service.id} className="service-card">
                            <div className="service-image" style={{ backgroundImage: `url(${service.imageUrl})` }}>
                                {service.isPopular && (
                                    <div className="popular-badge">🔥 Popular</div>
                                )}
                            </div>
                            <div className="service-info">
                                <div className="service-header">
                                    <h3>{service.name}</h3>
                                    <span className="price-tag">₹{service.price}</span>
                                </div>
                                <p className="service-description">{service.description}</p>
                                <div className="service-meta">
                                    <span>⏱️ {service.duration} mins</span>
                                </div>
                                <div className="service-actions">
                                    <button className="btn-edit" onClick={() => handleOpenModal(service)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(service.id, service.name)}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-field">
                                <label>Service Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Duration (mins) *</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Image URL</label>
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                            </div>

                            <div className="form-field checkbox-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                    />
                                    Mark as Popular Service
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingService ? 'Update Service' : 'Add Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .services-page {
                    padding: 2rem;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #6B7280;
                }

                .btn-primary {
                    background: #FF6B9D;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .btn-primary:hover {
                    background: #E5427A;
                }

                .search-box {
                    margin-bottom: 2rem;
                }

                .search-box input {
                    width: 100%;
                    max-width: 500px;
                    padding: 0.875rem 1rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: #FF6B9D;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    text-align: center;
                }

                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #FF6B9D;
                    margin-bottom: 0.5rem;
                }

                .stat-label {
                    color: #6B7280;
                    font-size: 0.875rem;
                }

                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .service-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }

                .service-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .service-image {
                    height: 180px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .popular-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #FF6B9D;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .service-info {
                    padding: 1.5rem;
                }

                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }

                .service-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    flex: 1;
                    padding-right: 1rem;
                }

                .price-tag {
                    font-weight: 700;
                    color: #10B981;
                    font-size: 1.125rem;
                }

                .service-description {
                    color: #6B7280;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .service-meta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.875rem;
                    color: #374151;
                }

                .service-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-edit, .btn-delete {
                    flex: 1;
                    padding: 0.625rem;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .btn-edit {
                    background: #DBEAFE;
                    color: #1E40AF;
                }

                .btn-edit:hover {
                    background: #BFDBFE;
                }

                .btn-delete {
                    background: #FEE2E2;
                    color: #991B1B;
                }

                .btn-delete:hover {
                    background: #FEcaca;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 12px;
                    border: 2px dashed #E5E7EB;
                }

                .empty-state p {
                    font-size: 1.25rem;
                    color: #6B7280;
                    margin-bottom: 0.5rem;
                }

                /* Modal */
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
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #6B7280;
                    line-height: 1;
                }

                .modal-body {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
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
                    font-size: 0.875rem;
                }

                .form-field input,
                .form-field textarea {
                    padding: 0.75rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-field input:focus,
                .form-field textarea:focus {
                    outline: none;
                    border-color: #FF6B9D;
                }

                .checkbox-field label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-field input {
                    width: auto;
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
