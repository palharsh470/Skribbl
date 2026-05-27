import React from "react";
import "../components/Scoreboard.css"
export default function Scoreboard({ players, currentDrawerId, votes }) {
  const sorted = [...(players || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard">
      <div className="score-header">🏆 Scores</div>
      {sorted.map((p, i) => (
        <div key={p.id} className={`score-row ${p.id === currentDrawerId ? "drawing" : ""} ${p.guessedCorrectly ? "guessed" : ""}`}>
          <span className="rank">
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
          </span>
          <span className="avatar">{p.avatar}</span>
          <span className="pname">{p.name}</span>
          <div className="badges">
            {p.id === currentDrawerId && <span className="badge draw">✏️</span>}
            {p.guessedCorrectly && <span className="badge correct">✅</span>}
            {votes?.[p.id] === "like" && <span className="badge like-badge">👍</span>}
            {votes?.[p.id] === "dislike" && <span className="badge dislike-badge">👎</span>}
          </div>
          <span className="pscore">{p.score}</span>
        </div>
      ))}
    </div>
  );
}