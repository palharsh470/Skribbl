import express from "express";
import mongoose from "mongoose";
import http from "http"
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import router from "./routes/gameRoutes.js";
import { handleSocketConnection } from "./controllers/socketController.js";

const app = express();
dotenv.config();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://skribbl-4kga-m9p16aenj-harshs-projects-5c916aad.vercel.app",
  "https://skribbl-4kga.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use(express.json());


mongoose
    .connect(process.env.MONGO_URI , {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB not connected (running without DB):", err.message));


app.use("/api", router);

handleSocketConnection(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});

