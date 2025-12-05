import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Salon {
    id: string;
    name: string;
    location: string;
    city: string;
    address: string;
}

// Get all unique locations from Firestore
export async function getAvailableLocations(): Promise<string[]> {
    try {
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        const cities = new Set<string>();

        salonsSnapshot.forEach((doc) => {
            const salon = doc.data();
            if (salon.city) {
                cities.add(salon.city);
            }
        });

        return Array.from(cities);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
    }
}

// Get salons by city
export async function getSalonsByCity(city: string): Promise<Salon[]> {
    try {
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        const salons: Salon[] = [];

        salonsSnapshot.forEach((doc) => {
            const salon = doc.data();
            if (salon.city && salon.city.toLowerCase() === city.toLowerCase()) {
                salons.push({
                    id: doc.id,
                    name: salon.name,
                    location: salon.location,
                    city: salon.city,
                    address: salon.address
                });
            }
        });

        return salons;
    } catch (error) {
        console.error('Error fetching salons:', error);
        return [];
    }
}

// Build system prompt with available locations
export async function buildSystemPromptWithLocations(): Promise<string> {
    const locations = await getAvailableLocations();
    const locationsList = locations.length > 0
        ? locations.join(', ')
        : 'Mumbai, Delhi, Bangalore';

    return `You are a helpful salon booking assistant. Follow this exact conversation flow:

1. FIRST: Ask for the customer's location/city
2. Available locations: ${locationsList}
3. If location is available: List salons in that location and proceed with booking
4. If location NOT available: Say "Sorry, we are not available in [location] currently. You may check some other location."

Booking Flow (after location confirmed):
- Collect: name, email, phone
- Show available salons in their city
- Collect: service, date, time

Available Services:
- Haircut & Styling (₹1000, 60 min)
- Hair Coloring (₹3500, 120 min)
- Spa Treatment (₹4500, 120 min)
- Manicure & Pedicure (₹1000, 60 min)
- Professional Makeup (₹3000, 90 min)
- Facial Treatment (₹1500, 75 min)

When user confirms, respond with JSON:
{
  "confirmed": true,
  "customerName": "...",
  "customerEmail": "...",
  "customerPhone": "...",
  "salonName": "...",
  "salonId": "...",
  "services": [{"id": "...", "name": "...", "price": 1000, "duration": 60}],
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "totalAmount": 1000
}`;
}
