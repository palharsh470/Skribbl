import React, { useRef, useEffect, useState, useCallback } from "react";
import "../components/Canvas.css"
const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
  "#84cc16", "#f59e0b", "#6366f1", "#14b8a6", "#f43f5e",
  "#a3e635",
];

const BRUSH_SIZES = [2, 5, 10, 20, 35];

export default function Canvas({ socket, roomId, isDrawing, myVote, phase }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawLine = useCallback((ctx, from, to, drawColor, size) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }, []);

  const handleMouseDown = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPosRef.current = pos;

    // Draw a dot
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (isEraser ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? "#ffffff" : color;
    ctx.fill();

    socket?.emit("draw", {
      roomId,
      data: { type: "dot", x: pos.x, y: pos.y, color: isEraser ? "#ffffff" : color, size: isEraser ? brushSize * 2 : brushSize },
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e, canvasRef.current);
    const ctx = canvasRef.current.getContext("2d");
    const activeColor = isEraser ? "#ffffff" : color;
    const activeSize = isEraser ? brushSize * 2 : brushSize;

    drawLine(ctx, lastPosRef.current, pos, activeColor, activeSize);

    socket?.emit("draw", {
      roomId,
      data: { type: "line", from: lastPosRef.current, to: pos, color: activeColor, size: activeSize },
    });

    lastPosRef.current = pos;
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket?.emit("clear-canvas", { roomId });
  };

  // Listen to remote draw events
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (data) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (data.type === "dot") {
        ctx.beginPath();
        ctx.arc(data.x, data.y, data.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = data.color;
        ctx.fill();
      } else {
        drawLine(ctx, data.from, data.to, data.color, data.size);
      }
    };

    const handleClear = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleHistory = (history) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      history.forEach((data) => {
        if (data.type === "dot") {
          ctx.beginPath();
          ctx.arc(data.x, data.y, data.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = data.color;
          ctx.fill();
        } else {
          drawLine(ctx, data.from, data.to, data.color, data.size);
        }
      });
    };

    socket.on("draw", handleDraw);
    socket.on("clear-canvas", handleClear);
    socket.on("drawing-history", handleHistory);

    return () => {
      socket.off("draw", handleDraw);
      socket.off("clear-canvas", handleClear);
      socket.off("drawing-history", handleHistory);
    };
  }, [socket, drawLine]);

  // Init white canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{
            cursor: isDrawing ? (isEraser ? "cell" : "crosshair") : "not-allowed",
            opacity: isDrawing ? 1 : 0.95,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        {!isDrawing && (
          <div className="canvas-overlay">
            <span>👀 Watch the artist draw!</span>
          </div>
        )}
      </div>

      {isDrawing && (
        <div className="toolbar">
          <div className="colors">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-btn ${color === c && !isEraser ? "active" : ""}`}
                style={{ background: c, border: c === "#ffffff" ? "2px solid #ccc" : "none" }}
                onClick={() => { setColor(c); setIsEraser(false); }}
              />
            ))}
          </div>
          <div className="tools">
            <div className="brush-sizes">
              {BRUSH_SIZES.map((s) => (
                <button
                  key={s}
                  className={`size-btn ${brushSize === s ? "active" : ""}`}
                  onClick={() => setBrushSize(s)}
                >
                  <div className="size-preview" style={{ width: Math.min(s * 1.5, 30), height: Math.min(s * 1.5, 30), borderRadius: "50%", background: "#333" }} />
                </button>
              ))}
            </div>
            <button
              className={`eraser-btn ${isEraser ? "active" : ""}`}
              onClick={() => setIsEraser(!isEraser)}
            >
              🧹 Eraser
            </button>
            <button className="clear-btn" onClick={handleClear}>
              🗑️ Clear
            </button>
          </div>
        </div>
      )}

      {!isDrawing && phase === "drawing" && (
        <div className="voting-toolbar">
          <span className="vote-label">Is the drawing understandable?</span>
          <div className="vote-buttons">
            <button
              className={`vote-btn like ${myVote === "like" ? "active" : ""}`}
              onClick={() => socket?.emit("vote-drawing", { roomId, vote: myVote === "like" ? null : "like" })}
            >
              👍 Like (+100)
            </button>
            <button
              className={`vote-btn dislike ${myVote === "dislike" ? "active" : ""}`}
              onClick={() => socket?.emit("vote-drawing", { roomId, vote: myVote === "dislike" ? null : "dislike" })}
            >
              👎 Dislike (-50)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}