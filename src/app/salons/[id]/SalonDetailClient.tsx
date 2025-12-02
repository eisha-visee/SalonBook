'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { salons } from '@/data/salons';
import { services } from '@/data/services';
import { Service } from '@/types';

interface SalonDetailClientProps {
    id: string;
}

export default function SalonDetailClient({ id }: SalonDetailClientProps) {
    const salon = salons.find(s => s.id === id);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
    });

    if (!salon) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Salon not found</h1>
                <p>ID: {id}</p>
            </div>
        );
    }

    const availableServices = services.filter(service =>
        salon.services.includes(service.id)
    );

    const total = useMemo(() => {
        return selectedServices.reduce((sum, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return sum + (service?.price || 0);
        }, 0);
    }, [selectedServices]);

    const handleAddService = (serviceId: string) => {
        if (!selectedServices.includes(serviceId)) {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setSelectedServices(selectedServices.filter(id => id !== serviceId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            alert('Please select at least one service');
            return;
        }
        console.log('Booking:', { ...formData, services: selectedServices, total });
        alert('Booking confirmed! We will contact you shortly.');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
