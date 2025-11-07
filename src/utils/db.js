import mongoose from "mongoose";
import "dotenv/config";

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error("[ERROR] MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

let isConnected = false;

/**
 * Initializes MongoDB connection using mongoose.
 * Ensures only a single connection is created.
 *
 * @returns {Promise<mongoose>}
 */
const connectDB = async () => {
  if (isConnected) {
    console.log("[INFO] MongoDB already connected.");
    return mongoose;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log("[SUCCESS] MongoDB connected.");

    // Event listeners
    mongoose.connection.on("error", (err) =>
      console.error("[MongoDB Error]:", err)
    );

    mongoose.connection.on("disconnected", () =>
      console.warn("[WARN] MongoDB disconnected.")
    );

    return mongoose;
  } catch (error) {
    console.error("[ERROR] Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

export { connectDB };
export default mongoose;
