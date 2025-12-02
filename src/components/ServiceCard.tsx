import Image from 'next/image';
import { Service } from '@/types';

interface ServiceCardProps {
    service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
    return (
        <div className="service-card card">
            <div className="service-card-image-wrapper">
                <Image
                    src={service.imageUrl}
                    alt={service.name}
                    width={350}
                    height={220}
                    className="card-image service-card-image"
                />
                {service.isPopular && (
                    <span className="service-popular-badge badge-pink">
                        Popular
                    </span>
                )}
            </div>

            <div className="card-content">
                <h3 className="service-name">{service.name}</h3>
                <p className="service-description">{service.description}</p>

                <div className="service-details">
                    <div className="service-duration">
                        <svg className="service-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zm0-12.5A6.5 6.5 0 1 1 8 15a6.5 6.5 0 0 1 0-13zM8 4v4.5l3 1.5-.5 1-3.5-1.75V4h1z" fill="currentColor" />
                        </svg>
                        {service.duration} min
                    </div>
                    <div className="service-price">
                        ₹{service.price}
                    </div>
                </div>
            </div>
        </div>
    );
}
