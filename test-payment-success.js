#!/usr/bin/env node

/**
 * Test Payment Success Deep Links
 * This script tests the payment success deep links to ensure they work correctly
 */

const { execSync } = require('child_process');

console.log('🧪 Testing Payment Success Deep Links');
console.log('=====================================');
console.log('');

// Test URLs for payment success
const testUrls = [
  {
    name: 'Payment Success - App Scheme',
    url: 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=30/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  },
  {
    name: 'Payment Success - TheRoyalBarber Scheme',
    url: 'theroyalbarber://payment/success?status=success&timeSlot=14:30&appointmentDate=30/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  },
  {
    name: 'Payment Success - Simple URL',
    url: 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=30/07/2025&serviceName=Corte Clasico&barberName=Juan Perez&amount=250.00'
  }
];

// Function to test a URL
function testUrl(testCase) {
  console.log(`📱 Testing: ${testCase.name}`);
  console.log(`🔗 URL: ${testCase.url}`);
  
  try {
    // Test on iOS
    console.log('📱 Testing on iOS...');
    execSync(`npx uri-scheme open "${testCase.url}" --ios`, { stdio: 'inherit' });
    console.log('✅ iOS test command executed');
  } catch (error) {
    console.log('❌ iOS test failed:', error.message);
  }
  
  try {
    // Test on Android
    console.log('🤖 Testing on Android...');
    execSync(`npx uri-scheme open "${testCase.url}" --android`, { stdio: 'inherit' });
    console.log('✅ Android test command executed');
  } catch (error) {
    console.log('❌ Android test failed:', error.message);
  }
  
  console.log('');
}

// Main test execution
console.log('🚀 Starting payment success tests...\n');

// Test each URL
testUrls.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  testUrl(testCase);
});

console.log('\n📋 Test Summary:');
console.log('================');
console.log('✅ All payment success URLs have been tested');
console.log('📱 Check your device/simulator for navigation to success screen');
console.log('🔍 Monitor console logs for navigation messages');
console.log('');

console.log('🎯 Expected Behavior:');
console.log('=====================');
console.log('1. App should open and navigate to /payment/success');
console.log('2. Success screen should display appointment details');
console.log('3. Console should show: "🔗 Global URL handler received"');
console.log('4. Console should show: "✅ Successfully navigated to payment success screen"');
console.log('');

console.log('🔧 If Tests Fail:');
console.log('=================');
console.log('1. Make sure the app is running in development mode');
console.log('2. Check that deep links are properly configured in app.json');
console.log('3. Verify the success screen exists at /payment/success');
console.log('4. Check console logs for any error messages');
console.log('');

console.log('📱 Manual Testing:');
console.log('==================');
console.log('1. Open the app and go to appointment booking');
console.log('2. Complete a test payment');
console.log('3. Verify it redirects to the success screen');
console.log('4. Check that all appointment details are displayed correctly'); 