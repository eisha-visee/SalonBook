'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface Salon {
    id: string;
    name: string;
    description: string;
    location: {
        city: string;
        area: string;
    };
    rating: number;
    reviewCount: number;
    imageUrl: string;
    services: Array<{
        name: string;
        price: number;
    }>;
    priceRange: {
        min: number;
        max: number;
    };
    createdAt?: any;
}

export default function SalonsManagementPage() {
    const [salons, setSalons] = useState<Salon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: '',
        area: '',
        rating: 4.5,
        reviewCount: 0,
        imageUrl: '/salon-1.jpg',
        services: [{ name: '', price: 0 }],
        minPrice: 500,
        maxPrice: 5000,
    });

    useEffect(() => {
        fetchSalons();
    }, []);

    const fetchSalons = async () => {
        try {
            const salonsSnapshot = await getDocs(collection(db, 'salons'));
            const salonsData: Salon[] = salonsSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            } as Salon));

            setSalons(salonsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching salons:', error);
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        try {
            setUploading(true);

            // Create a unique filename
            const timestamp = Date.now();
            const filename = `salons/${timestamp}_${file.name}`;
            const storageRef = ref(storage, filename);

            // Upload file
            await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update form data
            setFormData({ ...formData, imageUrl: downloadURL });

            alert('✅ Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenModal = (salon?: Salon) => {
        if (salon) {
            setEditingSalon(salon);

            // Handle migration from old string[] format to new object[] format
            let servicesData: Array<{ name: string; price: number }> = [];
            if (salon.services && salon.services.length > 0) {
                // Check if first service is a string (old format) or object (new format)
                const firstService = salon.services[0];
                if (typeof firstService === 'string') {
                    // Old format: convert strings to objects
                    servicesData = (salon.services as unknown as string[]).map(serviceName => ({
                        name: serviceName,
                        price: 0
                    }));
                } else {
                    // New format: use as is
                    servicesData = salon.services;
                }
            } else {
                // No services: start with one empty row
                servicesData = [{ name: '', price: 0 }];
            }

            setFormData({
                name: salon.name,
                description: salon.description,
                city: salon.location.city,
                area: salon.location.area,
                rating: salon.rating,
                reviewCount: salon.reviewCount,
                imageUrl: salon.imageUrl,
                services: servicesData,
                minPrice: salon.priceRange.min,
                maxPrice: salon.priceRange.max,
            });
        } else {
            setEditingSalon(null);
            setFormData({
                name: '',
                description: '',
                city: '',
                area: '',
                rating: 4.5,
                reviewCount: 0,
                imageUrl: '/salon-1.jpg',
                services: [{ name: '', price: 0 }],
                minPrice: 500,
                maxPrice: 5000,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const salonData = {
            name: formData.name,
            description: formData.description,
            location: {
                city: formData.city,
                area: formData.area,
            },
            rating: Number(formData.rating),
            reviewCount: Number(formData.reviewCount),
            imageUrl: formData.imageUrl,
            services: formData.services.filter(s => s.name.trim() !== ''),
            priceRange: {
                min: Number(formData.minPrice),
                max: Number(formData.maxPrice),
            },
        };

        try {
            if (editingSalon) {
                await updateDoc(doc(db, 'salons', editingSalon.id), salonData);
                alert('✅ Salon updated successfully!');
            } else {
                await addDoc(collection(db, 'salons'), {
                    ...salonData,
                    createdAt: Timestamp.now(),
                });
                alert('✅ Salon added successfully!');
            }

            setShowModal(false);
            fetchSalons();
        } catch (error) {
            console.error('Error saving salon:', error);
            alert('Failed to save salon');
        }
    };

    const handleDelete = async (salonId: string, salonName: string) => {
        if (confirm(`Are you sure you want to delete "${salonName}"?`)) {
            try {
                await deleteDoc(doc(db, 'salons', salonId));
                alert('✅ Salon deleted successfully!');
                fetchSalons();
            } catch (error) {
                console.error('Error deleting salon:', error);
                alert('Failed to delete salon');
            }
        }
    };

    const filteredSalons = salons.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.location.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="salons-page">
                <h1>Salon Management</h1>
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading salons...</div>
            </div>
        );
    }

    return (
        <div className="salons-page">
            <div className="page-header">
                <div>
                    <h1>Salon Management</h1>
                    <p className="page-subtitle">Manage all registered salons</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    + Add New Salon
                </button>
            </div>

            {/* Search */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder="🔍 Search salons by name, city, or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-value">{salons.length}</div>
                    <div className="stat-label">Total Salons</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{salons.filter(s => s.rating >= 4.5).length}</div>
                    <div className="stat-label">Top Rated (4.5+)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{new Set(salons.map(s => s.location.city)).size}</div>
                    <div className="stat-label">Cities</div>
                </div>
            </div>

            {/* Salons Grid */}
            {filteredSalons.length === 0 ? (
                <div className="empty-state">
                    <p>🏪 No salons found</p>
                    <small>Add salons to get started</small>
                </div>
            ) : (
                <div className="salons-grid">
                    {filteredSalons.map((salon) => (
                        <div key={salon.id} className="salon-card">
                            <div className="salon-image" style={{ backgroundImage: `url(${salon.imageUrl})` }}>
                                <div className="salon-rating">
                                    ⭐ {salon.rating} ({salon.reviewCount})
                                </div>
                            </div>
                            <div className="salon-info">
                                <h3>{salon.name}</h3>
                                <p className="salon-location">📍 {salon.location.area}, {salon.location.city}</p>
                                <p className="salon-description">{salon.description}</p>
                                <div className="salon-price">
                                    ₹{salon.priceRange.min} - ₹{salon.priceRange.max}
                                </div>
                                <div className="salon-services">
                                    {salon.services.slice(0, 3).map((service, idx) => (
                                        <span key={idx} className="service-badge">{service.name}</span>
                                    ))}
                                    {salon.services.length > 3 && (
                                        <span className="service-badge more">+{salon.services.length - 3}</span>
                                    )}
                                </div>
                                <div className="salon-actions">
                                    <button className="btn-edit" onClick={() => handleOpenModal(salon)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(salon.id, salon.name)}>
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
                            <h2>{editingSalon ? 'Edit Salon' : 'Add New Salon'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-field">
                                    <label>Salon Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Salon Image</label>
                                    <div className="image-upload-container">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="file-input"
                                            id="imageUpload"
                                        />
                                        <label htmlFor="imageUpload" className="upload-button">
                                            {uploading ? '⏳ Uploading...' : '📁 Choose Image'}
                                        </label>
                                        {formData.imageUrl && (
                                            <div className="image-preview">
                                                <img src={formData.imageUrl} alt="Preview" />
                                                <small>{formData.imageUrl.substring(0, 50)}...</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Area *</label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Rating</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Review Count</label>
                                    <input
                                        type="number"
                                        value={formData.reviewCount}
                                        onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Services & Pricing</label>
                                {formData.services.map((service, index) => (
                                    <div key={index} className="service-row">
                                        <input
                                            type="text"
                                            placeholder="Service name (e.g., Haircut)"
                                            value={service.name}
                                            onChange={(e) => {
                                                const newServices = [...formData.services];
                                                newServices[index].name = e.target.value;
                                                setFormData({ ...formData, services: newServices });
                                            }}
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price (₹)"
                                            value={service.price || ''}
                                            onChange={(e) => {
                                                const newServices = [...formData.services];
                                                newServices[index].price = Number(e.target.value);
                                                setFormData({ ...formData, services: newServices });
                                            }}
                                            required
                                        />
                                        {formData.services.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-remove-service"
                                                onClick={() => {
                                                    const newServices = formData.services.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, services: newServices });
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn-add-service"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            services: [...formData.services, { name: '', price: 0 }]
                                        });
                                    }}
                                >
                                    + Add Service
                                </button>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Min Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.minPrice}
                                        onChange={(e) => setFormData({ ...formData, minPrice: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Max Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.maxPrice}
                                        onChange={(e) => setFormData({ ...formData, maxPrice: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingSalon ? 'Update Salon' : 'Add Salon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .salons-page {
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

                .salons-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .salon-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }

                .salon-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .salon-image {
                    height: 200px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .salon-rating {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .salon-info {
                    padding: 1.5rem;
                }

                .salon-info h3 {
                    margin-bottom: 0.5rem;
                    font-size: 1.25rem;
                }

                .salon-location {
                    color: #6B7280;
                    font-size: 0.875rem;
                    margin-bottom: 0.75rem;
                }

                .salon-description {
                    color: #374151;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .salon-price {
                    font-weight: 700;
                    color: #10B981;
                    margin-bottom: 1rem;
                }

                .salon-services {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .service-badge {
                    background: #F3F4F6;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                .service-badge.more {
                    background: #E5E7EB;
                    font-weight: 600;
                }

                .salon-actions {
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
                    max-width: 700px;
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

                /* Service Form Styles */
                .service-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr auto;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                    align-items: center;
                }

                .btn-add-service {
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
                    color: white;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 0.5rem;
                    width: 100%;
                }

                .btn-add-service:hover {
                    background: linear-gradient(135deg, #E5427A 0%, #EC6FA1 100%);
                }

                .btn-remove-service {
                    background: #FEE2E2;
                    color: #991B1B;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1.5rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .btn-remove-service:hover {
                    background: #FECACA;
                }

                /* Image Upload Styles */
                .image-upload-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .file-input {
                    display: none;
                }

                .upload-button {
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    display: inline-block;
                }

                .upload-button:hover {
                    background: linear-gradient(135deg, #E5427A 0%, #EC6FA1 100%);
                    transform: translateY(-1px);
                }

                .image-preview {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .image-preview img {
                    width: 100%;
                    max-width: 200px;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 2px solid #E5E7EB;
                }

                .image-preview small {
                    color: #6B7280;
                    font-size: 0.75rem;
                    word-break: break-all;
                }
            `}</style>
        </div>
    );
}
