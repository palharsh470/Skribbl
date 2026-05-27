import React, { useEffect, useState, useCallback } from "react";
import WordDisplay from "../components/WordDisplay";
import Timer from "../components/Timer";
import "../pages/GameRoom.css"
import Scoreboard from "../components/Scoreboard";
import Canvas from "../components/Canvas";
import ChatBox from "../components/ChatBox";

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
    const [messages, setMessages] = useState([]);
    const [isGuessed, setIsGuessed] = useState(false)
    const [turnResult, setTurnResult] = useState(null);


    useEffect(() => {
        if (!socket) return

        socket.on("room-update", (r) => setRoom(r));
        socket.on("player-joined", ({ player: p, room: r }) => {
            setRoom(r);
            addMsg({ id: Date.now(), type: "system", text: `👋 ${p.name} joined!`, timestamp: Date.now() });
        });
        socket.on("player-left", ({ playerName, room: r }) => {
            setRoom(r);
            addMsg({ id: Date.now(), type: "system", text: `👋 ${playerName} left`, timestamp: Date.now() });
        });
        socket.on("turn-selecting", ({ drawer, round, totalRounds, room: r }) => {
            setRoom(r);
            setPhase("selecting");
            setDrawerInfo(drawer);
            setIsDrawing(drawer.id === player.id);
            setCurrentWord(null);
            setWordHint(null);
            setWordLength(0);
            setTimeLeft(15);
            setTurnResult(null);
            setRoundInfo({ round, totalRounds });
            showNotification(`Round ${round}/${totalRounds} — ${drawer.id === player.id ? "Choose a word to draw!" : `${drawer.name} is choosing a word...`}`);
        });

        socket.on("word-choices", ({ choices }) => {
            setWordChoices(choices);
        });

        socket.on("turn-start", ({ drawer, round, totalRounds, hint, wordLength: wl, room: r }) => {
            setRoom(r);
            setPhase("drawing");
            setDrawerInfo(drawer);
            const drawing = drawer.id === player.id;
            setIsDrawing(drawing);
            if (!drawing) {
                setCurrentWord(null);
            }
            setWordHint(hint);
            setWordLength(wl);
            setIsGuessed(false)
            setTimeLeft(60);
            setTurnResult(null);
            setRoundInfo({ round, totalRounds });
            setWordChoices([]);
            showNotification(`Round ${round}/${totalRounds} — ${drawer.id === player.id ? "Your turn to draw!" : `${drawer.name} is drawing!`}`);
        });

        socket.on("your-word", ({ word }) => {
            setCurrentWord(word);
        });

        socket.on("word-hint", ({ hint, wordLength: wl }) => {
            setWordHint(hint);
            setWordLength(wl);
        });

        socket.on("timer", ({ timeLeft: t }) => {
            setTimeLeft(t);
        });

        socket.on("correct-guess", ({ playerId, playerName, room: r }) => {
            setRoom(r);
            if (playerId === player.id) {
                setIsGuessed(true)
                showNotification("🎉 You guessed it! +Points!", 3000);
            }
        });

        socket.on("turn-end", ({ word, room: r }) => {
            setRoom(r);
            setPhase("turn-end");
            setTurnResult(word);
            setIsDrawing(false);
            showNotification(`The word was: ${word.toUpperCase()}`, 4000);
        });

        socket.on("game-over", ({ room: r, winner }) => {
            setRoom(r);
            setPhase("game-over");
            
            setGameOver({ winner });
        });

        socket.on("chat-message", addMsg);
        socket.on("error", ({ message }) => showNotification("⚠️ " + message));

        return () => {
            socket.off("room-update");
            socket.off("player-joined");
            socket.off("player-left");
            socket.off("turn-selecting");
            socket.off("word-choices");
            socket.off("turn-start");
            socket.off("your-word");
            socket.off("word-hint");
            socket.off("timer");
            socket.off("correct-guess");
            socket.off("close-guess");
            socket.off("turn-end");
            socket.off("game-over");
            socket.off("chat-message");
            socket.off("error");
        }

    }, [player, socket])

    const startGame = () => {
        socket?.emit("start-game", { roomId });
    };

    const addMsg = useCallback((msg) => {
        setMessages((prev) => [...prev.slice(-100), msg]);
    }, []);


    const showNotification = useCallback((text, duration = 3000) => {
        setNotification(text);
        setTimeout(() => setNotification(null), duration);
    }, []);

    if (!room) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Connecting to room…</p>
            </div>
        );
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

            <div className="game-body">
                <div className="left-panel">
                    <Scoreboard players={room.players} currentDrawerId={drawerInfo?.id} votes={room.votes} />
                </div>

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
                        <Canvas
                            socket={socket}
                            roomId={roomId}
                            isDrawing={isDrawing}
                            myVote={room?.votes?.[player.id] || null}
                            phase={phase}
                        />
                    )}
                </div>

                <div className="right-panel">
                    <ChatBox
                        socket={socket}
                        roomId={roomId}
                        playerId={player.id}
                        messages={messages}
                        isDrawing={isDrawing}
                        isGuessed={isGuessed}
                    />
                </div>
            </div>

        </div>
    )
}