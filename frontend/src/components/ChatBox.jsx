import React, { useState, useRef, useEffect } from "react";

import "../components/Chatbox.css"
export default function ChatBox({ socket, roomId, playerId, messages, isDrawing }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket?.emit("chat-message", { roomId, message: input.trim() });
    setInput("");
  };

  return (
    <div className="chatbox">
      <div className="chat-header">💬 Chat & Guesses</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg ${msg.type === "system" ? "system" : msg.type === "close" ? "close" : msg.senderId === playerId ? "mine" : "theirs"}`}
          >
            {msg.type === "normal" && (
              <>
                <span className="msg-sender">{msg.senderId === playerId ? "You" : msg.sender}</span>
                <span className="msg-text">{msg.text}</span>
              </>
            )}
            {msg.type === "close" && (
              <span className="msg-text">🔥 {msg.senderId === playerId ? "You're" : `${msg.sender} is`} so close!</span>
            )}
            {msg.type === "system" && <span>{msg.text}</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isDrawing ? "You're drawing!" : "Type your guess..."}
          disabled={isDrawing}
          maxLength={50}
          autoComplete="off"
        />
        <button type="submit" disabled={isDrawing || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}