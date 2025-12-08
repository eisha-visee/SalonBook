import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, setDoc, doc, Timestamp, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'seed-revenue') {
      console.log('[Seed] Starting Firestore data seeding...');

      // 1. Create service documents with pricing
      const services = [
        { name: 'Hair Cut', price: 25 },
        { name: 'Hair Coloring', price: 60 },
        { name: 'Makeup', price: 40 },
        { name: 'Hair Styling', price: 35 },
        { name: 'Manicure', price: 20 },
        { name: 'Pedicure', price: 25 }
      ];

      console.log('[Seed] Creating services...');
      const serviceIds: { [key: string]: string } = {};
      for (const service of services) {
        const docRef = await addDoc(collection(db, 'services'), {
          name: service.name,
          price: service.price,
          createdAt: Timestamp.now()
        });
        serviceIds[service.name] = docRef.id;
        console.log(`[Seed] ✓ Created service: ${service.name} ($${service.price})`);
      }

      // 2. Create bookings for yesterday (test revenue)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const bookings = [
        {
          clientId: 'client1',
          employeeId: 'emp1',
          salonId: 'salon1',
          serviceId: serviceIds['Hair Cut'],
          serviceName: 'Hair Cut',
          appointmentDate: Timestamp.fromDate(yesterday),
          appointmentTime: '10:00 AM',
          status: 'completed',
          amount: 25,
          price: 25,
          createdAt: Timestamp.now()
        },
        {
          clientId: 'client2',
          employeeId: 'emp2',
          salonId: 'salon1',
          serviceId: serviceIds['Hair Coloring'],
          serviceName: 'Hair Coloring',
          appointmentDate: Timestamp.fromDate(yesterday),
          appointmentTime: '11:00 AM',
          status: 'completed',
          amount: 60,
          price: 60,
          createdAt: Timestamp.now()
        },
        {
          clientId: 'client3',
          employeeId: 'emp1',
          salonId: 'salon1',
          serviceId: serviceIds['Makeup'],
          serviceName: 'Makeup',
          appointmentDate: Timestamp.fromDate(yesterday),
          appointmentTime: '2:00 PM',
          status: 'completed',
          amount: 40,
          price: 40,
          createdAt: Timestamp.now()
        },
        {
          clientId: 'client4',
          employeeId: 'emp3',
          salonId: 'salon1',
          serviceId: serviceIds['Hair Styling'],
          serviceName: 'Hair Styling',
          appointmentDate: Timestamp.fromDate(yesterday),
          appointmentTime: '3:30 PM',
          status: 'completed',
          amount: 35,
          price: 35,
          createdAt: Timestamp.now()
        }
      ];

      console.log('[Seed] Creating bookings for yesterday...');
      let yesterdayRevenue = 0;
      for (const booking of bookings) {
        await addDoc(collection(db, 'bookings'), booking);
        yesterdayRevenue += booking.amount;
        console.log(`[Seed] ✓ Created booking: ${booking.serviceName} - $${booking.amount}`);
      }

      // 3. Create daily revenue record for yesterday
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      await setDoc(doc(db, 'daily_revenue', yesterdayKey), {
        date: Timestamp.fromDate(yesterday),
        totalRevenue: yesterdayRevenue,
        bookingCount: bookings.length,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`[Seed] ✓ Created daily revenue for ${yesterdayKey}: $${yesterdayRevenue}`);

      // 4. Create bookings for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayBookings = [
        {
          clientId: 'client5',
          employeeId: 'emp2',
          salonId: 'salon1',
          serviceId: serviceIds['Hair Cut'],
          serviceName: 'Hair Cut',
          appointmentDate: Timestamp.fromDate(today),
          appointmentTime: '9:00 AM',
          status: 'completed',
          amount: 25,
          price: 25,
          createdAt: Timestamp.now()
        },
        {
          clientId: 'client6',
          employeeId: 'emp1',
          salonId: 'salon1',
          serviceId: serviceIds['Manicure'],
          serviceName: 'Manicure',
          appointmentDate: Timestamp.fromDate(today),
          appointmentTime: '11:00 AM',
          status: 'completed',
          amount: 20,
          price: 20,
          createdAt: Timestamp.now()
        }
      ];

      console.log('[Seed] Creating bookings for today...');
      let todayRevenue = 0;
      for (const booking of todayBookings) {
        await addDoc(collection(db, 'bookings'), booking);
        todayRevenue += booking.amount;
        console.log(`[Seed] ✓ Created booking: ${booking.serviceName} - $${booking.amount}`);
      }

      // Create today's revenue record
      const todayKey = today.toISOString().split('T')[0];
      await setDoc(doc(db, 'daily_revenue', todayKey), {
        date: Timestamp.fromDate(today),
        totalRevenue: todayRevenue,
        bookingCount: todayBookings.length,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`[Seed] ✓ Created daily revenue for ${todayKey}: $${todayRevenue}`);

      // 5. Create bookings for this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      console.log('[Seed] Creating bookings for this week...');
      let weekRevenue = yesterdayRevenue + todayRevenue;

      const weekKey = `week_${weekStart.toISOString().split('T')[0]}`;
      await setDoc(doc(db, 'daily_revenue', weekKey), {
        date: Timestamp.fromDate(weekStart),
        totalRevenue: weekRevenue,
        bookingCount: bookings.length + todayBookings.length,
        period: 'week',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`[Seed] ✓ Created weekly revenue record: $${weekRevenue}`);

      return NextResponse.json({
        success: true,
        message: 'Firestore seeding complete!',
        data: {
          servicesCreated: services.length,
          bookingsYesterday: bookings.length,
          bookingsToday: todayBookings.length,
          revenueYesterday: yesterdayRevenue,
          revenueToday: todayRevenue,
          revenueWeek: weekRevenue
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed' },
      { status: 500 }
    );
  }
}
