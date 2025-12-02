import Link from 'next/link';
import Image from 'next/image';
import { Salon } from '@/types';

interface SalonCardProps {
    salon: Salon;
}

export default function SalonCard({ salon }: SalonCardProps) {
    return (
        <div className="salon-card card">
            <div className="salon-card-image-wrapper">
                <Image
                    src={salon.imageUrl}
                    alt={salon.name}
                    width={400}
                    height={250}
                    className="card-image"
                />
                <span className="location-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" fill="white" />
                    </svg>
                    {salon.location.area}
                </span>
            </div>

            <div className="card-content">
                <div className="salon-card-header">
                    <h3 className="salon-name">{salon.name}</h3>
                    <div className="salon-rating">
                        <span className="rating-star">★</span>
                        <span className="rating-value">{salon.rating}</span>
                        <span className="rating-count">({salon.reviewCount})</span>
                    </div>
                </div>

                <p className="salon-description">{salon.description}</p>

                <div className="salon-price">
                    Starting from <span className="price-value">₹{salon.priceRange.min}</span>
                </div>

                <div className="salon-card-footer">
                    <Link href={`/salons/${salon.id}`} className="btn btn-primary salon-book-btn">
                        View & Book
                    </Link>
                </div>
            </div>
        </div>
    );
}
