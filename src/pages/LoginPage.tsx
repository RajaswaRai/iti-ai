import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Kita akan buat file CSS ini nanti

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal melakukan login.");
      }

      // Simpan Token dan Data User ke LocalStorage
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("user_name", data.data.name);
      localStorage.setItem("user_role", data.data.role);

      // Arahkan ke halaman Dashboard Admin
      navigate("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🛡️</div>
          <h2>Admin Panel ITI</h2>
          <p>Silakan login untuk mengelola Knowledge AI</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Kampus</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iti.ac.id"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Memverifikasi..." : "Login ke Dashboard"}
          </button>
        </form>
        
        <button 
          className="btn-back" 
          type="button" 
          onClick={() => navigate("/")}
        >
          ← Kembali ke Halaman Chat
        </button>
      </div>
    </div>
  );
}