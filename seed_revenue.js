// Script to seed Firestore with sample bookings and revenue data
// Run in browser console at http://localhost:3000/admin/dashboard

async function seedFirestoreWithRevenue() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js');
  const { getFirestore, collection, addDoc, setDoc, doc, Timestamp, deleteDoc, getDocs, writeBatch, query, where } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
  
  const firebaseConfig = {
    apiKey: "AIzaSyDK-mNQMXrHvWaFpLKQPqVEsLXmQu0lP84",
    authDomain: "salon-book-e6ff7.firebaseapp.com",
    projectId: "salon-book-e6ff7",
    storageBucket: "salon-book-e6ff7.appspot.com",
    messagingSenderId: "835649556149",
    appId: "1:835649556149:web:3f7f6b1c3c8e8e8e8e8e8e"
  };
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Starting Firestore data seeding...');
  
  try {
    // 1. Create some service documents with pricing
    const services = [
      { name: 'Hair Cut', price: 25 },
      { name: 'Hair Coloring', price: 60 },
      { name: 'Makeup', price: 40 },
      { name: 'Hair Styling', price: 35 }
    ];
    
    console.log('Creating services...');
    const serviceIds = {};
    for (const service of services) {
      const docRef = await addDoc(collection(db, 'services'), {
        name: service.name,
        price: service.price,
        createdAt: Timestamp.now()
      });
      serviceIds[service.name] = docRef.id;
      console.log(`✓ Created service: ${service.name} ($${service.price})`);
    }
    
    // 2. Create some sample bookings for yesterday
    console.log('Creating sample bookings for revenue tracking...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
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
    
    let totalRevenue = 0;
    for (const booking of bookings) {
      const docRef = await addDoc(collection(db, 'bookings'), booking);
      totalRevenue += booking.amount;
      console.log(`✓ Created booking: ${booking.serviceName} - $${booking.amount}`);
    }
    
    // 3. Create daily revenue record
    console.log('Creating daily revenue aggregation...');
    const dateKey = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    await setDoc(doc(db, 'daily_revenue', dateKey), {
      date: Timestamp.fromDate(yesterday),
      totalRevenue: totalRevenue,
      bookingCount: bookings.length,
      bookings: bookings.length,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✓ Created daily revenue record for ${dateKey}: $${totalRevenue}`);
    
    // 4. Create sample booking for today
    console.log('Creating sample bookings for today...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBooking = {
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
    };
    
    await addDoc(collection(db, 'bookings'), todayBooking);
    console.log(`✓ Created today's booking: ${todayBooking.serviceName} - $${todayBooking.amount}`);
    
    // Create today's revenue record
    const todayKey = today.toISOString().split('T')[0];
    await setDoc(doc(db, 'daily_revenue', todayKey), {
      date: Timestamp.fromDate(today),
      totalRevenue: 25,
      bookingCount: 1,
      bookings: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✓ Created daily revenue record for ${todayKey}: $25`);
    
    console.log('\n✅ Firestore seeding complete!');
    console.log(`\nYou can now ask the admin assistant:\n  "What was my revenue yesterday?"\n  "What's my revenue for today?"\n  "Show me this week's revenue"`);
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
  }
}

// Run the seed function
seedFirestoreWithRevenue();
