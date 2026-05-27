import Lobby from "./pages/Lobby.jsx";
import { io } from "socket.io-client";
import "../src/App.css"
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import GameRoom from "./pages/GameRoom.jsx";

export default function App() {
    const [view, setView] = useState("game");
    const [gameInfo, setGameInfo] = useState(null);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);


    const handleJoin = ({ roomId, playerName, avatar }) => {
        socketRef.current?.disconnect();
        const s = io(window.location.origin, { transports: ["websocket"] });
        socketRef.current = s;
        setSocket(s);

        s.on("connect", () => {
            s.emit("join-room", { roomId, playerName, avatar });
        });

        s.on("joined", (payload) => {
            const player = payload?.player ?? payload;
            const room = payload?.room;
            setGameInfo({ roomId, player, room });
            setView("game");
        });


        s.on("error", (err) => {
            const message = err?.message ?? err ?? "Unknown error";
            alert("Error: " + message);
            s.disconnect();
            setSocket(null);
        });

        s.on("connect_error", (err) => {
            const message = err?.message ?? String(err);
            alert("Connection failed: " + message);
            s.disconnect();
            setSocket(null);
        });
    };

    useEffect(() => {
        return () => socketRef.current?.disconnect();
    }, []);

    const handleLeave = () => {
        socketRef.current?.disconnect();
        setSocket(null);
        setGameInfo(null);
        setView("lobby");
    };


    return (
        <div className="app">
            {view === "lobby" && <Lobby onJoin={handleJoin} />}
            {view === "game" && gameInfo && (
                <GameRoom
                    socket={socket}
                    roomId={gameInfo.roomId}
                    player={gameInfo.player}
                    initialRoom={gameInfo.room}
                    onLeave={handleLeave}
                />
            )}
        </div>
    )
}