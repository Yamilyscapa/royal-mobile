#!/usr/bin/env node

/**
 * Test script for Safari deep link compatibility
 * This script tests the deep links that might be causing Safari issues
 */

const testUrls = [
  // Test success callback with proper URL encoding
  'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00',
  
  // Test success callback with special characters
  'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico%20con%20Estilo&barberName=Jos%C3%A9%20Mar%C3%ADa%20Garc%C3%ADa&amount=300.00',
  
  // Test failed callback with proper URL encoding
  'app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario',
  
  // Test legacy callback with proper URL encoding
  'app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00',
  
  // Test unencoded URLs (for comparison)
  'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte Clásico&barberName=Juan Pérez&amount=250.00'
];

console.log('🧪 Testing Safari Deep Link Compatibility');
console.log('==========================================');
console.log('');

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}: ${url.includes('encode') ? 'Encoded' : 'Unencoded'} URL`);
  console.log(`URL: ${url}`);
  console.log('');
});

console.log('📱 To test these URLs:');
console.log('1. Make sure the app is running in development mode');
console.log('2. Use the debug screen in the app: /payment/debug');
console.log('3. Or use the terminal command:');
console.log('   npx uri-scheme open "URL_HERE" --ios');
console.log('');
console.log('🔍 Look for these console messages:');
console.log('• 🔗 Global URL handler received');
console.log('• ✅ Successfully navigated to payment success screen');
console.log('• 🔄 Final fallback: Showing success alert');
console.log('');
console.log('⚠️  If deep links fail, check:');
console.log('• App is properly installed and running');
console.log('• URL scheme is correctly configured');
console.log('• No special characters causing parsing issues');
console.log('• User is authenticated when deep link is received'); 