// Direct API test to diagnose data persistence issue
async function testAddEmployee() {
  console.log('=== Test 1: Add Employee Flow ===');
  
  // Message 1: Intent
  const msg1 = await fetch('/api/admin-chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: 'Add new stylist Sarah'})
  }).then(r => r.json());
  
  console.log('Message 1 Response:', msg1);
  const conversationId = msg1.conversationId;
  
  // Message 2: Categories
  const msg2 = await fetch('/api/admin-chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: 'Hair coloring and makeup', conversationId})
  }).then(r => r.json());
  
  console.log('Message 2 Response:', msg2);
  
  // Message 3: Email
  const msg3 = await fetch('/api/admin-chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: 'sarah@salon.com', conversationId})
  }).then(r => r.json());
  
  console.log('Message 3 Response:', msg3);
  
  // Message 4: Phone
  const msg4 = await fetch('/api/admin-chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: '555-9876', conversationId})
  }).then(r => r.json());
  
  console.log('Message 4 Response:', msg4);
  console.log('Action Result:', msg4.actionResult);
  
  // Wait a moment then check Firestore
  await new Promise(r => setTimeout(r, 2000));
  console.log('Check Firestore employees collection now!');
}

// Run the test
testAddEmployee();
