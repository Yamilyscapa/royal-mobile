#!/usr/bin/env node

/**
 * Enhanced Deep Link Test Script
 * Tests both app:// and theroyalbarber:// schemes
 */

const { execSync } = require('child_process');

const testUrls = [
  // Test both schemes for success
  {
    name: 'Success - App Scheme',
    url: 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  },
  {
    name: 'Success - TheRoyalBarber Scheme',
    url: 'theroyalbarber://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  },
  
  // Test both schemes for failure
  {
    name: 'Failed - App Scheme',
    url: 'app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario'
  },
  {
    name: 'Failed - TheRoyalBarber Scheme',
    url: 'theroyalbarber://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario'
  },
  
  // Test legacy callback
  {
    name: 'Legacy Callback - App Scheme',
    url: 'app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  },
  {
    name: 'Legacy Callback - TheRoyalBarber Scheme',
    url: 'theroyalbarber://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00'
  }
];

console.log('🧪 Enhanced Deep Link Testing');
console.log('=============================');
console.log('');

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

// Function to check if app is running
function checkAppStatus() {
  console.log('🔍 Checking app status...');
  
  try {
    // Check if Expo is running
    const expoStatus = execSync('npx expo diagnostics', { encoding: 'utf8' });
    console.log('✅ Expo diagnostics:', expoStatus);
  } catch (error) {
    console.log('❌ Expo not running or error:', error.message);
  }
  
  console.log('');
}

// Function to validate URL format
function validateUrl(url) {
  try {
    const urlObj = new URL(url);
    console.log('✅ URL format is valid');
    console.log('   Scheme:', urlObj.protocol);
    console.log('   Host:', urlObj.host);
    console.log('   Path:', urlObj.pathname);
    console.log('   Search params:', urlObj.search);
    return true;
  } catch (error) {
    console.log('❌ URL format is invalid:', error.message);
    return false;
  }
}

// Main test execution
console.log('🚀 Starting deep link tests...\n');

// Check app status first
checkAppStatus();

// Test each URL
testUrls.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  
  // Validate URL format
  if (validateUrl(testCase.url)) {
    testUrl(testCase);
  } else {
    console.log('⏭️  Skipping invalid URL');
  }
  
  // Add delay between tests
  if (index < testUrls.length - 1) {
    console.log('⏳ Waiting 2 seconds before next test...');
    setTimeout(() => {}, 2000);
  }
});

console.log('\n📋 Test Summary:');
console.log('================');
console.log('✅ All URLs have been tested');
console.log('📱 Check your device/simulator for deep link behavior');
console.log('🔍 Monitor console logs for navigation messages');
console.log('');

console.log('🔧 Troubleshooting Tips:');
console.log('=======================');
console.log('1. Make sure the app is running in development mode');
console.log('2. Check that both URL schemes are registered');
console.log('3. Verify the app is properly installed');
console.log('4. Look for console messages starting with 🔗');
console.log('5. Test on both iOS and Android devices');
console.log('');

console.log('📱 Expected Console Messages:');
console.log('============================');
console.log('🔗 Global URL handler received: [URL]');
console.log('✅ Successfully navigated to payment success screen');
console.log('✅ Successfully navigated to payment failed screen');
console.log('🔄 Final fallback: Showing success/failed alert');
console.log('');

console.log('🎯 Next Steps:');
console.log('=============');
console.log('1. Test each URL manually on your device');
console.log('2. Verify navigation works correctly');
console.log('3. Check that payment callbacks are handled');
console.log('4. Test with real payment flow');
console.log('5. Deploy to production when satisfied'); 