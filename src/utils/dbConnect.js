import mongoose from "mongoose";

let isConnected = false;

const connectToDB = async () => {
    if (isConnected) {
        console.log("Already connected to the database");
        return;
    }

    try {
        // Attempt to connect to the database
        const db = await mongoose.connect(process.env.MONGO_URI);

        isConnected = db.connections[0].readyState === 1;

        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

export default connectToDB;