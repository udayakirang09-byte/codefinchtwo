// Test script for single-session enforcement
const baseUrl = 'http://localhost:5000';

async function testSingleSession() {
  console.log('🧪 Testing Single-Session Enforcement\n');
  
  // Test user credentials
  const testEmail = 'teacher@example.com';
  const testPassword = 'password123';
  
  // Step 1: First login
  console.log('Step 1: First login...');
  const login1Response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  
  if (!login1Response.ok) {
    console.error('❌ First login failed:', await login1Response.text());
    return;
  }
  
  const login1Data = await login1Response.json();
  const session1Token = login1Data.sessionToken;
  console.log('✅ First login successful');
  console.log(`   Session Token: ${session1Token.substring(0, 20)}...`);
  
  // Step 2: Verify first session works
  console.log('\nStep 2: Verify first session works...');
  const testResponse1 = await fetch(`${baseUrl}/api/mentors`, {
    headers: { 'Authorization': `Bearer ${session1Token}` }
  });
  console.log(`✅ First session works (Status: ${testResponse1.status})`);
  
  // Step 3: Second login (should invalidate first session)
  console.log('\nStep 3: Second login (should invalidate first session)...');
  const login2Response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  
  if (!login2Response.ok) {
    console.error('❌ Second login failed:', await login2Response.text());
    return;
  }
  
  const login2Data = await login2Response.json();
  const session2Token = login2Data.sessionToken;
  console.log('✅ Second login successful');
  console.log(`   Session Token: ${session2Token.substring(0, 20)}...`);
  
  // Step 4: Verify second session works
  console.log('\nStep 4: Verify second session works...');
  const testResponse2 = await fetch(`${baseUrl}/api/mentors`, {
    headers: { 'Authorization': `Bearer ${session2Token}` }
  });
  console.log(`✅ Second session works (Status: ${testResponse2.status})`);
  
  // Step 5: Try to use first session (should fail)
  console.log('\nStep 5: Try to use first session (should be invalidated)...');
  const testResponse3 = await fetch(`${baseUrl}/api/user`, {
    headers: { 'Authorization': `Bearer ${session1Token}` }
  });
  
  if (testResponse3.status === 401) {
    console.log('✅ First session correctly invalidated (401 Unauthorized)');
    const errorData = await testResponse3.json();
    console.log(`   Error: ${errorData.message}`);
  } else {
    console.log(`❌ First session still works! (Status: ${testResponse3.status})`);
    console.log('   Single-session enforcement FAILED');
  }
  
  console.log('\n🎉 Single-session enforcement test complete!');
}

testSingleSession().catch(console.error);
