'use client';

import { useState } from 'react';
import SalonCard from '@/components/SalonCard';
import { salons } from '@/data/salons';

export default function SalonsPage() {
    const [selectedCity, setSelectedCity] = useState<string>('all');

    const cities = ['all', ...Array.from(new Set(salons.map(s => s.location.city)))];

    const filteredSalons = selectedCity === 'all'
        ? salons
        : salons.filter(s => s.location.city === selectedCity);

    return (
        <div className="salons-page">
            <section className="salons-hero">
                <div className="container">
                    <h1>Discover <span className="text-accent">Premium Salons</span></h1>
                    <p>Find the perfect salon near you from our curated selection</p>
                </div>
            </section>

            <section className="salons-listing">
                <div className="container">
                    <div className="salon-filters">
                        <div className="filter-group">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <select
                                id="city-filter"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="city-filter-select"
                            >
                                {cities.map(city => (
                                    <option key={city} value={city}>
                                        {city === 'all' ? 'All Cities' : city}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="results-count">
                            {filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''} found
                        </span>
                    </div>



                    <div className="grid grid-3">
                        {filteredSalons.map(salon => (
                            <SalonCard key={salon.id} salon={salon} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
