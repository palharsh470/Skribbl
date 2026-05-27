import express from "express";
import mongoose from "mongoose";
import http from "http"
import cors from "cors";
import { Server } from "socket.io";
import router from "./routes/gameRoutes.js";
import { handleSocketConnection } from "./controllers/socketController.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());


app.use("/api", router)

handleSocketConnection(io)

const PORT = 5000
mongoose.connect("mongodb+srv://palharsh470_db_user:M2phT7ivkPxluuQY@cluster0.w8asagm.mongodb.net/Scribble")
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        })
    })
    .catch((err) => console.log("⚠️  MongoDB not connected (running without DB):", err.message));