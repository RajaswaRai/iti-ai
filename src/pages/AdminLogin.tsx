import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Button from "../components/Button";
import Alert from "../components/Alert";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memproses permintaan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Google login error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthShell
        icon={<ShieldCheck className="h-7 w-7 text-teal-600" />}
        title={isForgotPasswordMode ? "Lupa Kata Sandi" : "Admin Panel ITI"}
        subtitle={isForgotPasswordMode ? "Masukkan email untuk reset sandi" : "Sistem Manajemen Knowledge AI"}
      >
        {/* Menggunakan komponen Alert */}
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        {successMsg && <Alert tone="success">{successMsg}</Alert>}

        {!isForgotPasswordMode ? (
          <>
            <form onSubmit={handleManualLogin} className="space-y-4">
              <Field
                label="Email Kampus"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iti.ac.id"
                required
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Lupa Password?
                </button>
              </div>

              <Button type="submit" loading={isLoading} className="w-full">
                {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              <span className="h-px flex-1 bg-neutral-200" /> ATAU <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Login gagal.")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Field
              label="Email Terdaftar"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={isLoading} className="w-full">
              {isLoading ? "Mengirim Email..." : "Kirim Tautan Reset"}
            </Button>
            <button
              type="button"
              onClick={() => setIsForgotPasswordMode(false)}
              className="flex w-full items-center justify-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Login
            </button>
          </form>
        )}
      </AuthShell>
    </GoogleOAuthProvider>
  );
}