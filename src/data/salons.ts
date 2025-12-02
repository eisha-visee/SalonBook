import { Salon } from '@/types';

export const salons: Salon[] = [
    {
        id: 'glamour-lounge-mumbai',
        name: 'Glamour Lounge',
        description: 'Premium salon offering luxury hair and beauty services',
        location: {
            city: 'Mumbai',
            area: 'Bandra West',
        },
        rating: 4.8,
        reviewCount: 245,
        imageUrl: '/salon-1.jpg',
        services: ['haircut', 'hair-coloring', 'spa-treatment', 'makeup'],
        priceRange: {
            min: 800,
            max: 5000,
        },
    },
    {
        id: 'bliss-beauty-delhi',
        name: 'Bliss Beauty Studio',
        description: 'Modern salon with expert stylists and latest techniques',
        location: {
            city: 'Delhi',
            area: 'Connaught Place',
        },
        rating: 4.7,
        reviewCount: 189,
        imageUrl: '/salon-2.jpg',
        services: ['haircut', 'hair-coloring', 'manicure-pedicure', 'facial'],
        priceRange: {
            min: 700,
            max: 4500,
        },
    },
    {
        id: 'radiance-salon-bangalore',
        name: 'Radiance Salon & Spa',
        description: 'Full-service salon and spa for complete beauty transformation',
        location: {
            city: 'Bangalore',
            area: 'Indiranagar',
        },
        rating: 4.9,
        reviewCount: 312,
        imageUrl: '/salon-3.jpg',
        services: ['haircut', 'spa-treatment', 'facial', 'makeup'],
        priceRange: {
            min: 900,
            max: 6000,
        },
    },
    {
        id: 'elegance-studio-mumbai',
        name: 'Elegance Studio',
        description: 'Boutique salon specializing in bridal and party makeup',
        location: {
            city: 'Mumbai',
            area: 'Juhu',
        },
        rating: 4.6,
        reviewCount: 156,
        imageUrl: '/salon-4.jpg',
        services: ['makeup', 'haircut', 'hair-coloring'],
        priceRange: {
            min: 1000,
            max: 8000,
        },
    },
    {
        id: 'chic-salon-pune',
        name: 'Chic Salon',
        description: 'Contemporary salon with personalized beauty services',
        location: {
            city: 'Pune',
            area: 'Koregaon Park',
        },
        rating: 4.7,
        reviewCount: 203,
        imageUrl: '/salon-5.jpg',
        services: ['haircut', 'manicure-pedicure', 'facial', 'hair-coloring'],
        priceRange: {
            min: 600,
            max: 4000,
        },
    },
    {
        id: 'aurora-beauty-delhi',
        name: 'Aurora Beauty Bar',
        description: 'Trendy salon with skilled professionals and quality products',
        location: {
            city: 'Delhi',
            area: 'Saket',
        },
        rating: 4.8,
        reviewCount: 278,
        imageUrl: '/salon-6.jpg',
        services: ['haircut', 'hair-coloring', 'makeup', 'spa-treatment'],
        priceRange: {
            min: 850,
            max: 5500,
        },
    },
];
