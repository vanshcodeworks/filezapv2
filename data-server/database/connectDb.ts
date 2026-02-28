import mongoose from "mongoose";
export const connectDb = async () => {
    try {
        let connectionInstance : any = await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to Db(mongodb) on host" , connectionInstance.connection.host);
    } catch (error : any)
    {
        console.error("db is not up" , error.message);
        process.exit(0)
    }
}