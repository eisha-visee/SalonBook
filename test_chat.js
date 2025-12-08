// Test script to send messages to admin-chat API and check responses
const BASE_URL = 'http://localhost:3000/api/admin-chat';

async function testChat(message) {
  console.log(`\n>>> Sending: "${message}"`);
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationId: 'test-123' })
    });
    
    const data = await response.json();
    console.log('<<< Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  // Test 1: Add employee intent
  await testChat('Add new stylist Rahul');
  
  // Test 2: Respond to specialties
  await testChat('Hair coloring, makeup');
  
  // Test 3: Email
  await testChat('rahul@salon.com');
  
  // Test 4: Phone
  await testChat('555-1234');
}

runTests();
