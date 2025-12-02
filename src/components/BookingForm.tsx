'use client';

import { useState } from 'react';
import { salons } from '@/data/salons';
import { services } from '@/data/services';

export default function BookingForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        salonId: '',
        serviceId: '',
        date: '',
        time: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Booking submitted:', formData);
        alert('Booking request submitted! We will contact you shortly.');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="salonId">Select Salon</label>
                    <select
                        id="salonId"
                        name="salonId"
                        value={formData.salonId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Choose a salon...</option>
                        {salons.map(salon => (
                            <option key={salon.id} value={salon.id}>
                                {salon.name} - {salon.location.area}, {salon.location.city}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="serviceId">Select Service</label>
                    <select
                        id="serviceId"
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Choose a service...</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} - ₹{service.price}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="date">Preferred Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="time">Preferred Time</label>
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

            <button type="submit" className="btn btn-primary form-submit-btn">
                Confirm Booking
            </button>
        </form>
    );
}
