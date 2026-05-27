import { useState } from "react";
import { AVATARS } from "../const/Avatar"
import axios from "axios";
import "../pages/Lobby.css"
export default function Lobby({ onJoin }) {
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [avatar, setAvatar] = useState("🎨");
    const [mode, setMode] = useState("create");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function createRoom() {
        if (!name.trim()) { setError("Enter your name!"); return; }
        setLoading(true);
        setError("");
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL;
            console.log(API_URL)
            const res = await axios.post(`${API_URL}/api/rooms`, {}, { timeout: 5000 });
            
            onJoin({ roomId: res.data.roomId, playerName: name.trim(), avatar });
            console.log("Created")
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Failed to create room";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    function joinRoom() {
        if (!name.trim()) { setError("Enter your name!"); return; }
        if (!roomId.trim()) { setError("Enter a room code!"); return; }
        onJoin({ roomId: roomId.trim().toUpperCase(), playerName: name.trim(), avatar });

    }

    return (
        <div className="lobby">
            <div className="lobby-card">
                <div className="logo">
                    <span className="logo-icon">✏️</span>
                    <h1>Scribble</h1>
                    <p>Draw • Guess • Win</p>
                </div>

                <div className="avatar-row">
                    {AVATARS.map((a) => (
                        <button
                            key={a}
                            className={`avatar-opt ${avatar === a ? "selected" : ""}`}
                            onClick={() => setAvatar(a)}
                        >
                            {a}
                        </button>
                    ))}
                </div>

                <div className="name-input-wrap">
                    <input
                        className="lobby-input"
                        placeholder="Your nickname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={16}
                    />
                </div>

                <div className="mode-tabs">
                    <button className={`tab ${mode === "create" ? "active" : ""}`} onClick={() => setMode("create")}>
                        🏠 Create Room
                    </button>
                    <button className={`tab ${mode === "join" ? "active" : ""}`} onClick={() => setMode("join")}>
                        🚪 Join Room
                    </button>
                </div>

                {mode === "join" && (
                    <input
                        className="lobby-input room-code"
                        placeholder="Room code (e.g. ABC123)"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        maxLength={6}
                    />
                )}

                {error && <div className="error-msg">⚠️ {error}</div>}

                <button
                    className="lobby-btn"
                    onClick={mode === "create" ? createRoom : joinRoom}
                    disabled={loading}
                >
                    {loading ? "Creating…" : mode === "create" ? "🎲 Create Game" : "🚀 Join Game"}
                </button>

                <div className="lobby-footer">
                    <p>2–10 players · 5 rounds per game · 60s per turn</p>
                </div>
            </div>
        </div>
    )
}