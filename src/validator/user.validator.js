import validator from "validator";
import passwordValidator from "password-validator";

/**
 * Creates a password validation schema
 * @returns {Object} Password validator schema
 */
const createPasswordSchema = () => {
  const schema = new passwordValidator();
  
  schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(1)                                // Must have at least 1 digit
    .has().symbols(1)                               // Must have at least 1 symbol
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Password123!', 'Passw0rd!', '12345678!Aa']); // Blacklist common passwords
    
  return schema;
};

/**
 * Sanitizes input data to prevent XSS attacks
 * @param {Object} data - Raw input data
 * @returns {Object} Sanitized data
 */
const sanitization = (data) => {
  const sanitizedData = {};
  
  // Common sanitization for all fields
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      // Special handling for password (only trim, no escape)
      if (key === 'password' || key === 'confirmPassword') {
        sanitizedData[key] = validator.trim(data[key]);
      } else {
        // For other string fields, escape and trim
        sanitizedData[key] = validator.escape(validator.trim(data[key]));
      }
    } else {
      // Non-string data passes through unchanged
      sanitizedData[key] = data[key];
    }
  });
  
  return sanitizedData;
};

/**
 * Validates form data
 * @param {Object} rawData - Raw form data
 * @param {Array} requiredFields - List of required fields
 * @param {Object} options - Validation options
 * @returns {Object} Object containing validation messages and sanitized data
 */
const validation = (rawData, requiredFields = [], options = {}) => {
  // Define default options
  const defaultOptions = {
    validatePassword: true,
    validateEmail: true,
    passwordMatchField: null, // For password confirmation check
    customValidators: {} // Custom validation functions
  };
  
  const settings = { ...defaultOptions, ...options };
  const messages = [];
  const sanitizedData = sanitization(rawData);
  
  // Check required fields
  if (requiredFields.length === 0) {
    // Default required fields if none specified
    requiredFields = ['email', 'password'];
    if (rawData.nama !== undefined) requiredFields.push('nama');
  }
  
  // Validate required fields
  requiredFields.forEach(field => {
    if (!sanitizedData[field] || validator.isEmpty(sanitizedData[field].toString())) {
      messages.push(`${field.charAt(0).toUpperCase() + field.slice(1)} harus diisi`);
    }
  });
  
  // Validate email if it exists and is not empty
  if (settings.validateEmail && 
      sanitizedData.email && 
      !validator.isEmpty(sanitizedData.email)) {
    if (!validator.isEmail(sanitizedData.email)) {
      messages.push("Email tidak valid");
    }
    
    // Optional domain validation
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      const domain = sanitizedData.email.split('@')[1];
      if (!options.allowedDomains.includes(domain)) {
        messages.push(`Email harus menggunakan domain: ${options.allowedDomains.join(', ')}`);
      }
    }
  }
  
  // Validate password if it exists and is not empty
  if (settings.validatePassword && 
      sanitizedData.password && 
      !validator.isEmpty(sanitizedData.password)) {
    
    const passwordSchema = createPasswordSchema();
    const passwordValidation = passwordSchema.validate(sanitizedData.password, { list: true });
    
    if (passwordValidation.length > 0) {
      messages.push(
        "Password harus terdiri dari 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol"
      );
    }
    
    // Check if password matches confirmation field
    if (settings.passwordMatchField && 
        sanitizedData[settings.passwordMatchField] && 
        sanitizedData.password !== sanitizedData[settings.passwordMatchField]) {
      messages.push("Password dan konfirmasi password tidak cocok");
    }
  }
  
  // Run custom validators
  Object.keys(settings.customValidators).forEach(field => {
    if (sanitizedData[field] !== undefined) {
      const validatorFn = settings.customValidators[field];
      const customValidation = validatorFn(sanitizedData[field], sanitizedData);
      
      if (customValidation !== true) {
        messages.push(customValidation);
      }
    }
  });
  
  return { 
    messages, 
    data: sanitizedData,
    isValid: messages.length === 0
  };
};

/**
 * Utility to create custom field validation rules
 * @param {Object} rules - Validation rules configuration
 * @returns {Function} Validation function
 */
const createFieldValidator = (rules) => {
  return (value, allData) => {
    if (rules.minLength && value.length < rules.minLength) {
      return `${rules.fieldName} harus minimal ${rules.minLength} karakter`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${rules.fieldName} tidak boleh lebih dari ${rules.maxLength} karakter`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || `${rules.fieldName} tidak valid`;
    }
    
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value, allData);
      if (customResult !== true) {
        return customResult;
      }
    }
    
    return true;
  };
};

export { validation, sanitization, createFieldValidator };
export default validation;