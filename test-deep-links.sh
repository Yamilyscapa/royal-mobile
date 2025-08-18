#!/bin/bash

# Test script for deep links in The Royal Barber app
# Make sure the app is running in development mode

echo "🧪 Testing Deep Links for The Royal Barber App"
echo "=============================================="

# Test success deep link
echo ""
echo "✅ Testing Payment Success Deep Link..."
npx uri-scheme open "app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00" --ios

# Wait a moment
sleep 3

# Test failure deep link
echo ""
echo "❌ Testing Payment Failure Deep Link..."
npx uri-scheme open "app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Test%20error%20message" --ios

# Wait a moment
sleep 3

# Test legacy deep link
echo ""
echo "🔄 Testing Legacy Payment Callback Deep Link..."
npx uri-scheme open "app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00" --ios

echo ""
echo "🎯 Deep link tests completed!"
echo "Check the app to see if the navigation worked correctly."
echo ""
echo "📱 You can also test manually using the debug screen in the app:"
echo "   Navigate to /payment/debug in the app" 