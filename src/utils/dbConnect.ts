import mongoose from 'mongoose';

let isConnected: boolean = false;

const connectToDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) throw new Error('MONGO_URI is not defined in environment variables');

    if (isConnected) {
        console.log('Already connected to the database');
        return;
    }

    try {
        const db = await mongoose.connect(mongoUri);

        isConnected = db.connections[0].readyState === 1;

        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error instanceof Error ? error.message : error);
        throw new Error('Failed to connect to database');
    }
};

export default connectToDB;
