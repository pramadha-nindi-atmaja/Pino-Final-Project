import bcrypt from "bcrypt";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/** Number of bcrypt salt rounds used for hashing */
export const SALT_ROUNDS = 10;

/** Extra secret (pepper) applied before hashing — must be kept private */
export const PEPPER = process.env.PASSWORD_PEPPER;

if (!PEPPER) {
  console.warn("[WARN] PASSWORD_PEPPER is not defined. Using weak fallback value!");
}

/** HMAC hashing algorithm used to apply pepper */
export const HASH_ALGORITHM = "sha256";

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

/**
 * Adds a pepper to the password using an HMAC hash.
 * This must run before bcrypt hashing.
 *
 * @param {string} password - Plain text password
 * @returns {string} - Peppered password digest
 */
const addPepper = (password) => {
  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  return crypto
    .createHmac(HASH_ALGORITHM, PEPPER || "fallback-pepper")
    .update(password)
    .digest("hex");
};

// -----------------------------------------------------------------------------
// Hashing
// -----------------------------------------------------------------------------

/**
 * Hashes a password using pepper + bcrypt (async)
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Bcrypt hash
 */
const encrypt = async (password) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.hash(pepperedPassword, SALT_ROUNDS);
};

/**
 * Hashes a password using pepper + bcrypt (sync)
 *
 * @param {string} password - Plain text password
 * @returns {string} - Bcrypt hash
 */
const encryptSync = (password) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.hashSync(pepperedPassword, SALT_ROUNDS);
};

// -----------------------------------------------------------------------------
// Comparison
// -----------------------------------------------------------------------------

/**
 * Compares a password with a stored hash (async)
 *
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} - True if match
 */
const compare = async (password, hash) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.compare(pepperedPassword, hash);
};

/**
 * Compares a password with a stored hash (sync)
 *
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored bcrypt hash
 * @returns {boolean} - True if match
 */
const compareSync = (password, hash) => {
  const pepperedPassword = addPepper(password);
  return bcrypt.compareSync(pepperedPassword, hash);
};

// -----------------------------------------------------------------------------
// Token Generation
// -----------------------------------------------------------------------------

/**
 * Generates a secure random token
 *
 * @param {number} length - Token byte length (default: 32)
 * @returns {string} - Hex encoded token
 */
const generateToken = (length = 32) => {
  const size = Number(length);

  if (Number.isNaN(size) || size <= 0) {
    throw new Error("Token length must be a positive number.");
  }

  return crypto.randomBytes(size).toString("hex");
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export {
  encrypt,
  encryptSync,
  compare,
  compareSync,
  generateToken,
  addPepper,
};
