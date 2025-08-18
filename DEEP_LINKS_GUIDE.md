# 🔗 Deep Links Configuration Guide

## 📋 Overview

The Royal Barber app supports deep links for payment callbacks and other features. This guide covers the configuration, testing, and troubleshooting of deep links.

## 🔧 Configuration

### **URL Schemes**

The app supports two URL schemes:
- `app://` - Primary scheme
- `theroyalbarber://` - Alternative scheme for better branding

### **Supported Deep Links**

#### **Payment Success**
```
app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
theroyalbarber://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
```

#### **Payment Failed**
```
app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario
theroyalbarber://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario
```

#### **Legacy Payment Callback**
```
app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
theroyalbarber://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
```

## 🛠️ App Configuration

### **iOS Configuration (`app.json`)**

```json
{
  "ios": {
    "bundleIdentifier": "com.theroyalbarber.app",
    "buildNumber": "1",
    "associatedDomains": [
      "applinks:theroyalbarber.com"
    ],
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLName": "com.theroyalbarber.app",
          "CFBundleURLSchemes": ["app", "theroyalbarber"]
        }
      ],
      "LSApplicationQueriesSchemes": ["app", "theroyalbarber"],
      "CFBundleAllowMixedLocalizations": true
    }
  }
}
```

### **Android Configuration (`app.json`)**

```json
{
  "android": {
    "package": "com.theroyalbarber.app",
    "versionCode": 1,
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "app",
            "host": "payment",
            "pathPrefix": "/success"
          },
          {
            "scheme": "app",
            "host": "payment",
            "pathPrefix": "/failed"
          },
          {
            "scheme": "theroyalbarber",
            "host": "payment",
            "pathPrefix": "/success"
          },
          {
            "scheme": "theroyalbarber",
            "host": "payment",
            "pathPrefix": "/failed"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      },
      {
        "action": "VIEW",
        "autoVerify": false,
        "data": [
          {
            "scheme": "app",
            "host": "payment-callback"
          },
          {
            "scheme": "theroyalbarber",
            "host": "payment-callback"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

## 🧪 Testing

### **1. Manual Testing**

#### **Using Terminal**
```bash
# Test on iOS
npx uri-scheme open "app://payment/success?status=success&timeSlot=14:30" --ios

# Test on Android
npx uri-scheme open "app://payment/success?status=success&timeSlot=14:30" --android

# Test alternative scheme
npx uri-scheme open "theroyalbarber://payment/success?status=success&timeSlot=14:30" --ios
```

#### **Using Safari/Chrome**
1. Open Safari/Chrome on your device
2. Type the deep link URL in the address bar
3. Press Enter
4. The app should open and handle the deep link

### **2. Automated Testing**

#### **Run Enhanced Test Script**
```bash
cd apps/app
node test-deep-links-enhanced.js
```

#### **Run Basic Test Script**
```bash
cd apps/app
node test-deep-links-safari.js
```

### **3. Debug Testing**

#### **Using Debug Screen**
1. Open the app
2. Navigate to `/payment/debug`
3. Use the test buttons to trigger deep links

## 🔍 Troubleshooting

### **Common Issues**

#### **1. "Deep link not available" Warning**
**Cause**: URL scheme not properly registered
**Solution**:
```bash
# Clear Expo cache
expo start --clear

# Rebuild the app
expo run:ios
expo run:android
```

#### **2. Safari "Cannot Open Page" Error**
**Cause**: Safari doesn't recognize the URL scheme
**Solution**:
- Ensure the app is properly installed
- Check that both URL schemes are registered
- Test with the alternative scheme

#### **3. Deep Link Opens App But No Navigation**
**Cause**: Navigation logic not working
**Solution**:
- Check console logs for navigation messages
- Verify user is authenticated
- Check that the target screen exists

#### **4. Payment Callback Not Working**
**Cause**: Web browser not redirecting properly
**Solution**:
- Verify webhook configuration
- Check payment callback URLs
- Test with both URL schemes

### **Debug Steps**

#### **1. Check App Configuration**
```bash
# Verify app.json configuration
cat app.json | grep -A 20 "ios\|android"

# Check if schemes are registered
npx expo diagnostics
```

#### **2. Check Console Logs**
Look for these messages:
```
🔗 Global URL handler received: [URL]
🔗 Can open deep link [URL]: true/false
✅ Successfully navigated to payment success screen
🔄 Final fallback: Showing success alert
```

#### **3. Test URL Schemes**
```bash
# Test if schemes are available
npx uri-scheme list

# Test specific scheme
npx uri-scheme open "app://test" --ios
```

#### **4. Verify App Installation**
```bash
# Check if app is installed
npx expo run:ios --device
npx expo run:android --device
```

## 🚀 Production Deployment

### **1. App Store Configuration**

#### **iOS App Store**
- Ensure `associatedDomains` includes your domain
- Verify `CFBundleURLSchemes` are correct
- Test deep links on TestFlight

#### **Google Play Store**
- Verify `intentFilters` are properly configured
- Test deep links on internal testing
- Ensure `autoVerify` is set correctly

### **2. Domain Configuration**

#### **Apple App Site Association**
Create `/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.theroyalbarber.app",
        "paths": ["/payment/*"]
      }
    ]
  }
}
```

#### **Android Asset Links**
Create `/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.theroyalbarber.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

### **3. Payment Integration**

#### **Stripe Configuration**
```javascript
// In your payment success redirect
const successUrl = 'app://payment/success?status=success&timeSlot=' + encodeURIComponent(timeSlot);
const failedUrl = 'app://payment/failed?status=cancel&timeSlot=' + encodeURIComponent(timeSlot);

// Use both schemes for better compatibility
const urls = [
  successUrl,
  successUrl.replace('app://', 'theroyalbarber://'),
  failedUrl,
  failedUrl.replace('app://', 'theroyalbarber://')
];
```

## 📊 Monitoring

### **1. Analytics**
- Track deep link usage
- Monitor conversion rates
- Analyze user behavior

### **2. Error Tracking**
- Monitor deep link failures
- Track navigation errors
- Alert on critical issues

### **3. Performance**
- Measure deep link response time
- Track app launch performance
- Monitor user engagement

## 🔒 Security

### **1. URL Validation**
- Validate all incoming deep links
- Sanitize URL parameters
- Prevent malicious redirects

### **2. Authentication**
- Ensure user is authenticated
- Validate session tokens
- Handle expired sessions

### **3. Data Protection**
- Don't store sensitive data in URLs
- Use secure storage for tokens
- Encrypt sensitive parameters

## 📞 Support

### **Resources**
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

### **Debugging Tools**
- [Expo Diagnostics](https://docs.expo.dev/cli/diagnostics/)
- [URI Scheme Tester](https://github.com/expo/uri-scheme)
- [Deep Link Validator](https://search.developer.apple.com/appsearch-validation-tool/)

---

**⚠️ Important**: Always test deep links thoroughly before deploying to production. Monitor user feedback and be prepared to handle edge cases. 