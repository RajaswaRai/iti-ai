import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload, UserCheck, CheckCircle2, FolderOpen, AlertCircle, MessageSquareQuote, Activity } from "lucide-react";
import { fetchWithAuth } from "../utils/api";
import Card, { CardHeader } from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Table, Thead, Th, Td, Tr } from "../components/Table";
import { getErrorMessage } from "../utils/error";

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

interface FeedbackItem {
  id: string;
  message_id: string;
  rating: number;
  user_message: string | null;
  comment: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  details: string | null;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const navigate = useNavigate();
  const userRole = localStorage.getItem("admin_role");
  const adminName = localStorage.getItem("admin_name");

  const fetchDocs = async () => {
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/knowledge`);
      const result = await res.json();
      if (result.success) setDocs(result.data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const fetchPendingUsers = async () => {
    if (userRole !== "SUPER_ADMIN") return;
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/users/pending`);
      const result = await res.json();
      if (result.success) setPendingUsers(result.data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/feedback`);
      const result = await res.json();
      if (result.success) setFeedbacks(result.data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    if (userRole !== "SUPER_ADMIN") return;
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/audit`);
      const result = await res.json();
      if (result.success) setAuditLogs(result.data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchPendingUsers();
    fetchFeedbacks();
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${SERVER_URL}/auth/logout`, { method: "POST" });
    } catch (err: unknown) {
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

      setNotice({ tone: "success", text: "Dokumen berhasil diunggah." });
      fetchDocs();
    } catch (err: unknown) {
      setNotice({ tone: "error", text: `Gagal upload: ${getErrorMessage(err)}` });
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
      setNotice({ tone: "success", text: `Dokumen ${filename} dihapus.` });
      fetchDocs();
    } catch (err: unknown) {
      setNotice({ tone: "error", text: `Gagal hapus: ${getErrorMessage(err)}` });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`${SERVER_URL}/admin/users/${userId}/approve`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Gagal menyetujui user");
      setNotice({ tone: "success", text: "Admin baru disetujui." });
      fetchPendingUsers();
    } catch (err: unknown) {
      setNotice({ tone: "error", text: getErrorMessage(err) });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar Refactored */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Admin Panel
            </p>
            <h1 className="text-lg font-bold text-neutral-900">
              Halo, {adminName || "Admin"}
            </h1>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="px-4!">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {notice && (
            <Alert tone={notice.tone}>
                <div className="flex items-center gap-2">
                    {notice.tone === 'error' && <AlertCircle className="h-4 w-4" />}
                    {notice.text}
                </div>
            </Alert>
        )}

        {userRole === "SUPER_ADMIN" && (
          <Card accent>
            <CardHeader
              title="Persetujuan Akses Admin"
              description="Tinjau pendaftar baru sebelum mereka bisa mengakses panel ini."
              action={<Badge tone="brand">{pendingUsers.length} menunggu</Badge>}
            />
            <div className="px-6 py-2">
              {pendingUsers.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-teal-500" />} text="Tidak ada pendaftar baru saat ini." />
              ) : (
                <Table>
                  <Thead>
                    <Th>Nama</Th>
                    <Th>Email</Th>
                    <Th>Aksi</Th>
                  </Thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td className="font-medium text-neutral-900">{user.name}</Td>
                        <Td className="text-neutral-500">{user.email}</Td>
                        <Td>
                          <Button
                            variant="primary"
                            className="px-3! py-1.5! text-xs!"
                            onClick={() => handleApprove(user.id)}
                          >
                            <UserCheck className="h-3 w-3 mr-1" /> Setujui
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        )}

        {/* Upload Card Refactored */}
        <Card>
          <CardHeader
            title="Upload Dokumen Baru"
            description="Format didukung: .txt, .pdf, .csv, .xlsx, .docx"
          />
          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
            <input
              type="file"
              id="fileInput"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".txt,.pdf,.csv,.xlsx,.docx"
              className="block w-full flex-1 cursor-pointer rounded-xl border border-dashed border-neutral-300
                bg-neutral-50 px-3 py-2 text-sm text-neutral-600
                file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-teal-50
                file:px-4 file:py-2 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
            />
            <Button onClick={handleUpload} disabled={!selectedFile} loading={isUploading} className="shrink-0">
              <Upload className="h-4 w-4" />
              {isUploading ? "Mengunggah..." : "Upload"}
            </Button>
          </div>
        </Card>

        {/* Knowledge Base Card Refactored */}
        <Card>
          <CardHeader 
            title="Dokumen Knowledge Base" 
            description={`${docs.length} dokumen tersimpan`} 
          />
          <div className="px-6 py-2">
            {docs.length === 0 ? (
              <EmptyState icon={<FolderOpen className="h-8 w-8 text-neutral-400" />} text="Belum ada dokumen. Unggah dokumen pertama di atas." />
            ) : (
              <Table>
                <Thead>
                  <Th>Nama File</Th>
                  <Th>Tanggal Upload</Th>
                  <Th>Aksi</Th>
                </Thead>
                <tbody>
                  {docs.map((doc) => (
                    <Tr key={doc.id}>
                      <Td className="font-medium text-neutral-900">{doc.filename}</Td>
                      <Td className="text-neutral-500">
                        {new Date(doc.created_at).toLocaleDateString("id-ID")}
                      </Td>
                      <Td>
                        <Button
                          variant="danger"
                          className="px-3! py-1.5! text-xs!"
                          onClick={() => handleDelete(doc.filename)}
                        >
                          Hapus
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardHeader 
            title="Ulasan & Feedback Pengguna" 
            description={`${feedbacks.length} feedback terkumpul`} 
          />
          <div className="px-6 py-2">
            {feedbacks.length === 0 ? (
              <EmptyState icon={<MessageSquareQuote className="h-8 w-8 text-neutral-400" />} text="Belum ada ulasan atau feedback dari pengguna." />
            ) : (
              <Table>
                <Thead>
                  <Th>Rating</Th>
                  <Th>Pesan Pengguna</Th>
                  <Th>Komentar</Th>
                  <Th>Waktu</Th>
                </Thead>
                <tbody>
                  {feedbacks.map((item) => (
                    <Tr key={item.id}>
                      <Td className="text-xl">
                        {item.rating === 1 ? '👍' : '👎'}
                      </Td>
                      <Td className="text-sm text-neutral-700 max-w-xs truncate" title={item.user_message || "-"}>
                        {item.user_message || "-"}
                      </Td>
                      <Td className="text-sm text-neutral-600 max-w-xs truncate" title={item.comment || "-"}>
                        {item.comment || "-"}
                      </Td>
                      <Td className="text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>

        {/* Audit Log Section for Super Admin */}
        {userRole === "SUPER_ADMIN" && (
          <Card>
            <CardHeader 
              title="Audit Log Sistem" 
              description="Aktivitas dan perubahan penting dalam sistem" 
            />
            <div className="px-6 py-2">
              {auditLogs.length === 0 ? (
                <EmptyState icon={<Activity className="h-8 w-8 text-neutral-400" />} text="Belum ada aktivitas yang dicatat." />
              ) : (
                <Table>
                  <Thead>
                    <Th>Waktu</Th>
                    <Th>Pengguna</Th>
                    <Th>Aktivitas</Th>
                    <Th>Sumber</Th>
                  </Thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <Tr key={log.id}>
                        <Td className="text-xs text-neutral-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}
                        </Td>
                        <Td className="text-sm font-medium text-neutral-900">
                          {log.user.name} <br/>
                          <span className="text-xs text-neutral-500 font-normal">{log.user.email}</span>
                        </Td>
                        <Td className="text-sm text-neutral-700">
                          {log.action}
                        </Td>
                        <Td className="text-sm text-neutral-600">
                          {log.resource || "-"}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}