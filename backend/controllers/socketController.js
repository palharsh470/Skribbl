import Game from "../model/Game.js";
import { v4 as uuidv4 } from "uuid";
export const rooms = {};
export const roomTimers = {};
const WORDS = [
  "apple", "banana", "cat", "dog", "elephant", "flower", "guitar", "house",
  "island", "jungle", "kite", "lemon", "mountain", "notebook", "ocean",
  "pizza", "queen", "rainbow", "star", "tree", "umbrella", "violin",
  "waterfall", "xylophone", "yacht", "zebra", "airplane", "bridge", "castle",
  "dragon", "eagle", "forest", "ghost", "hammer", "igloo", "jellyfish",
  "knight", "lighthouse", "mermaid", "ninja", "octopus", "penguin", "robot",
  "snowflake", "tornado", "unicorn", "volcano", "wizard", "cactus", "diamond",
  "fireworks", "galaxy", "hurricane", "iceberg", "lantern", "meteor", "noodle",
  "pumpkin", "rocket", "submarine", "trophy", "umbrella", "vampire", "walrus",
];
let ioInstance;

function endTurn(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }

  ioInstance.to(roomId).emit("turn-end", {
    word: room.currentWord,
    room,
  });

  const nextRound = room.currentRound + 1;


  setTimeout(async () => {
    const currentRoom = rooms[roomId];
    if (!currentRoom || currentRoom.status === "finished") return;

    if (nextRound > currentRoom.rounds * currentRoom.players.length) {

      currentRoom.status = "finished";
      const winner = [...currentRoom.players].sort((a, b) => b.score - a.score)[0];


      try {
        await Game.create({
          roomId,
          players: currentRoom.players,
          rounds: currentRoom.rounds,
          currentRound: currentRoom.currentRound,
          status: "finished",
        });
      } catch { }

      ioInstance.to(roomId).emit("game-over", { room: currentRoom, winner });
    } else {
      currentRoom.currentRound = nextRound;
      startTurn(roomId);
    }
  }, 4000);

}

function selectWord(roomId, word) {

const room = rooms[roomId];
  if (!room) return;


  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }

  room.status = "playing";
  room.currentWord = word;
  room.timeLeft = 60;

  ioInstance.to(room.currentDrawer).emit("your-word", { word });

  const hint = getWordHint(word);
  room.players.forEach((p) => {
    if (p.id !== room.currentDrawer) {
      ioInstance.to(p.id).emit("word-hint", { hint, wordLength: word.length });
    }
  });

  ioInstance.to(roomId).emit("turn-start", {
    drawer: { id: room.currentDrawer, name: room.players.find(p => p.id === room.currentDrawer)?.name },
    round: Math.ceil(room.currentRound / room.players.length),
    totalRounds: room.rounds,
    hint,
    wordLength: word.length,
    room,
  });

  roomTimers[roomId] = setInterval(() => {
    room.timeLeft--;
    ioInstance.to(roomId).emit("timer", { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      endTurn(roomId);
    }
  }, 1000);


}

function startTurn(roomId) {

  const room = rooms[roomId];
  if (!room) return;

  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }

  room.players.forEach((p) => (p.guessedCorrectly = false));
  room.drawingData = [];
  room.votes = {};
  ioInstance.to(roomId).emit("clear-canvas");

  const drawerIndex = (room.currentRound - 1) % room.players.length;
  const drawer = room.players[drawerIndex];
  room.currentDrawer = drawer.id;
  room.drawerStartScore = drawer.score;
  room.players.forEach((p) => (p.isDrawing = p.id === drawer.id));

  const choices = [];
  while (choices.length < 3) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (!choices.includes(w)) {
      choices.push(w);
    }
  }
  room.status = "selecting";
  room.timeLeft = 15;


  ioInstance.to(drawer.id).emit("word-choices", { choices });
  ioInstance.to(roomId).emit("turn-selecting", {
    drawer: { id: drawer.id, name: drawer.name },
    round: Math.ceil(room.currentRound / room.players.length),
    totalRounds: room.rounds,
    room,
  });

  roomTimers[roomId] = setInterval(() => {
    room.timeLeft--;
    ioInstance.to(roomId).emit("timer", { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      selectWord(roomId, choices[0]);
    }
  }, 1000);


}

function getWordHint(word) {
  const hintWordIndx = new Set();
  while (hintWordIndx.size !== 2) {
    hintWordIndx.add(Math.floor(Math.random() * word.length))
  }
  const indexes = [...hintWordIndx];
  return word.split("").map((char, i) => (i === indexes[0] || i === indexes[1] ? char : "_")).join(" ");
}

function recalculateDrawerScore(room) {
  const drawer = room.players.find((p) => p.id === room.currentDrawer);
  if (!drawer || room.drawerStartScore === undefined) return;

  let likesCount = 0;
  let dislikesCount = 0;
  if (room.votes) {
    for (const voterId in room.votes) {
      if (room.votes[voterId] === "like") likesCount++;
      else if (room.votes[voterId] === "dislike") dislikesCount++;
    }
  }

  const voteScore = likesCount * 100 + dislikesCount * -50;
  drawer.score = room.drawerStartScore + voteScore;
  if (drawer.score < 0) drawer.score = 0;
}


