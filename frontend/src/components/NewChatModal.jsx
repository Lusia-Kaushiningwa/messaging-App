import { useEffect, useState } from "react";
import { api, isOnline } from "../api.js";
import Avatar from "./Avatar.jsx";

// Modal for starting a direct message (pick 1 user) or a group chat (pick 2+ users).
export default function NewChatModal({ onClose, onCreated }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/users?search=${encodeURIComponent(search)}`).then(setUsers).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = (u) =>
    setSelected((s) => (s.some((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u]));

  async function create() {
    setError("");
    try {
      const chat = await api("/chats", {
        method: "POST",
        body: { userIds: selected.map((u) => u.id), name: groupName },
      });
      onCreated(chat);
    } catch (err) {
      setError(err.message);
    }
  }

  const isGroup = selected.length > 1;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2>New chat</h2>
        <p className="muted">Pick one person for a direct message, or several for a group.</p>
        {error && <p className="error">{error}</p>}
        <input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id}>
              <label className="row">
                <input
                  type="checkbox"
                  checked={selected.some((x) => x.id === u.id)}
                  onChange={() => toggle(u)}
                />
                <Avatar user={u} size={32} showStatus />
                <span>
                  {u.displayName || u.username}
                  <small className="muted"> @{u.username}</small>
                </span>
                {isOnline(u.lastSeen) && <small className="online-text">online</small>}
              </label>
            </li>
          ))}
          {users.length === 0 && <li className="muted">No users found</li>}
        </ul>
        {isGroup && (
          <input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={40} />
        )}
        <div className="row end">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" onClick={create} disabled={selected.length === 0 || (isGroup && !groupName.trim())}>
            {isGroup ? "Create group" : "Start chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
