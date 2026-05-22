import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "./AdminLogin.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // State untuk berpindah antara mode Login dan mode Lupa Password
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  
  const navigate = useNavigate();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal login");

      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("admin_role", data.data.role);
      localStorage.setItem("admin_name", data.data.name);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Masukkan email Anda terlebih dahulu.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${SERVER_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim permintaan.");

      setSuccessMsg(data.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${SERVER_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal login via Google");

      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("admin_role", data.data.role);
      localStorage.setItem("admin_name", data.data.name);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">🛡️</div>
            <h2>{isForgotPasswordMode ? "Lupa Kata Sandi" : "Admin Panel ITI"}</h2>
            <p>{isForgotPasswordMode ? "Masukkan email untuk reset sandi" : "Sistem Manajemen Knowledge AI"}</p>
          </div>

          {errorMsg && <div className="login-error" style={{ color: "red" }}>{errorMsg}</div>}
          {successMsg && <div className="login-error" style={{ color: "green", borderColor: "green", background: "#f0fdf4" }}>{successMsg}</div>}

          {!isForgotPasswordMode ? (
            <>
              {/* FORM LOGIN */}
              <form onSubmit={handleManualLogin} className="login-form">
                <div className="input-group">
                  <label>Email Kampus</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                
                <div style={{ textAlign: "right", marginBottom: "1rem" }}>
                  <button type="button" onClick={() => setIsForgotPasswordMode(true)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.85rem" }}>
                    Lupa Password?
                  </button>
                </div>

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Masuk"}
                </button>
              </form>

              <div className="login-divider"><span>ATAU</span></div>

              <div className="google-btn-wrapper">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Login gagal.")} />
              </div>
            </>
          ) : (
            <>
              {/* FORM LUPA PASSWORD */}
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="input-group">
                  <label>Email Terdaftar</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                
                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? "Mengirim Email..." : "Kirim Tautan Reset"}
                </button>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setIsForgotPasswordMode(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem" }}>
                    Kembali ke Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default AdminLogin;