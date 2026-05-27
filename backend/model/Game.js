import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  players: [
    {
      id: String,
      name: String,
      score: { type: Number, default: 0 },
      avatar: String,
    },
  ],
  rounds: { type: Number, default: 5 },
  currentRound: { type: Number, default: 0 },
  status: { type: String, default: "waiting" }, 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Game", GameSchema);
