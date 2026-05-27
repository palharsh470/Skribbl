import React from "react";
import "../components/WordDisplay.css"
export default function WordDisplay({ currentWord, wordHint, isDrawing, phase }) {
  if (phase === "waiting" || phase === "lobby") return null;

  return (
    <div className="word-display">
      {isDrawing && currentWord ? (
        <div className="your-word">
          <span className="word-label">Draw:</span>
          <span className="the-word">{currentWord.toUpperCase()}</span>
        </div>
      ) : wordHint ? (
        <div className="word-hint">
          <span className="word-label">Guess:</span>
          <div className="hint-letters">
            {wordHint.split(" ").map((char, i) => (
              <span key={i} className={`hint-char ${char !== "_" ? "revealed" : ""}`}>
                {char === "_" ? "" : char}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}