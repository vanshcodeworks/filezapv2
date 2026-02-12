import express from 'express';
import upload from "./routes/upload.route";
import download from "./routes/download.route";


const app = express();
const PORT = 3000
app.use(express.json());

app.use("/" , upload);
app.use("/d" , download)

app.listen(PORT , ()=>{
    console.log("localhost:3000")
})
