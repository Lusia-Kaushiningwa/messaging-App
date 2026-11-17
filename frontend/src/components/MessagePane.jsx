import { useEffect, useRef, useState } from "react";
import { api, isOnline } from "../api.js";
import { useAuth } from "../auth.jsx";
import Avatar from "./Avatar.jsx";

const POLL_MS = 3000;

export const chatTitle = (chat, me) => {
  if (chat.isGroup) return chat.name;
  const other = chat.members.find((m) => m.id !== me.id);
  return other ? other.displayName || other.username : "Unknown";
};

export default function MessagePane({ chat, onSent }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const lastIdRef = useRef(0);

  // Load messages, then poll for new ones (a REST API can't push updates).
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    lastIdRef.current = 0;

    async function load() {
      try {
        const fresh = await api(`/chats/${chat.id}/messages?after=${lastIdRef.current}`);
        if (cancelled || fresh.length === 0) return;
        lastIdRef.current = fresh[fresh.length - 1].id;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...fresh.filter((m) => !seen.has(m.id))];
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setSending(true);
    setError("");
    try {
      const form = new FormData();
      form.append("content", text);
      if (image) form.append("image", image);
      const msg = await api(`/chats/${chat.id}/messages`, { method: "POST", body: form });
      lastIdRef.current = Math.max(lastIdRef.current, msg.id);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setText("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      onSent?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const others = chat.members.filter((m) => m.id !== user.id);
  const subtitle = chat.isGroup
    ? `${chat.members.length} members`
    : isOnline(others[0]?.lastSeen)
    ? "online"
    : "offline";

  return (
    <section className="pane">
      <header className="pane-header">
        {!chat.isGroup && <Avatar user={others[0]} size={36} showStatus />}
        <div>
          <strong>{chatTitle(chat, user)}</strong>
          <small className={`muted ${subtitle === "online" ? "online-text" : ""}`}> {subtitle}</small>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && <p className="muted center-note">No messages yet. Say hi!</p>}
        {messages.map((m) => {
          const mine = m.sender.id === user.id;
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
              {!mine && chat.isGroup && <small className="sender">{m.sender.displayName || m.sender.username}</small>}
              {m.imageUrl && <img className="msg-img" src={m.imageUrl} alt="Shared" />}
              {m.content && <p>{m.content}</p>}
              <small className="time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </small>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="error pad">{error}</p>}
      {image && (
        <p className="pad muted">
          Attached: {image.name}{" "}
          <button type="button" className="link" onClick={() => { setImage(null); fileRef.current.value = ""; }}>
            remove
          </button>
        </p>
      )}
      <form className="composer" onSubmit={send}>
        <label className="attach" title="Attach image">
          📎
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files[0] || null)} />
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={2000} />
        <button disabled={sending}>{sending ? "…" : "Send"}</button>
      </form>
    </section>
  );
}