export function handleSocketConnection(io) {
  ioInstance = io;


  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    socket.on("join-room", ({ roomId, playerName, avatar }) => {
      if (!rooms[roomId]) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const room = rooms[roomId];
      if(room.players.length >= 10){
         socket.emit("error", { message: "Maximum limit reached" });
        return;
      }
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        avatar: avatar || "🎨",
        isDrawing: false,
        guessedCorrectly: false,
      };

      room.players.push(player);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerName = playerName;

      if (room.drawingData.length > 0) {
        socket.emit("drawing-history", room.drawingData);
      }

      io.to(roomId).emit("room-update", room);
      io.to(roomId).emit("player-joined", { player, room });
      socket.emit("joined", { player, room });

      console.log(`👤 ${playerName} joined room ${roomId}`);
    });

    socket.on("start-game", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.players.length < 2) {
        socket.emit("error", { message: "Need at least 2 players to start" });
        return;
      }

      room.status = "playing";
      room.currentRound = 1;
      startTurn(roomId);
    });

    socket.on("select-word", ({ roomId, word }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.currentDrawer !== socket.id) return;
      if (room.status !== "selecting") return;

      selectWord(roomId, word);
    });

    socket.on("vote-drawing", ({ roomId, vote }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.status !== "playing") return;
      if (room.currentDrawer === socket.id) return;

      if (!room.votes) room.votes = {};
      room.votes[socket.id] = vote;

      recalculateDrawerScore(room);

      io.to(roomId).emit("room-update", room);
    });

    socket.on("draw", ({ roomId, data }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.currentDrawer !== socket.id) return;

      room.drawingData.push(data);
      socket.to(roomId).emit("draw", data);
    });

    socket.on("clear-canvas", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.currentDrawer !== socket.id) return;

      room.drawingData = [];
      io.to(roomId).emit("clear-canvas");
    });

    socket.on("chat-message", ({ roomId, message }) => {
      const room = rooms[roomId];
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;

      if (
        room.currentWord &&
        room.status === "playing" &&
        socket.id !== room.currentDrawer &&
        !player.guessedCorrectly &&
        message.toLowerCase().trim() === room.currentWord.toLowerCase()
      ) {
        player.guessedCorrectly = true;
        const timeBonus = Math.floor(room.timeLeft / 10) * 50;
        player.score += ( timeBonus || 50 );

        const drawer = room.players.find((p) => p.id === room.currentDrawer);
        if (drawer) {
          drawer.score += 100;
          if (room.drawerStartScore !== undefined) {
            room.drawerStartScore += 100;
          }
        }

        io.to(roomId).emit("correct-guess", {
          playerId: socket.id,
          playerName: player.name,
          room,
        });

        io.to(roomId).emit("chat-message", {
          id: uuidv4(),
          type: "system",
          text: `🎉 ${player.name} guessed the word!`,
          timestamp: Date.now(),
        });


        const nonDrawers = room.players.filter((p) => p.id !== room.currentDrawer);
        if (nonDrawers.every((p) => p.guessedCorrectly)) {
          endTurn(roomId);
        }
      } else {
        io.to(roomId).emit("chat-message", {
          id: uuidv4(),
          type: "normal",
          sender: player.name,
          senderId: socket.id,
          text: message,
          timestamp: Date.now(),
        });
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return;

      const room = rooms[roomId];
      const wasDrawing = room.currentDrawer === socket.id;

      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.votes && room.votes[socket.id]) {
        delete room.votes[socket.id];
        recalculateDrawerScore(room);
      }

      io.to(roomId).emit("player-left", {
        playerId: socket.id,
        playerName: socket.playerName,
        room,
      });

      io.to(roomId).emit("chat-message", {
        id: uuidv4(),
        type: "system",
        text: `👋 ${socket.playerName} left the game`,
        timestamp: Date.now(),
      });

      if (room.players.length === 0) {
        if (roomTimers[roomId]) {
          clearInterval(roomTimers[roomId]);
          delete roomTimers[roomId];
        }
        delete rooms[roomId];
      } else if (room.players.length === 1 && (room.status === "playing" || room.status === "selecting")) {
        if (roomTimers[roomId]) {
          clearInterval(roomTimers[roomId]);
          delete roomTimers[roomId];
        }
        room.status = "finished";
        const winner = room.players[0];

        try {
          const game = new Game({
            roomId,
            players: room.players,
            rounds: room.rounds,
            currentRound: room.currentRound,
            status: "finished",
          });
          game.save().catch(() => { });
        } catch { }

        io.to(roomId).emit("game-over", { room, winner });
      } else if (wasDrawing && (room.status === "playing" || room.status === "selecting")) {
        endTurn(roomId);
      } else {
        io.to(roomId).emit("room-update", room);
      }


    });

  });
}