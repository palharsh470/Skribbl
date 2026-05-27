import { useState } from "react";
import WordDisplay from "../components/WordDisplay";
import Timer from "../components/Timer";
import "../pages/GameRoom.css"

export default function GameRoom({onLeave}) {

    const [currentWord, setCurrentWord] = useState("null");
    const [wordHint, setWordHint] = useState("null");
    const [phase, setPhase] = useState("playing");
    const [isDrawing, setIsDrawing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    return (
        <div className="game-room">
            <div className="game-header">
                <div className="header-left">
                    <span className="logo-sm">✏️ Scribble</span>
                    <span className="room-badge">123456</span>
                    <span className="round-badge">Round 1</span>
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


        </div>
    )
}