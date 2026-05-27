import React from "react";
import "../components/Timer.css"
export default function Timer({ timeLeft, phase }) {
  if (phase === "waiting" || phase === "lobby" || phase === "game-over") return null;
  
  const pct = (timeLeft / 60) * 100;
  const color = timeLeft > 30 ? "#22c55e" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="timer-wrap">
      <div
        className="timer-circle"
        style={{ "--pct": pct, "--color": color }}
      >
        <span className="timer-val" style={{ color }}>
          {timeLeft}
        </span>
      </div>
      <div className="timer-bar-outer">
        <div
          className="timer-bar-inner"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}