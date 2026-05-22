import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // State untuk form asli
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State BARU untuk validasi token di awal
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // 🌟 EFEK BARU: Mengecek token ke backend saat halaman pertama kali dibuka
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch(`${SERVER_URL}/auth/reset-password/verify?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setIsTokenValid(true); // Token aman, izinkan ganti sandi
        } else {
          setIsTokenValid(false); // Token sudah mati
        }
      } catch (error) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Kata sandi tidak cocok!");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${SERVER_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengatur ulang kata sandi.");

      setSuccessMsg("Kata sandi berhasil diubah! Mengalihkan ke halaman login...");
      
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. KONDISI: Tidak ada token di URL sama sekali
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          <h2>Akses Ditolak</h2>
          <p>Tautan tidak valid atau token hilang.</p>
          <button onClick={() => navigate("/admin/login")} className="login-btn" style={{ marginTop: "1rem" }}>Kembali ke Login</button>
        </div>
      </div>
    );
  }

  // 2. KONDISI: Sedang mengecek ke Backend
  if (isValidating) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="login-header">
            <h2>Memeriksa Tautan...</h2>
            <p>Mohon tunggu sebentar ⏳</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. KONDISI: Token sudah dipakai atau lebih dari 15 menit
  if (!isTokenValid) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="login-header">
            <h2 style={{ color: "red" }}>Tautan Kadaluarsa ❌</h2>
            <p>Tautan reset kata sandi ini sudah tidak berlaku atau telah digunakan.</p>
          </div>
          <button onClick={() => navigate("/admin/login")} className="login-btn" style={{ marginTop: "1rem" }}>
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // 4. KONDISI: Token Valid, tampilkan Form Asli
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h2>Buat Sandi Baru</h2>
          <p>Silakan masukkan kata sandi baru Anda</p>
        </div>

        {errorMsg && <div className="login-error" style={{ color: "red" }}>{errorMsg}</div>}
        {successMsg && <div className="login-error" style={{ color: "green", borderColor: "green", background: "#f0fdf4" }}>{successMsg}</div>}

        <form onSubmit={handleResetPassword} className="login-form">
          <div className="input-group">
            <label>Kata Sandi Baru</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Minimal 8 karakter"
              required 
            />
          </div>
          <div className="input-group">
            <label>Konfirmasi Kata Sandi</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Ulangi sandi baru"
              required 
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading || successMsg !== ""}>
            {isLoading ? "Menyimpan..." : "Simpan Sandi Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminResetPassword;