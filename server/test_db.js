import mongoose from "mongoose";

const uri = "mongodb+srv://devhub-admin:V9Z0qM2Mt6VMHjsK@cluster1.lbbv0tr.mongodb.net/devhub?appName=Cluster1";

console.log("Attempting MongoDB connection...");

try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    console.log("✅ MongoDB connection successful!");
    console.log("Database:", mongoose.connection.name);

    await mongoose.disconnect();
    console.log("Connection closed.");

} catch (error) {
    console.log("❌ MongoDB connection failed!");
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    console.log("Error code:", error.code);
}