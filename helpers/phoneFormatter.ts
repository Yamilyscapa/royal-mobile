/**
 * Phone number formatting utility for frontend
 * Ensures Twilio compatibility and provides real-time formatting
 */

export interface PhoneFormatResult {
  isValid: boolean;
  formatted: string;
  display: string;
  error?: string;
}

/**
 * Format phone number for display and validation
 * @param phone - Raw phone number input
 * @returns PhoneFormatResult with validation and formatting
 */
export function formatPhoneNumber(phone: string): PhoneFormatResult {
  try {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        formatted: '',
        display: '',
        error: 'Phone number is required'
      };
    }

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove all spaces, dashes, parentheses
    cleaned = cleaned.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with +, keep it
    if (cleaned.startsWith('+')) {
      // Remove the + temporarily for processing
      cleaned = cleaned.substring(1);
    } else {
      // If no country code, assume US (+1)
      cleaned = '1' + cleaned;
    }
    
    // Validate the cleaned number
    if (!/^\d{10,15}$/.test(cleaned)) {
      return {
        isValid: false,
        formatted: '+' + cleaned,
        display: phone,
        error: 'Phone number must be 10-15 digits (including country code)'
      };
    }
    
    // Add the + back for Twilio format
    const formatted = '+' + cleaned;
    
    // Create a display version with formatting
    let display = formatted;
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US format: +1 (234) 567-8900
      display = `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('57')) {
      // Colombia format: +57 300 123 4567
      display = `+57 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('52')) {
      // Mexico format: +52 55 1234 5678
      display = `+52 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}`;
    } else {
      // Generic format: +1234567890
      display = formatted;
    }
    
    return {
      isValid: true,
      formatted: formatted,
      display: display
    };
    
  } catch (error) {
    return {
      isValid: false,
      formatted: '',
      display: phone,
      error: 'Failed to format phone number'
    };
  }
}

/**
 * Format phone number as user types (for TextInput)
 * @param phone - Current phone number input
 * @returns Formatted display string
 */
export function formatPhoneAsTyping(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has more than 1 digit, format as US number
  if (cleaned.startsWith('1') && cleaned.length > 1) {
    const withoutCountry = cleaned.substring(1);
    if (withoutCountry.length <= 3) {
      return `+1 (${withoutCountry}`;
    } else if (withoutCountry.length <= 6) {
      return `+1 (${withoutCountry.substring(0, 3)}) ${withoutCountry.substring(3)}`;
    } else {
      return `+1 (${withoutCountry.substring(0, 3)}) ${withoutCountry.substring(3, 6)}-${withoutCountry.substring(6, 10)}`;
    }
  }
  
  // If it starts with 57 (Colombia)
  if (cleaned.startsWith('57') && cleaned.length > 2) {
    const withoutCountry = cleaned.substring(2);
    if (withoutCountry.length <= 3) {
      return `+57 ${withoutCountry}`;
    } else if (withoutCountry.length <= 6) {
      return `+57 ${withoutCountry.substring(0, 3)} ${withoutCountry.substring(3)}`;
    } else {
      return `+57 ${withoutCountry.substring(0, 3)} ${withoutCountry.substring(3, 6)} ${withoutCountry.substring(6, 10)}`;
    }
  }
  
  // If it starts with 52 (Mexico)
  if (cleaned.startsWith('52') && cleaned.length > 2) {
    const withoutCountry = cleaned.substring(2);
    if (withoutCountry.length <= 2) {
      return `+52 ${withoutCountry}`;
    } else if (withoutCountry.length <= 6) {
      return `+52 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2)}`;
    } else {
      return `+52 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2, 6)} ${withoutCountry.substring(6, 10)}`;
    }
  }
  
  // Default: just add + if not present
  if (!phone.startsWith('+')) {
    return '+' + phone;
  }
  
  return phone;
}

/**
 * Validate if a phone number is in correct format for Twilio
 * @param phone - Phone number to validate
 * @returns boolean indicating if valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  const result = formatPhoneNumber(phone);
  return result.isValid;
}

/**
 * Get the Twilio-compatible formatted phone number
 * @param phone - Raw phone number
 * @returns Formatted phone number for Twilio
 */
export function getTwilioFormattedPhone(phone: string): string {
  const result = formatPhoneNumber(phone);
  return result.formatted;
}

/**
 * Test function to validate phone number formatting
 */
export function testPhoneFormatting(): void {
  const testCases = [
    '+1234567890',
    '1234567890',
    '+1 (234) 567-8900',
    '+1 234 567 8900',
    '+44 20 7946 0958',
    '+57 300 123 4567',
    '+52 55 1234 5678',
    'invalid',
    '',
    '+123456789', // too short
    '+12345678901234567890' // too long
  ];
  
  console.log('Testing phone number formatting:');
  testCases.forEach(testCase => {
    const result = formatPhoneNumber(testCase);
    console.log(`${testCase} -> ${result.formatted} (valid: ${result.isValid}, display: ${result.display})`);
  });
} 