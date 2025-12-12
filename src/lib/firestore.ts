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
        // Check for duplicate (by email or phone)
        const q = query(
            collection(db, COLLECTIONS.EMPLOYEES),
            where('email', '==', employeeData.email)
            // Note: Firestore requires composite index for OR queries or multiple queries. 
            // For simplicity/speed, we check email first.
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log("Employee already exists, skipping creation.");
            return snapshot.docs[0].id; // Return existing ID
        }

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

// Revenue
export const getRevenue = async (date: string) => {
    // date format: YYYY-MM-DD
    try {
        console.log('🔍 [getRevenue] Querying revenue for date:', date);

        // Firestore stores 'date' as a Timestamp, not a string!
        // Convert "2025-12-06" to Timestamp range (start and end of day)
        const dateObj = new Date(date + 'T00:00:00');
        const startOfDay = Timestamp.fromDate(dateObj);
        const endOfDay = Timestamp.fromDate(new Date(date + 'T23:59:59'));

        console.log('🔍 [getRevenue] Querying with Timestamp range:', {
            start: startOfDay.toDate().toISOString(),
            end: endOfDay.toDate().toISOString()
        });

        const q = query(
            collection(db, 'daily_revenue'),
            where('date', '>=', startOfDay),
            where('date', '<=', endOfDay)
        );
        const querySnapshot = await getDocs(q);

        console.log('🔍 [getRevenue] Query returned', querySnapshot.size, 'documents');

        if (querySnapshot.empty) {
            console.log('⚠️ [getRevenue] No documents found for date:', date);
            return 0;
        }

        const docData = querySnapshot.docs[0].data();
        console.log('🔍 [getRevenue] Document data:', JSON.stringify(docData, null, 2));

        const revenue = docData.totalRevenue || 0;
        console.log('✅ [getRevenue] Returning revenue:', revenue);

        return revenue;
    } catch (error) {
        console.error('❌ [getRevenue] Error getting revenue:', error);
        throw error;
    }
};

// Admin Actions
export const reassignAppointments = async (employeeName: string, date: string) => {
    try {
        // 1. Find employee ID by name (Case Insensitive)
        const employeesSnap = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
        const employeeDoc = employeesSnap.docs.find(doc =>
            doc.data().name?.toLowerCase() === employeeName.toLowerCase()
        );

        if (!employeeDoc) {
            throw new Error(`Employee ${employeeName} not found`);
        }

        const employeeId = employeeDoc.id;

        // 2. Find all bookings for this employee on this date
        // Note: In a real app, date comparison might need start/end timestamps
        const bookingsQuery = query(
            collection(db, COLLECTIONS.BOOKINGS),
            where('employeeId', '==', employeeId),
            where('date', '==', date)
        );
        const bookingsSnap = await getDocs(bookingsQuery);

        const updates = [];
        for (const bookingDoc of bookingsSnap.docs) {
            updates.push(updateDoc(bookingDoc.ref, {
                status: 'reschedule',
                previousEmployeeId: employeeId,
                updatedAt: Timestamp.now()
            }));
        }

        await Promise.all(updates);
        return bookingsSnap.size; // Return count of rescheduled appointments
    } catch (error) {
        console.error('Error reassigning appointments:', error);
        throw error; // Re-throw to handle in service
    }
};

export const assignBookingToEmployee = async (bookingId: string, employeeName: string) => {
    try {
        console.log(`Attempting to assign booking ${bookingId} to ${employeeName}`);

        // 1. Find employee ID by name (Case Insensitive)
        const employeesSnap = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
        const employeeDoc = employeesSnap.docs.find(doc =>
            doc.data().name?.toLowerCase() === employeeName.toLowerCase()
        );

        if (!employeeDoc) {
            console.error(`Employee not found: ${employeeName}`);
            throw new Error(`Employee '${employeeName}' not found. Please verify the name.`);
        }

        const employeeId = employeeDoc.id;
        const actualEmployeeName = employeeDoc.data().name; // Use DB name for consistency

        // 2. Update Booking
        // Handle "formatted" IDs (like #7hCFkw) or partial IDs using search
        let cleanBookingId = bookingId.startsWith('#') ? bookingId.substring(1) : bookingId;

        let bookingRef = doc(db, COLLECTIONS.BOOKINGS, cleanBookingId);
        let bookingSnap = await getDoc(bookingRef);

        // If direct lookup fails, try searching by prefix (handle truncated IDs from UI)
        if (!bookingSnap.exists()) {
            console.log(`Direct lookup failed for ${cleanBookingId}, trying partial match...`);
            const bookingsQuery = query(collection(db, COLLECTIONS.BOOKINGS), orderBy('createdAt', 'desc'), limit(100));
            const bookingsSnap = await getDocs(bookingsQuery);

            const match = bookingsSnap.docs.find(d => d.id.startsWith(cleanBookingId));
            if (match) {
                bookingRef = match.ref;
                bookingSnap = match;
                cleanBookingId = match.id;
                console.log(`Found partial match: ${match.id}`);
            } else {
                console.error(`Booking not found: ${cleanBookingId}`);
                throw new Error(`Booking ID '${bookingId}' not found.`);
            }
        }

        await updateDoc(bookingRef, {
            assignedEmployeeId: employeeId,
            assignedEmployeeName: actualEmployeeName,
            status: 'assigned',
            updatedAt: Timestamp.now()
        });

        // Also update the employee's status to 'busy'
        const employeeRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
        await updateDoc(employeeRef, {
            status: 'busy',
            updatedAt: Timestamp.now()
        });

        console.log(`Successfully assigned ${cleanBookingId} to ${actualEmployeeName} and marked as busy`);
        return actualEmployeeName;

    } catch (error) {
        console.error('Error in assignBookingToEmployee:', error);
        throw error;
    }
};

export const cancelBooking = async (bookingId: string) => {
    try {
        let cleanBookingId = bookingId.startsWith('#') ? bookingId.substring(1) : bookingId;
        let bookingRef = doc(db, COLLECTIONS.BOOKINGS, cleanBookingId);
        let bookingSnap = await getDoc(bookingRef);

        // Partial match fallback
        if (!bookingSnap.exists()) {
            const bookingsQuery = query(collection(db, COLLECTIONS.BOOKINGS), orderBy('createdAt', 'desc'), limit(100));
            const bookingsSnap = await getDocs(bookingsQuery);

            const match = bookingsSnap.docs.find(d => d.id.startsWith(cleanBookingId));
            if (match) {
                bookingRef = match.ref;
                bookingSnap = match;
                cleanBookingId = match.id;
            } else {
                throw new Error(`Booking ID '${bookingId}' not found.`);
            }
        }

        await updateDoc(bookingRef, {
            status: 'cancelled',
            updatedAt: Timestamp.now()
        });

        return cleanBookingId;
    } catch (error) {
        console.error('Error canceling booking:', error);
        throw error;
    }
};
