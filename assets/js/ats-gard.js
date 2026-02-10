import api from "./api.js";

export async function requireAuth() {
  try {
    const res = await api.get("/users/get-user-details", {
      withCredentials: true,
    });

    if (!res.data?.currentUser?.id) {
      throw new Error("Not authenticated");
    }
  } catch (err) {
    // تنظيف أي state
    localStorage.clear();
    sessionStorage.clear();

    // رجوع للـ Home
    window.location.replace("/index.html");
  }
}
