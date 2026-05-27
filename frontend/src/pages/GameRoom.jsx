import { useState } from "react";
import WordDisplay from "../components/WordDisplay";
import Timer from "../components/Timer";
import "../pages/GameRoom.css"

export default function GameRoom({ socket, roomId, player, initialRoom, onLeave }) {

    const [currentWord, setCurrentWord] = useState(null);
    const [wordHint, setWordHint] = useState(null);
    const [phase, setPhase] = useState("waiting");
    const [isDrawing, setIsDrawing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [notification, setNotification] = useState(null);
    const [drawerInfo, setDrawerInfo] = useState(null);
    const [gameOver, setGameOver] = useState(null);
    const [room, setRoom] = useState(initialRoom || null);
    const [roundInfo, setRoundInfo] = useState(null);
    const [wordChoices, setWordChoices] = useState([]);
    const [wordLength, setWordLength] = useState(0);
    const [drawerInfo, setDrawerInfo] = useState(null);
    const [turnResult, setTurnResult] = useState(null);

    function startGame() {
        return;
    }

    return (
        <div className="game-room">
            <div className="game-header">
                <div className="header-left">
                    <span className="logo-sm">✏️ Scribble</span>
                    <span className="room-badge">#{roomId}</span>
                    {roundInfo && <span className="round-badge">Round {roundInfo.round}/{roundInfo.totalRounds}</span>}
                </div>
                <div className="header-center">
                    <WordDisplay
                        currentWord={currentWord}
                        wordHint={wordHint}
                        isDrawing={isDrawing}
                        phase={phase}
                    />
                </div>
                <div className="header-right">
                    <Timer timeLeft={timeLeft} phase={phase} />
                    <button className="leave-btn" onClick={onLeave}>Leave</button>
                </div>
            </div>

            {notification && (
                <div className="notification">{notification}</div>
            )}

            {drawerInfo && phase === "drawing" && (
                <div className="drawer-banner">
                    {isDrawing
                        ? "🖌️ You are drawing!"
                        : `👀 ${drawerInfo.name} is drawing…`}
                </div>
            )}


            {phase === "game-over" && gameOver && (
                <div className="overlay">
                    <div className="overlay-card">
                        <div className="overlay-emoji">🏆</div>
                        <h2>Game Over!</h2>
                        <p className="winner-text">
                            {gameOver.winner?.id === player.id
                                ? "🎉 You won!"
                                : `${gameOver.winner?.name} wins with ${gameOver.winner?.score} points!`}
                        </p>
                        <div className="final-scores">
                            {[...(room?.players || [])].sort((a, b) => b.score - a.score).map((p, i) => (
                                <div key={p.id} className="final-row">
                                    <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                                    <span>{p.avatar} {p.name}</span>
                                    <span>{p.score} pts</span>
                                </div>
                            ))}
                        </div>
                        <button className="lobby-btn" onClick={onLeave}>Back to Lobby</button>
                    </div>
                </div>
            )}

            {phase === "turn-end" && turnResult && (
                <div className="turn-banner">
                    <span>The word was </span>
                    <strong>{turnResult.toUpperCase()}</strong>
                    <span> · Next turn starting soon…</span>
                </div>
            )}

            <div className="center-panel">
                {phase === "waiting" ? (
                    <div className="waiting-room">
                        <div className="waiting-icon">🎮</div>
                        <h2>Waiting for players…</h2>
                        <p className="room-code-display">
                            Room Code: <strong>{roomId}</strong>
                        </p>
                        <p className="player-count">{room.players.length} player{room.players.length !== 1 ? "s" : ""} in room</p>
                        <div className="player-list">
                            {room.players.map((p) => (
                                <div key={p.id} className="player-chip">
                                    <span>{p.avatar}</span>
                                    <span>{p.name}</span>
                                    {p.id === player.id && <span className="you-badge">You</span>}
                                </div>
                            ))}
                        </div>
                        {room.players[0]?.id === player.id && (
                            <button
                                className="start-btn"
                                onClick={startGame}
                                disabled={room.players.length < 2}
                            >
                                {room.players.length < 2 ? "Need 2+ players" : "🚀 Start Game"}
                            </button>
                        )}
                        {room.players[0]?.id !== player.id && (
                            <p className="host-notice">Waiting for {room.players[0]?.name} to start…</p>
                        )}
                    </div>
                ) : phase === "selecting" ? (
                    <div className="selecting-room">
                        {isDrawing ? (
                            <div className="word-select-card">
                                <h2>Choose a Word to Draw</h2>
                                <div className="word-choices">
                                    {wordChoices.map((word) => (
                                        <button
                                            key={word}
                                            className="word-choice-btn"
                                            onClick={() => socket?.emit("select-word", { roomId, word })}
                                        >
                                            {word.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <p className="selection-timer">Time remaining: <strong>{timeLeft}s</strong></p>
                            </div>
                        ) : (
                            <div className="word-wait-card">
                                <div className="wait-spinner" />
                                <h2>{drawerInfo?.name || "The artist"} is choosing a word…</h2>
                                <p className="selection-timer">Time remaining: <strong>{timeLeft}s</strong></p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Canvas</div>
                )}
            </div>
        </div>


    )
}