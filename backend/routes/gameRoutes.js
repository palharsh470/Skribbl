import express from "express"
import {createRoom, getRoom, getLeaderboard} from "../controllers/gameController.js"
const router = express.Router();


router.post("/rooms", createRoom);
router.get("/rooms/:roomId", getRoom);
router.get("/leaderboard", getLeaderboard);

export default router;