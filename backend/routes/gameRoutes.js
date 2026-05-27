import express from "express"
const router = express.Router();
const gameController = require("../controllers/gameController");

router.post("/rooms", gameController.createRoom);
router.get("/rooms/:roomId", gameController.getRoom);
router.get("/leaderboard", gameController.getLeaderboard);

export default router;