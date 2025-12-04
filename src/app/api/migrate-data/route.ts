import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { salons } from '@/data/salons';
import { services } from '@/data/services';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        // Check if collections are already populated
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        const servicesSnapshot = await getDocs(collection(db, 'services'));

        if ((salonsSnapshot.size > 0 || servicesSnapshot.size > 0) && !force) {
            return NextResponse.json({
                success: false,
                message: 'Data already exists. Use ?force=true to overwrite.',
                salonsCount: salonsSnapshot.size,
                servicesCount: servicesSnapshot.size,
            });
        }

        if (force) {
            console.log('Force flag detected. Clearing collections...');
            for (const doc of salonsSnapshot.docs) {
                await deleteDoc(doc.ref);
            }
            for (const doc of servicesSnapshot.docs) {
                await deleteDoc(doc.ref);
            }
            console.log('Collections cleared.');
        }

        const results: { salons: { id: string; name: string }[]; services: { id: string; name: string }[] } = {
            salons: [],
            services: [],
        };

        // Migrate Salons
        console.log('Migrating salons...');
        for (const salon of salons) {
            await setDoc(doc(db, 'salons', salon.id), {
                ...salon,
                createdAt: new Date(),
            });
            results.salons.push({ id: salon.id, name: salon.name });
            console.log(`Added salon: ${salon.name}`);
        }

        // Migrate Services  
        console.log('Migrating services...');
        for (const service of services) {
            // Services can still use auto-ID or we can use their ID if unique. 
            // The data has IDs like 'haircut', 'facial'. Let's use them for consistency.
            if (service.id) {
                await setDoc(doc(db, 'services', service.id), {
                    ...service,
                    createdAt: new Date(),
                });
                results.services.push({ id: service.id, name: service.name });
            } else {
                const docRef = await addDoc(collection(db, 'services'), {
                    ...service,
                    createdAt: new Date(),
                });
                results.services.push({ id: docRef.id, name: service.name });
            }

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

        const salonsData = salonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const servicesData = servicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({
            success: true,
            salonsCount: salonsData.length,
            servicesCount: servicesData.length,
            salons: salonsData,
            services: servicesData,
        });

    } catch (error: any) {
        console.error('Error checking data:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Failed to check data',
            },
            { status: 500 }
        );
    }
}
