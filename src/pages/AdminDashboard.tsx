import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";

interface DocumentItem {
  id: string;
  filename: string;
  created_at: string;
}

interface PendingUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const navigate = useNavigate();
  const userRole = localStorage.getItem("admin_role");

  const fetchDocs = async () => {
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/knowledge`);
      const result = await res.json();
      if (result.success) setDocs(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingUsers = async () => {
    if (userRole !== "SUPER_ADMIN") return;
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/users/pending`);
      const result = await res.json();
      if (result.success) setPendingUsers(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchPendingUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${SERVER_URL}/auth/logout`, { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      navigate("/admin/login");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/knowledge/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setSelectedFile(null);
      const fileInput = document.getElementById("fileInput") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchDocs();
    } catch (err: any) {
      alert(`Gagal upload: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Hapus dokumen ${filename}?`)) return;
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/knowledge/${filename}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus file");
      fetchDocs();
    } catch (err: any) {
      alert(`Gagal hapus: ${err.message}`);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/users/${userId}/approve`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Gagal menyetujui user");
      fetchPendingUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h2>Dashboard Admin</h2>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {userRole === "SUPER_ADMIN" && (
        <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Persetujuan Akses Admin</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "0.5rem" }}>Nama</th>
                <th style={{ padding: "0.5rem" }}>Email</th>
                <th style={{ padding: "0.5rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "1rem" }}>Tidak ada pendaftar baru.</td>
                </tr>
              ) : (
                pendingUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "0.5rem" }}>{user.name}</td>
                    <td style={{ padding: "0.5rem" }}>{user.email}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button onClick={() => handleApprove(user.id)} style={{ color: "white", backgroundColor: "green", padding: "0.3rem 0.5rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Setujui
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>Upload Dokumen Baru</h3>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <input type="file" id="fileInput" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept=".txt,.pdf,.csv,.xlsx,.docx" />
          <button onClick={handleUpload} disabled={!selectedFile || isUploading} style={{ cursor: "pointer" }}>
            {isUploading ? "Mengunggah..." : "Upload"}
          </button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "0.5rem" }}>Nama File</th>
            <th style={{ padding: "0.5rem" }}>Tanggal Upload</th>
            <th style={{ padding: "0.5rem" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "1rem" }}>Tidak ada dokumen.</td>
            </tr>
          ) : (
            docs.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem" }}>{doc.filename}</td>
                <td style={{ padding: "0.5rem" }}>{new Date(doc.created_at).toLocaleDateString("id-ID")}</td>
                <td style={{ padding: "0.5rem" }}>
                  <button onClick={() => handleDelete(doc.filename)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}