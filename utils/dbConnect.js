import mongoose from "mongoose";
import "dotenv/config.js";

mongoose.set("strictQuery", false);

const MONGODB_URI = process.env.DB_CONNECTION;
if (!MONGODB_URI) throw new Error("❌ Missing DB_CONNECTION env var");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                bufferCommands: false,
                // serverSelectionTimeoutMS: 10000, // timeout 10 detik biar cepat gagal jika Mongo down
            })
            .then((mongoose) => {
                console.log("✅ MongoDB Connected");
                return mongoose;
            })
            .catch((err) => {
                console.error("❌ MongoDB connection error:", err.message);
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
