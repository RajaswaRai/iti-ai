const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Fix: Menggunakan const karena token tidak pernah diubah
  const token = localStorage.getItem("access_token");
  
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    try {
      const refreshRes = await fetch(`${SERVER_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include" 
      });

      if (!refreshRes.ok) throw new Error("Sesi habis");

      const data = await refreshRes.json();
      localStorage.setItem("access_token", data.data.access_token);
      
      headers.set("Authorization", `Bearer ${data.data.access_token}`);
      response = await fetch(url, { ...options, headers });
    } catch { 
      // Fix: Menghapus variabel 'error' yang tidak digunakan
      localStorage.clear();
      window.location.href = "/admin/login";
    }
  }

  return response;
};