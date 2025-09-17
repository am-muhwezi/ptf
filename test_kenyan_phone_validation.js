// Test script for Kenyan phone number validation
// This is a temporary test file to verify the validation function works correctly

// Import the validation function (for testing purposes - simulating the function here)
const validateKenyanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      message: 'Phone number is required',
      normalizedPhone: ''
    };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for empty after cleaning
  if (!cleaned) {
    return {
      isValid: false,
      message: 'Phone number is required',
      normalizedPhone: ''
    };
  }

  let normalizedPhone = '';
  let isValid = false;

  // Handle different Kenyan phone number formats
  if (cleaned.startsWith('254')) {
    // International format: +254XXXXXXXXX (should be 12 digits total)
    if (cleaned.length === 12) {
      const localPart = cleaned.substring(3); // Remove '254'

      // Check if it's a valid Kenyan mobile number
      if (/^[71]\d{8}$/.test(localPart)) {
        // Mobile: 7XX XXX XXX (Safaricom, Airtel, Telkom)
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^[1]\d{8}$/.test(localPart)) {
        // Some mobile providers: 1XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^20\d{7}$/.test(localPart)) {
        // Nairobi landline: 20 XXX XXXX
        normalizedPhone = `+254 20 ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        isValid = true;
      } else if (/^[2-6]\d{7,8}$/.test(localPart)) {
        // Other area codes: XX XXX XXXX or XXX XXX XXX
        if (localPart.length === 8) {
          normalizedPhone = `+254 ${localPart.substring(0, 2)} ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        } else {
          normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        }
        isValid = true;
      }
    }
  } else if (cleaned.startsWith('0')) {
    // Local format: 0XXXXXXXXX
    if (cleaned.length === 10) {
      const localPart = cleaned.substring(1); // Remove leading '0'

      if (/^[71]\d{8}$/.test(localPart)) {
        // Mobile: 07XX XXX XXX or 01XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^[1]\d{8}$/.test(localPart)) {
        // Some mobile providers: 01XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      }
    } else if (cleaned.length === 9 && cleaned.startsWith('020')) {
      // Nairobi landline: 020 XXX XXXX
      const localPart = cleaned.substring(1); // Remove leading '0'
      normalizedPhone = `+254 20 ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
      isValid = true;
    } else if (cleaned.length >= 8 && cleaned.length <= 10) {
      // Other area codes: 0XX XXX XXXX
      const localPart = cleaned.substring(1); // Remove leading '0'
      if (/^[2-6]\d{6,8}$/.test(localPart)) {
        if (localPart.length === 8) {
          normalizedPhone = `+254 ${localPart.substring(0, 2)} ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        } else {
          normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        }
        isValid = true;
      }
    }
  } else if (cleaned.length === 9) {
    // Direct local format without leading 0: XXXXXXXXX
    if (/^[71]\d{8}$/.test(cleaned)) {
      // Mobile: 7XX XXX XXX
      normalizedPhone = `+254 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      isValid = true;
    } else if (/^[1]\d{8}$/.test(cleaned)) {
      // Some mobile providers: 1XX XXX XXX
      normalizedPhone = `+254 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      isValid = true;
    } else if (/^20\d{7}$/.test(cleaned)) {
      // Nairobi landline: 20 XXX XXXX
      normalizedPhone = `+254 20 ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
      isValid = true;
    }
  }

  if (!isValid) {
    return {
      isValid: false,
      message: 'Please enter a valid Kenyan phone number (e.g., 0722 123 456, +254 722 123 456, or 722123456)',
      normalizedPhone: ''
    };
  }

  return {
    isValid: true,
    message: '',
    normalizedPhone
  };
};

// Test cases
const testCases = [
  // Valid mobile numbers
  { input: '0722123456', expectedValid: true, description: 'Safaricom format with leading zero' },
  { input: '+254722123456', expectedValid: true, description: 'Safaricom international format' },
  { input: '254722123456', expectedValid: true, description: 'Safaricom international without plus' },
  { input: '722123456', expectedValid: true, description: 'Safaricom without leading zero' },
  { input: '0722 123 456', expectedValid: true, description: 'Safaricom with spaces' },
  { input: '+254 722 123 456', expectedValid: true, description: 'Safaricom international with spaces' },

  // Airtel numbers
  { input: '0750123456', expectedValid: true, description: 'Airtel format' },
  { input: '+254750123456', expectedValid: true, description: 'Airtel international format' },

  // Telkom
  { input: '0770123456', expectedValid: true, description: 'Telkom format' },

  // Landlines
  { input: '0202123456', expectedValid: true, description: 'Nairobi landline' },
  { input: '+254202123456', expectedValid: true, description: 'Nairobi landline international' },
  { input: '020 212 3456', expectedValid: true, description: 'Nairobi landline with spaces' },

  // Edge cases and other providers
  { input: '0110123456', expectedValid: true, description: 'Provider starting with 1' },

  // Invalid numbers
  { input: '', expectedValid: false, description: 'Empty string' },
  { input: '123', expectedValid: false, description: 'Too short' },
  { input: '0612123456', expectedValid: false, description: 'Invalid mobile prefix' },
  { input: '0822123456', expectedValid: false, description: 'Invalid mobile prefix' },
  { input: '25472212345', expectedValid: false, description: 'Wrong international format length' },
  { input: '+1234567890', expectedValid: false, description: 'Non-Kenyan number' },
  { input: 'abcd123456', expectedValid: false, description: 'Contains letters' },
  { input: '072212345', expectedValid: false, description: 'Too short mobile' },
  { input: '07221234567', expectedValid: false, description: 'Too long mobile' }
];

console.log('Testing Kenyan Phone Number Validation Function');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateKenyanPhone(testCase.input);
  const isCorrect = result.isValid === testCase.expectedValid;

  console.log(`\nTest ${index + 1}: ${testCase.description}`);
  console.log(`Input: "${testCase.input}"`);
  console.log(`Expected: ${testCase.expectedValid ? 'Valid' : 'Invalid'}`);
  console.log(`Result: ${result.isValid ? 'Valid' : 'Invalid'}`);

  if (result.isValid && result.normalizedPhone) {
    console.log(`Normalized: ${result.normalizedPhone}`);
  }

  if (!result.isValid && result.message) {
    console.log(`Error: ${result.message}`);
  }

  console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

  if (isCorrect) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('🎉 All tests passed! The validation function is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Please review the validation logic.');
}