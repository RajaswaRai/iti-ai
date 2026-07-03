import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Ban, Loader2, XCircle, KeyRound } from "lucide-react"; // Ganti emoji pakai Lucide
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { getErrorMessage } from "../utils/error";

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

  // State untuk validasi token di awal
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Mengecek token ke backend saat halaman pertama kali dibuka
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
      } catch {
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
    } catch (err: unknown) { // FIX: unexpected any jadi unknown
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 1. KONDISI: Tidak ada token di URL sama sekali
  if (!token) {
    return (
      <AuthShell 
        icon={<Ban className="h-7 w-7 text-red-600" />} 
        title="Akses Ditolak" 
        subtitle="Tautan tidak valid atau token hilang."
      >
        <Button onClick={() => navigate("/admin/login")} className="w-full">
          Kembali ke Login
        </Button>
      </AuthShell>
    );
  }

  // 2. KONDISI: Sedang mengecek ke Backend
  if (isValidating) {
    return (
      <AuthShell 
        icon={<Loader2 className="h-7 w-7 text-teal-600 animate-spin" />} 
        title="Memeriksa Tautan..." 
        subtitle="Mohon tunggu sebentar"
      >
        <div className="flex justify-center py-2">
          {/* Ganti animasi spinner lama dengan icon Lucide */}
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      </AuthShell>
    );
  }

  // 3. KONDISI: Token sudah dipakai atau lebih dari 15 menit
  if (!isTokenValid) {
    return (
      <AuthShell
        icon={<XCircle className="h-7 w-7 text-red-600" />}
        title={<span className="text-red-600 font-bold">Tautan Kadaluarsa</span>}
        subtitle="Tautan reset kata sandi ini sudah tidak berlaku atau telah digunakan."
      >
        <Button onClick={() => navigate("/admin/login")} className="w-full mt-2">
          Kembali ke Login
        </Button>
      </AuthShell>
    );
  }

  // 4. KONDISI: Token Valid, tampilkan Form Asli
  return (
    <AuthShell 
      icon={<KeyRound className="h-7 w-7 text-teal-600" />} 
      title="Buat Sandi Baru" 
      subtitle="Silakan masukkan kata sandi baru Anda"
    >
      {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
      {successMsg && <Alert tone="success">{successMsg}</Alert>}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <Field
          label="Kata Sandi Baru"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          required
        />
        <Field
          label="Konfirmasi Kata Sandi"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi sandi baru"
          required
        />

        <Button type="submit" loading={isLoading} disabled={successMsg !== ""} className="w-full mt-2">
          {isLoading ? "Menyimpan..." : "Simpan Sandi Baru"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default AdminResetPassword;