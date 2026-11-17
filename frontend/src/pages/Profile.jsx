import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Avatar from "../components/Avatar.jsx";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const form = new FormData();
      form.append("displayName", displayName);
      form.append("bio", bio);
      if (avatar) form.append("avatar", avatar);
      const updated = await api("/me", { method: "PATCH", body: form });
      setUser(updated);
      setAvatar(null);
      setStatus({ type: "ok", text: "Profile saved" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form onSubmit={onSubmit} className="card">
        <p><Link to="/">← Back to chats</Link></p>
        <h1>Your profile</h1>
        <div className="profile-head">
          <Avatar user={{ ...user, avatarUrl: avatar ? URL.createObjectURL(avatar) : user.avatarUrl }} size={72} />
          <div>
            <strong>@{user.username}</strong>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        {status.text && <p className={status.type === "error" ? "error" : "ok"}>{status.text}</p>}
        <label>
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} required />
        </label>
        <label>
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} />
        </label>
        <label>
          Profile picture
          <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0] || null)} />
        </label>
        <button disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        <button type="button" className="secondary" onClick={logout}>Log out</button>
      </form>
    </main>
  );
}
