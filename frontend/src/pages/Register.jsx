/**
 * pages/Register.jsx — User registration form
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ username: "", email: "", password: "" });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-editor-bg bg-mesh-dark flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm p-8 space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Code2 size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-editor-text">Create account</h1>
            <p className="text-sm text-editor-muted mt-1">Start coding collaboratively</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-editor-muted block mb-1.5">Username</label>
            <input
              id="reg-username"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="johndoe"
              className="input-field"
              required
              minLength={2}
              maxLength={30}
            />
          </div>

          <div>
            <label className="text-xs text-editor-muted block mb-1.5">Email</label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs text-editor-muted block mb-1.5">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="input-field pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-editor-muted hover:text-editor-text"
                tabIndex={-1}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-editor-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-editor-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
