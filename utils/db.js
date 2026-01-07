import mongoose from "mongoose";

const connectDB = async () => {
    const { MONGO_URI } = process.env;

    if (!MONGO_URI) {
        throw new Error(
            "Missing database connection string. Please set MONGO_URI in hiring/backend/.env."
        );
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("mongodb connected successfully");
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export default connectDB;