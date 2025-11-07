import mongoose from "../utils/db.js";

const logInSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,           // Remove leading/trailing whitespace
    },
    email: {
      type: String,
      required: true,
      unique: true,         // Email must be unique
      trim: true,           // Remove leading/trailing whitespace
      lowercase: true,      // Always store in lowercase
    },
    password: {
      type: String,
      required: true,
      minlength: 6,         // Optional: minimum password length
    },
  },
  {
    timestamps: true,       // Automatically adds createdAt & updatedAt
    collection: "users",    // Explicit collection name
  }
);

// Create a User model based on the schema
const LogInCollection = mongoose.model("User", logInSchema);

export default LogInCollection;
