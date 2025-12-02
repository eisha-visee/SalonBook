import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Collections
export const COLLECTIONS = {
    SALONS: 'salons',
    SERVICES: 'services',
    BOOKINGS: 'bookings',
    CLIENTS: 'clients',
    EMPLOYEES: 'employees',
};

// Salons
export const getSalons = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.SALONS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting salons:', error);
        throw error;
    }
};

export const getSalonById = async (id: string) => {
    try {
        const docRef = doc(db, COLLECTIONS.SALONS, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting salon:', error);
        throw error;
    }
};

export const getSalonsByCity = async (city: string) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.SALONS),
            where('location.city', '==', city)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting salons by city:', error);
        throw error;
    }
};

// Services
export const getServices = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.SERVICES));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting services:', error);
        throw error;
    }
};

export const getServiceById = async (id: string) => {
    try {
        const docRef = doc(db, COLLECTIONS.SERVICES, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting service:', error);
        throw error;
    }
};

// Bookings
export const getBookings = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting bookings:', error);
        throw error;
    }
};

export const createBooking = async (bookingData: any) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
            ...bookingData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};

export const updateBooking = async (id: string, data: any) => {
    try {
        const docRef = doc(db, COLLECTIONS.BOOKINGS, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        throw error;
    }
};

export const deleteBooking = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.BOOKINGS, id));
    } catch (error) {
        console.error('Error deleting booking:', error);
        throw error;
    }
};

// Clients
export const getClients = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.CLIENTS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting clients:', error);
        throw error;
    }
};

export const createClient = async (clientData: any) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
            ...clientData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating client:', error);
        throw error;
    }
};

// Employees
export const getEmployees = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting employees:', error);
        throw error;
    }
};

export const createEmployee = async (employeeData: any) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), {
            ...employeeData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating employee:', error);
        throw error;
    }
};
