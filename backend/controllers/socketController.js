const rooms= {};

export function handleSocketConnection(io){
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

    
});
}