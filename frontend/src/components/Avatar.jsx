import { isOnline } from "../api.js";

// Shows the profile picture, or the first letter of the name if there isn't one.
export default function Avatar({ user, size = 40, showStatus = false }) {
  const name = user?.displayName || user?.username || "?";
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : name[0].toUpperCase()}
      {showStatus && isOnline(user?.lastSeen) && <i className="online-dot" title="Online" />}
    </span>
  );
}
