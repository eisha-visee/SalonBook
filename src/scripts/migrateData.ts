import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { salons } from '../data/salons';
import { services } from '../data/services';

/**
 * Script to migrate local data to Firestore
 * Run this once to populate your Firebase database
 */

async function migrateData() {
    try {
        console.log('Starting data migration...');

        // Migrate Salons
        console.log('Migrating salons...');
        for (const salon of salons) {
            await addDoc(collection(db, 'salons'), salon);
            console.log(`Added salon: ${salon.name}`);
        }

        // Migrate Services
        console.log('Migrating services...');
        for (const service of services) {
            await addDoc(collection(db, 'services'), service);
            console.log(`Added service: ${service.name}`);
        }

        console.log('Data migration completed successfully!');
    } catch (error) {
        console.error('Error migrating data:', error);
        throw error;
    }
}

// Uncomment the line below and run this file to migrate data
// migrateData();

export default migrateData;
