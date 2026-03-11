import express from "express"
import authRoutes from './routes/authRoutes.js'
import 'dotenv/config'
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(cors())

app.get("/health", (req, res) => res.json({ status: "UP" }));
app.get("/status", (req, res) => res.send("OK"));


app.use('/auth',authRoutes);

app.listen(PORT,()=>{
    console.log(`Auth Server running on http://localhost:${PORT}`);
})