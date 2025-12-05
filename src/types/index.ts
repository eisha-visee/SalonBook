export interface Location {
  city: string;
  area: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  imageUrl: string;
  isPopular?: boolean;
}

export interface Salon {
  id: string;
  name: string;
  description: string;
  location: Location;
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
}

export interface Booking {
  id: string;
  salonId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  status: 'assigned' | 'not_assigned' | 'reschedule';
  totalAmount: number;
}
