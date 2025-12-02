import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { salons } from '@/data/salons';
import { services } from '@/data/services';

export async function POST(req: NextRequest) {
    try {
        // Check if collections are already populated
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        const servicesSnapshot = await getDocs(collection(db, 'services'));

        if (salonsSnapshot.size > 0 || servicesSnapshot.size > 0) {
            return NextResponse.json({
                success: false,
                message: 'Data already exists. Clear collections first if you want to re-migrate.',
                salonsCount: salonsSnapshot.size,
                servicesCount: servicesSnapshot.size,
            });
        }

        const results = {
            salons: [],
            services: [],
        };

        // Migrate Salons
        console.log('Migrating salons...');
        for (const salon of salons) {
            const docRef = await addDoc(collection(db, 'salons'), {
                ...salon,
                createdAt: new Date(),
            });
            results.salons.push({ id: docRef.id, name: salon.name });
            console.log(`Added salon: ${salon.name}`);
        }

        // Migrate Services  
        console.log('Migrating services...');
        for (const service of services) {
            const docRef = await addDoc(collection(db, 'services'), {
                ...service,
                createdAt: new Date(),
            });
            results.services.push({ id: docRef.id, name: service.name });
            console.log(`Added service: ${service.name}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Data migration completed successfully!',
            results: {
                salonsAdded: results.salons.length,
                servicesAdded: results.services.length,
                salons: results.salons,
                services: results.services,
            },
        });

    } catch (error: any) {
        console.error('Error migrating data:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Migration failed',
                details: error.code || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check migration status
export async function GET(req: NextRequest) {
    try {
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        const servicesSnapshot = await getDocs(collection(db, 'services'));

        const salons = salonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const services = servicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({
            success: true,
            salonsCount: salons.length,
            servicesCount: services.length,
            salons,
            services,
        });

    } catch (error: any) {
        console.error('Error checking data:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to check data',
            },
            { status: 500 }
        );
    }
}
