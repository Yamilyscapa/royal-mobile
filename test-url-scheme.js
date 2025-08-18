#!/usr/bin/env node

// Test script to verify URL scheme registration
const { execSync } = require('child_process');

console.log('🧪 Testing URL Scheme Registration...');

// Test the app scheme
const testUrl = 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Test&barberName=Test&amount=250.00';

try {
  console.log('📱 Testing iOS URL scheme...');
  execSync(`npx uri-scheme open "${testUrl}" --ios`, { stdio: 'inherit' });
  console.log('✅ iOS URL scheme test completed');
} catch (error) {
  console.log('❌ iOS URL scheme test failed:', error.message);
}

try {
  console.log('🤖 Testing Android URL scheme...');
  execSync(`npx uri-scheme open "${testUrl}" --android`, { stdio: 'inherit' });
  console.log('✅ Android URL scheme test completed');
} catch (error) {
  console.log('❌ Android URL scheme test failed:', error.message);
}

console.log('\n📋 Troubleshooting Tips:');
console.log('1. Make sure the app is running in development mode');
console.log('2. Check that the URL scheme "app" is properly configured');
console.log('3. Verify the app.json has the correct scheme configuration');
console.log('4. Try restarting the development server');
console.log('5. Check the console for any error messages'); 