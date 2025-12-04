'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Salon, Service } from '@/types';

interface SalonDetailClientProps {
    id: string;
}

export default function SalonDetailClient({ id }: SalonDetailClientProps) {
    const [salon, setSalon] = useState<Salon | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Salon
                const salonDoc = await getDoc(doc(db, 'salons', id));
                if (salonDoc.exists()) {
                    setSalon({ id: salonDoc.id, ...salonDoc.data() } as Salon);
                }

                // Fetch All Services
                const servicesSnapshot = await getDocs(collection(db, 'services'));
                const servicesData = servicesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Service[];
                setServices(servicesData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const availableServices = useMemo(() => {
        if (!salon || !services.length) return [];
        // Match services by ID since salon.services contains service IDs like 'haircut', 'facial'
        return services.filter(service =>
            salon.services.some(s => s.toLowerCase() === service.id.toLowerCase())
        );
    }, [salon, services]);

    const total = useMemo(() => {
        return selectedServices.reduce((sum, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return sum + (service?.price || 0);
        }, 0);
    }, [selectedServices, services]);

    const handleAddService = (serviceId: string) => {
        if (!selectedServices.includes(serviceId)) {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setSelectedServices(selectedServices.filter(id => id !== serviceId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            alert('Please select at least one service');
            return;
        }

        if (!salon) return;

        try {
            // Prepare selected services data
            const selectedServicesData = selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return {
                    id: service?.id,
                    name: service?.name,
                    price: service?.price,
                    duration: service?.duration,
                };
            });

            // Prepare booking data
            const bookingData = {
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                salonName: salon.name,
                salonId: salon.id,
                services: selectedServicesData,
                date: formData.date,
                time: formData.time,
                totalAmount: total,
                status: 'pending', // Default status
                createdAt: new Date().toISOString(),
            };

            // Save to Firestore (via API or direct)
            // For now, we'll stick to the existing API route which handles email
            // But we should also likely save to Firestore 'bookings' collection directly here or in the API
            // The API route /api/send-booking-email likely just sends email.
            // Let's check if we need to save to Firestore here.
            // The Admin Bookings page reads from 'bookings' collection.
            // So we MUST save to Firestore here.

            const { addDoc, collection } = await import('firebase/firestore');
            await addDoc(collection(db, 'bookings'), bookingData);

            // Send emails via API route
            const response = await fetch('/api/send-booking-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
            });

            if (response.ok) {
                alert('🎉 Booking confirmed! Check your email for confirmation details.');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    date: '',
                    time: '',
                });
                setSelectedServices([]);
            } else {
                console.error('Email sending failed');
                alert('Booking saved, but email confirmation failed.');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('Failed to submit booking. Please try again.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="loading-spinner">Loading salon details...</div>
            </div>
        );
    }

    if (!salon) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Salon not found</h1>
                <p>The requested salon could not be found.</p>
            </div>
        );
    }

    return (
        <>
            <section className="salon-detail-hero">
                <Image
                    src={salon.imageUrl}
                    alt={salon.name}
                    fill
                    className="salon-detail-hero-image"
                    priority
                />
                <div className="salon-detail-hero-overlay"></div>
                <div className="container salon-detail-hero-content">
                    <h1>{salon.name}</h1>
                    <p className="salon-location">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                        </svg>
                        {salon.location.area}, {salon.location.city}
                    </p>
                </div>
            </section>

            <section className="salon-detail-content">
                <div className="container">
                    <div className="salon-detail-grid">
                        {/* Left Side - Services */}
                        <div className="services-section">
                            <div className="section-heading">
                                <span className="accent-bar"></span>
                                <h2>Available Services</h2>
                            </div>

                            {availableServices.length === 0 ? (
                                <p>No services listed for this salon.</p>
                            ) : (
                                <div className="services-list">
                                    {availableServices.map(service => (
                                        <div key={service.id} className="service-item">
                                            <div className="service-item-content">
                                                <h3 className="service-item-name">{service.name}</h3>
                                                <p className="service-item-duration">{service.duration} min</p>
                                            </div>
                                            <div className="service-item-actions">
                                                <span className="service-item-price">₹{service.price}</span>
                                                {selectedServices.includes(service.id) ? (
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => handleRemoveService(service.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn-add"
                                                        onClick={() => handleAddService(service.id)}
                                                    >
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Side - Booking Form */}
                        <div className="booking-section">
                            <h2 className="booking-title">Book Appointment</h2>

                            <form onSubmit={handleSubmit} className="salon-booking-form">
                                <div className="form-field">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label htmlFor="date">Date</label>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="time">Time</label>
                                        <input
                                            type="time"
                                            id="time"
                                            name="time"
                                            value={formData.time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="selected-services-summary">
                                    <div className="summary-row">
                                        <span>Selected Services:</span>
                                        <span className="summary-count">{selectedServices.length}</span>
                                    </div>
                                    <div className="summary-row summary-total">
                                        <span>Total:</span>
                                        <span className="summary-amount">₹{total}</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary booking-submit-btn">
                                    Confirm Booking
                                </button>

                                {selectedServices.length === 0 && (
                                    <p className="error-message">Please select at least one service</p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
