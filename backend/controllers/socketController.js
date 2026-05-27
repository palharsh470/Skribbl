const rooms = {};
const roomTimers = {};
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

      // Send current drawing to new player
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


  });
}