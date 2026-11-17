import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Avatar from "../components/Avatar.jsx";
import MessagePane, { chatTitle } from "../components/MessagePane.jsx";
import NewChatModal from "../components/NewChatModal.jsx";

const POLL_MS = 5000;

export default function Chat() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const loadChats = useCallback(async () => {
    try {
      setChats(await api("/chats"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadChats();
    const timer = setInterval(loadChats, POLL_MS);
    return () => clearInterval(timer);
  }, [loadChats]);

  const active = chats.find((c) => String(c.id) === chatId);

  function onCreated(chat) {
    setShowNew(false);
    loadChats();
    navigate(`/chats/${chat.id}`);
  }

  return (
    <div className={`layout ${chatId ? "has-chat" : ""}`}>
      <aside className="sidebar">
        <header className="sidebar-header">
          <Link to="/profile" className="me">
            <Avatar user={user} size={36} />
            <span>{user.displayName || user.username}</span>
          </Link>
          <button onClick={() => setShowNew(true)}>+ New</button>
        </header>
        {error && <p className="error pad">{error}</p>}
        <ul className="chat-list">
          {chats.length === 0 && <li className="muted pad">No chats yet. Click “New” to start one.</li>}
          {chats.map((c) => {
            const other = c.members.find((m) => m.id !== user.id);
            return (
              <li key={c.id}>
                <Link to={`/chats/${c.id}`} className={String(c.id) === chatId ? "chat-item active" : "chat-item"}>
                  {c.isGroup ? <span className="avatar group">👥</span> : <Avatar user={other} showStatus />}
                  <div className="chat-info">
                    <strong>{chatTitle(c, user)}</strong>
                    <small className="muted ellipsis">
                      {c.lastMessage
                        ? `${c.lastMessage.sender.id === user.id ? "You: " : ""}${c.lastMessage.content || "📷 Image"}`
                        : "No messages yet"}
                    </small>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="main">
        {active ? (
          <>
            <Link to="/" className="back">← Chats</Link>
            <MessagePane key={active.id} chat={active} onSent={loadChats} />
          </>
        ) : (
          <p className="muted center-note">Select a chat or start a new one.</p>
        )}
      </main>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} onCreated={onCreated} />}
    </div>
  );
}
