import { useState } from "react";
import { AVATARS } from "../const/Avatar"
import "../pages/Lobby.css"
export default function Lobby() {
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [avatar, setAvatar] = useState("🎨");
    const [mode, setMode] = useState("create");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function createRoom(){
        return;
    }

    function joinRoom(){
        return;
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
                    <p>2–8 players · 5 rounds per game · 80s per turn</p>
                </div>
            </div>
        </div>
    )
}