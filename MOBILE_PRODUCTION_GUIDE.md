# 📱 Mobile App Production Deployment Guide

## ⚠️ **Critical Issues Fixed**

### **1. React Native Compatibility Issues**
- ✅ **Fixed `AbortSignal.timeout`** - Replaced with `AbortController` for React Native compatibility
- ✅ **Updated Expo version** - From 53.0.19 to 53.0.20 to resolve compatibility warnings

### **2. Missing Production Configuration**
- ✅ **Created `eas.json`** - EAS build configuration for production builds
- ✅ **Updated `app.json`** - Production-ready app configuration

## 🚀 **Production Deployment Steps**

### **1. Environment Variables Setup**

Create `.env` file in `apps/app/`:
```bash
# Production API URL
EXPO_PUBLIC_API_URL=https://api.theroyalbarber.com

# Stripe Production Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key

# App Configuration
EXPO_PUBLIC_APP_NAME=The Royal Barber
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags (Production)
EXPO_PUBLIC_ENABLE_SMS_AUTH=true
EXPO_PUBLIC_ENABLE_PAYMENTS=true
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_DEBUG_MODE=false
```

### **2. Update App Configuration**

#### **Update `app.json` for Production:**
```json
{
  "expo": {
    "name": "The Royal Barber",
    "slug": "the-royal-barber",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "app",
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-actual-project-id"
      },
      "privacyPolicyUrl": "https://theroyalbarber.com/privacy",
      "termsOfServiceUrl": "https://theroyalbarber.com/terms"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.theroyalbarber.app",
      "buildNumber": "1",
      "associatedDomains": [
        "applinks:theroyalbarber.com"
      ]
    },
    "android": {
      "package": "com.theroyalbarber.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### **3. EAS Build Configuration**

#### **Update `eas.json` with your actual values:**
```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "distribution": "store"
      },
      "android": {
        "buildType": "app-bundle",
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### **4. Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### **5. Login to Expo**
```bash
eas login
```

### **6. Configure EAS Project**
```bash
cd apps/app
eas build:configure
```

### **7. Build for Production**

#### **iOS Production Build:**
```bash
eas build --platform ios --profile production
```

#### **Android Production Build:**
```bash
eas build --platform android --profile production
```

#### **Both Platforms:**
```bash
eas build --platform all --profile production
```

### **8. Submit to App Stores**

#### **iOS App Store:**
```bash
eas submit --platform ios --profile production
```

#### **Google Play Store:**
```bash
eas submit --platform android --profile production
```

## 🔧 **Pre-Build Checklist**

### **1. App Store Requirements**
- [ ] App icon (1024x1024)
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL

### **2. Android Requirements**
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for different device types
- [ ] Content rating questionnaire
- [ ] App signing key

### **3. Deep Link Testing**
```bash
# Test deep links locally
expo start --tunnel

# Test payment callbacks
# app://payment/success
# app://payment/failed
```

### **4. API Integration Testing**
- [ ] Authentication flow works
- [ ] Payment processing works
- [ ] SMS verification works
- [ ] Appointment booking works
- [ ] Push notifications work

## 🛡️ **Security Checklist**

### **Mobile App Security**
- [ ] No sensitive data in client-side code
- [ ] API keys are properly configured
- [ ] Deep links are secure
- [ ] Secure storage is used for tokens
- [ ] Debug mode is disabled in production

### **Payment Security**
- [ ] Stripe keys are production keys
- [ ] Payment callbacks are properly handled
- [ ] SSL is enforced for all API calls
- [ ] Payment data is not stored locally

## 📊 **Testing Strategy**

### **1. Local Testing**
```bash
# Test on iOS Simulator
expo start --ios

# Test on Android Emulator
expo start --android

# Test on physical device
expo start --tunnel
```

### **2. Internal Testing**
```bash
# Build internal test version
eas build --profile preview

# Distribute to testers
eas submit --profile preview
```

### **3. Production Testing**
```bash
# Build production version
eas build --profile production

# Test on TestFlight (iOS)
# Test on Internal Testing (Android)
```

## 🚨 **Common Issues & Solutions**

### **1. Build Failures**
```bash
# Clear cache and rebuild
expo start --clear
eas build --clear-cache

# Check for dependency conflicts
npm ls
```

### **2. Deep Link Issues**
```bash
# Test deep link configuration
expo diagnostics

# Verify app scheme
expo start --tunnel
```

### **3. API Connection Issues**
```bash
# Test API connectivity
curl https://api.theroyalbarber.com/health

# Check environment variables
echo $EXPO_PUBLIC_API_URL
```

### **4. Payment Issues**
```bash
# Test Stripe integration
# Verify webhook endpoints
# Check payment callback URLs
```

## 📱 **App Store Guidelines**

### **iOS App Store**
- [ ] Follow Apple's Human Interface Guidelines
- [ ] Include proper app metadata
- [ ] Test on multiple iOS versions
- [ ] Ensure accessibility compliance

### **Google Play Store**
- [ ] Follow Material Design guidelines
- [ ] Include proper app metadata
- [ ] Test on multiple Android versions
- [ ] Ensure accessibility compliance

## 🔄 **Update Process**

### **1. Version Management**
```bash
# Update version in app.json
# Update build numbers
# Update changelog
```

### **2. Build and Submit**
```bash
# Build new version
eas build --profile production

# Submit to stores
eas submit --profile production
```

### **3. Rollback Plan**
- Keep previous version as backup
- Monitor crash reports
- Have rollback strategy ready

## 📞 **Support Resources**

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Documentation**: [docs.expo.dev/eas](https://docs.expo.dev/eas)
- **React Native Documentation**: [reactnative.dev](https://reactnative.dev)
- **Apple Developer**: [developer.apple.com](https://developer.apple.com)
- **Google Play Console**: [play.google.com/console](https://play.google.com/console)

---

**⚠️ IMPORTANT**: Always test thoroughly in staging environment before deploying to production. Monitor app performance and user feedback after deployment. 