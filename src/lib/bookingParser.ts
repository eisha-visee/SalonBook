/**
 * Booking Parser Utility
 * Extracts structured booking information from conversational text
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ParsedBooking {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    salonName: string;
    salonId: string;
    services: {
        id: string;
        name: string;
        price: number;
        duration: number;
    }[];
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    totalAmount: number;
    status: 'pending';
    bookingSource: 'ai-assistant';
}

// Salon name to ID mapping
const SALON_MAP: Record<string, string> = {
    'glamour lounge': 'glamour-lounge-mumbai',
    'bliss beauty studio': 'bliss-beauty-studio-delhi',
    'radiance salon': 'radiance-salon-spa-bangalore',
    'radiance salon & spa': 'radiance-salon-spa-bangalore',
    'elegance studio': 'elegance-studio-mumbai',
    'chic salon': 'chic-salon-delhi',
    'aurora beauty bar': 'aurora-beauty-bar-bangalore',
};

// Service mapping
const SERVICE_MAP: Record<string, { id: string; name: string; price: number; duration: number }> = {
    'haircut': { id: 'haircut', name: 'Haircut & Styling', price: 1000, duration: 60 },
    'haircut & styling': { id: 'haircut', name: 'Haircut & Styling', price: 1000, duration: 60 },
    'hair coloring': { id: 'hair-coloring', name: 'Hair Coloring', price: 3500, duration: 120 },
    'coloring': { id: 'hair-coloring', name: 'Hair Coloring', price: 3500, duration: 120 },
    'spa': { id: 'spa-treatment', name: 'Spa Treatment', price: 4500, duration: 120 },
    'spa treatment': { id: 'spa-treatment', name: 'Spa Treatment', price: 4500, duration: 120 },
    'manicure': { id: 'manicure-pedicure', name: 'Manicure & Pedicure', price: 1000, duration: 60 },
    'pedicure': { id: 'manicure-pedicure', name: 'Manicure & Pedicure', price: 1000, duration: 60 },
    'manicure & pedicure': { id: 'manicure-pedicure', name: 'Manicure & Pedicure', price: 1000, duration: 60 },
    'makeup': { id: 'professional-makeup', name: 'Professional Makeup', price: 3000, duration: 90 },
    'professional makeup': { id: 'professional-makeup', name: 'Professional Makeup', price: 3000, duration: 90 },
    'facial': { id: 'facial-treatment', name: 'Facial Treatment', price: 1500, duration: 75 },
    'facial treatment': { id: 'facial-treatment', name: 'Facial Treatment', price: 1500, duration: 75 },
};

/**
 * Extract email from text
 */
function extractEmail(text: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
}

/**
 * Extract phone number from text (Indian format)
 */
function extractPhone(text: string): string | null {
    // Match 10-digit phone numbers
    const phoneRegex = /\b(\d{10})\b/;
    const match = text.match(phoneRegex);
    return match ? match[1] : null;
}

/**
 * Extract date in YYYY-MM-DD format
 */
function extractDate(text: string): string | null {
    // Match YYYY-MM-DD format
    const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
    const match = text.match(dateRegex);
    if (match) return match[1];

    // Try to parse natural language dates
    const lowerText = text.toLowerCase();

    // Handle "tomorrow", "today", etc.
    const today = new Date();

    if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    if (lowerText.includes('today')) {
        return today.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Extract time in HH:MM format
 */
function extractTime(text: string): string | null {
    // Match HH:MM format (24-hour)
    const timeRegex = /\b(\d{2}:\d{2})\b/;
    const match = text.match(timeRegex);
    if (match) return match[1];

    // Match time with AM/PM
    const ampmRegex = /\b(\d{1,2}):?(\d{2})?\s*(am|pm)\b/i;
    const ampmMatch = text.match(ampmRegex);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = ampmMatch[2] || '00';
        const period = ampmMatch[3].toLowerCase();

        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return null;
}

/**
 * Extract customer name from text
 */
function extractName(text: string): string | null {
    // Look for patterns like "my name is X" or "I'm X"
    const patterns = [
        /my name is ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /i'm ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /this is ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /call me ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Extract salon name from text
 */
function extractSalon(text: string): { name: string; id: string } | null {
    const lowerText = text.toLowerCase();

    for (const [key, id] of Object.entries(SALON_MAP)) {
        if (lowerText.includes(key)) {
            // Capitalize salon name
            const name = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return { name, id };
        }
    }

    return null;
}

/**
 * Extract service from text
 */
function extractService(text: string): typeof SERVICE_MAP[string] | null {
    const lowerText = text.toLowerCase();

    for (const [key, service] of Object.entries(SERVICE_MAP)) {
        if (lowerText.includes(key)) {
            return service;
        }
    }

    return null;
}

/**
 * Parse booking details from conversation transcript
 */
export function parseBookingFromTranscript(transcript: string): Partial<ParsedBooking> {
    const booking: Partial<ParsedBooking> = {
        status: 'pending',
        bookingSource: 'ai-assistant'
    };

    // Extract each field
    const name = extractName(transcript);
    if (name) booking.customerName = name;

    const email = extractEmail(transcript);
    if (email) booking.customerEmail = email;

    const phone = extractPhone(transcript);
    if (phone) booking.customerPhone = phone;

    const salon = extractSalon(transcript);
    if (salon) {
        booking.salonName = salon.name;
        booking.salonId = salon.id;
    }

    const service = extractService(transcript);
    if (service) {
        booking.services = [service];
        booking.totalAmount = service.price;
    }

    const date = extractDate(transcript);
    if (date) booking.date = date;

    const time = extractTime(transcript);
    if (time) booking.time = time;

    return booking;
}

/**
 * Check if booking has all required fields
 */
export function isBookingComplete(booking: Partial<ParsedBooking>): booking is ParsedBooking {
    return !!(
        booking.customerName &&
        booking.customerEmail &&
        booking.customerPhone &&
        booking.salonName &&
        booking.salonId &&
        booking.services &&
        booking.services.length > 0 &&
        booking.date &&
        booking.time &&
        booking.totalAmount !== undefined
    );
}

/**
 * Format booking for display
 */
export function formatBookingForDisplay(booking: Partial<ParsedBooking>): string {
    const parts: string[] = [];

    if (booking.customerName) parts.push(`Name: ${booking.customerName}`);
    if (booking.customerEmail) parts.push(`Email: ${booking.customerEmail}`);
    if (booking.customerPhone) parts.push(`Phone: ${booking.customerPhone}`);
    if (booking.salonName) parts.push(`Salon: ${booking.salonName}`);
    if (booking.services && booking.services.length > 0) {
        parts.push(`Service: ${booking.services.map(s => s.name).join(', ')}`);
    }
    if (booking.date) parts.push(`Date: ${booking.date}`);
    if (booking.time) parts.push(`Time: ${booking.time}`);
    if (booking.totalAmount) parts.push(`Total: ₹${booking.totalAmount}`);

    return parts.join('\n');
}
