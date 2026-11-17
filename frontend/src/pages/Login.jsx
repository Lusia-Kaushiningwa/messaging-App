import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form onSubmit={onSubmit} className="card">
        <h1>Chatterbox</h1>
        <p className="muted">Log in to continue</p>
        {error && <p className="error">{error}</p>}
        <label>
          Username or email
          <input name="username" value={form.username} onChange={onChange} required autoFocus />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={onChange} required />
        </label>
        <button disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="muted">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
