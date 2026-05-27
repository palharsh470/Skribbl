import { v4 as uuidv4 } from "uuid";
import {rooms} from "./socketController";

export function createRoom(req, res) {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = {
        roomId,
        players: [],
        status: "waiting",
        currentRound: 0,
        rounds: 5,
        currentWord: null,
        currentDrawer: null,
        drawingData: [],
        messages: [],
        timer: null,
        timeLeft: 60,
    };
    res.json({ roomId });
}