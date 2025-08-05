import bcrypt from "bcrypt";
import crypto from "crypto";

// Configuration
const SALT_ROUNDS = 10;
const PEPPER = process.env.PASSWORD_PEPPER || "default-secure-pepper-value";
const HASH_ALGORITHM = "sha256";

/**
 * Adds a pepper to password before hashing
 * @param {string} password - Plain text password
 * @returns {string} - Peppered password
 */
const addPepper = (password) => {
  return crypto
    .createHmac(HASH_ALGORITHM, PEPPER)
    .update(password)
    .digest("hex");
};

/**
 * Encrypts a password with bcrypt and additional pepper
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const encrypt = async (password) => {
  const pepperedPassword = addPepper(password);
  return await bcrypt.hash(pepperedPassword, SALT_ROUNDS);
};

/**
 * Synchronous version of password encryption
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
const encryptSync = (password) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.hashSync(pepperedPassword, SALT_ROUNDS);
};

/**
 * Compares a password with a hash
 * @param {string} password - Plain text password to check
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches
 */
const compare = async (password, hash) => {
  const pepperedPassword = addPepper(password);
  return await bcrypt.compare(pepperedPassword, hash);
};

/**
 * Synchronous version of password comparison
 * @param {string} password - Plain text password to check
 * @param {string} hash - Stored hash to compare against
 * @returns {boolean} - True if password matches
 */
const compareSync = (password, hash) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.compareSync(pepperedPassword, hash);
};

/**
 * Generates a secure random token
 * @param {number} length - Length of the token in bytes
 * @returns {string} - Hex encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export { 
  encrypt, 
  encryptSync, 
  compare, 
  compareSync, 
  generateToken,
  addPepper 
};