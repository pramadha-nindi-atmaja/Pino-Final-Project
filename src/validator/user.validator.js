import validator from "validator";
import passwordValidator from "password-validator";

/**
 * Build password validation schema
 * @returns {passwordValidator} Password schema instance
 */
const createPasswordSchema = () => {
  const schema = new passwordValidator();

  schema
    .is().min(8) // Minimum length 8
    .is().max(100) // Maximum length 100
    .has().uppercase() // At least one uppercase
    .has().lowercase() // At least one lowercase
    .has().digits(1) // Must contain at least 1 digit
    .has().symbols(1) // Must contain at least 1 symbol
    .has().not().spaces() // No spaces allowed
    .is().not().oneOf([
      "Password123!",
      "Passw0rd!",
      "12345678!Aa",
    ]); // Blacklist weak passwords

  return schema;
};

/**
 * Sanitizes input data to prevent XSS / injection attacks
 * @param {Object} data - Raw input object
 * @returns {Object} Sanitized object
 */
const sanitization = (data = {}) => {
  const sanitized = {};

  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") {
      // For passwords, only trim — no escape
      if (key === "password" || key === "confirmPassword") {
        sanitized[key] = validator.trim(data[key]);
      } else {
        sanitized[key] = validator.escape(validator.trim(data[key]));
      }
    } else {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

/**
 * Validate form data
 * @param {Object} rawData - Raw request body
 * @param {Array<string>} requiredFields - Fields that must be present
 * @param {Object} options - Extra validation settings
 * @returns {{ messages: string[], data: Object, isValid: boolean }}
 */
const validation = (rawData = {}, requiredFields = [], options = {}) => {
  const defaultOptions = {
    validatePassword: true,
    validateEmail: true,
    passwordMatchField: null,
    customValidators: {},
    allowedDomains: [],
  };

  const settings = { ...defaultOptions, ...options };
  const messages = [];
  const sanitizedData = sanitization(rawData);

  // Default required fields
  if (requiredFields.length === 0) {
    requiredFields = ["email", "password"];
    if (rawData.nama !== undefined) {
      requiredFields.push("nama");
    }
  }

  const formatField = (field) =>
    field.charAt(0).toUpperCase() + field.slice(1);

  // Required-field validation
  requiredFields.forEach((field) => {
    if (!sanitizedData[field] || validator.isEmpty(String(sanitizedData[field]))) {
      messages.push(`${formatField(field)} is required`);
    }
  });

  // Email validation
  if (
    settings.validateEmail &&
    sanitizedData.email &&
    !validator.isEmpty(sanitizedData.email)
  ) {
    if (!validator.isEmail(sanitizedData.email)) {
      messages.push("Invalid email format");
    }

    // Optional domain restriction
    if (settings.allowedDomains.length > 0) {
      const domain = sanitizedData.email.split("@")[1];
      if (!settings.allowedDomains.includes(domain)) {
        messages.push(
          `Email must use one of the following domains: ${settings.allowedDomains.join(
            ", "
          )}`
        );
      }
    }
  }

  // Password validation
  if (
    settings.validatePassword &&
    sanitizedData.password &&
    !validator.isEmpty(sanitizedData.password)
  ) {
    const schema = createPasswordSchema();
    const validationList = schema.validate(sanitizedData.password, { list: true });

    if (validationList.length > 0) {
      messages.push(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol"
      );
    }

    // Confirm password match
    if (
      settings.passwordMatchField &&
      sanitizedData[settings.passwordMatchField] &&
      sanitizedData.password !== sanitizedData[settings.passwordMatchField]
    ) {
      messages.push("Password confirmation does not match");
    }
  }

  // Custom validators
  Object.keys(settings.customValidators).forEach((field) => {
    if (sanitizedData[field] !== undefined) {
      const validatorFn = settings.customValidators[field];
      const result = validatorFn(sanitizedData[field], sanitizedData);

      if (result !== true) {
        messages.push(result);
      }
    }
  });

  return {
    messages,
    data: sanitizedData,
    isValid: messages.length === 0,
  };
};

/**
 * Helper to create a custom field validator
 * @param {Object} rules - Validation rules
 * @returns {Function} validation function
 */
const createFieldValidator = (rules) => {
  return (value, allData) => {
    if (rules.minLength && value.length < rules.minLength) {
      return `${rules.fieldName} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${rules.fieldName} cannot exceed ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || `${rules.fieldName} is invalid`;
    }

    if (rules.custom && typeof rules.custom === "function") {
      const customResult = rules.custom(value, allData);
      if (customResult !== true) {
        return customResult;
      }
    }

    return true;
  };
};

export {
  validation,
  sanitization,
  createPasswordSchema,
  createFieldValidator,
};

export default validation;
