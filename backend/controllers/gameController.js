import { v4 as uuidv4 } from "uuid";
import {rooms} from "./socketController.js";
import Game from "../model/Game.js";


export function getRoom(req, res) {
  const room = rooms[req.params.roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
};

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

export async function getLeaderboard (req, res) {
  try {
    const games = await Game.find({ status: "finished" })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(games);
  } catch {
    res.json([]);
  }
};