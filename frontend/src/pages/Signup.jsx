import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form);
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
        <h1>Create account</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Username
          <input name="username" value={form.username} onChange={onChange} required autoFocus />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={onChange} required />
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} required />
        </label>
        <button disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
