// api.js
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm";

// ✅ Toastify import (لو مش موجود في صفحة HTML لازم تكون ضايف سكريبت Toastify)
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify-es.js";

const API_BASE = "https://api.jobzai.net/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ✅ Helper: set/remove token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
    console.log("⚠️ Token removed from headers");
  }
};

// 🔹 Request interceptor
api.interceptors.request.use((config) => {
  return config;
});

// ==================== 🔐 TOKEN EXPIRATION HANDLER ====================

// ========== TOKEN EXPIRATION HANDLER (fixed for real 2 hours) ==========

function showToast(message, type = "info") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background:
        type === "success"
          ? "linear-gradient(to right, #00b09b, #96c93d)"
          : type === "error"
          ? "linear-gradient(to right, #e52d27, #b31217)"
          : type === "warning"
          ? "linear-gradient(to right, #f7971e, #ffd200)"
          : "linear-gradient(to right, #283c86, #45a247)",
      color: "#fff",
      fontSize: "14px",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  }).showToast();
}

// ✅ نحفظ وقت الانتهاء بعد ساعتين كاملة
export function saveAuthToken(token) {
  const expiryTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  localStorage.setItem("authToken", token);
  localStorage.setItem("tokenExpiry", expiryTime.toString());
  setAuthToken(token);
  console.log("⏱️ Session valid until:", new Date(expiryTime).toLocaleTimeString());
}

// ✅ نتحقق إن الوقت فعلاً خلص
export function isTokenExpired() {
  const expiry = localStorage.getItem("tokenExpiry");
  if (!expiry) return false; // لو مفيش expiry لسه، اعتبره صالح مؤقتًا
  return Date.now() > parseInt(expiry, 10);
}

// ✅ دالة التشيك مع حماية ضد الخروج المبكر
export function checkTokenExpiration() {
  const token = localStorage.getItem("authToken");
  const expiry = localStorage.getItem("tokenExpiry");

  if (!token) return; // مفيش لوجين أساسًا

  if (!expiry) {
    console.log("⚠️ Token expiry not set yet, skipping check");
    return;
  }

  if (Date.now() > parseInt(expiry, 10)) {
    console.log("🚫 Session expired at:", new Date(parseInt(expiry, 10)).toLocaleTimeString());
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiry");
    setAuthToken(null);

    showToast("⚠️ Session expired! Please sign in again.", "warning");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } else {
    const minsLeft = Math.floor((parseInt(expiry, 10) - Date.now()) / 60000);
    console.log(`✅ Session still valid for ${minsLeft} minutes`);
  }
}

// ✅ التشيك كل 1 دقيقة
setInterval(checkTokenExpiration, 60 * 1000);


// ====================================================================

// 🔹 Endpoints
export const sendOtp = (phone) => api.post("/users/send-otp", { phone });

export const verifyOtp = (phone, otp) => {
  return api.post("/users/verify-otp", { phone, otp });
};

export const updateProfile = (data) => {
  return api.patch("/users/complete-profile", data);
};

// 🔹 login request (email or phone)
export async function loginUser(identifier, password) {
  const payload = {};

  if (identifier.includes("@")) {
    payload.email = identifier;
  } else {
    payload.phone = identifier;
  }

  payload.password = password;

  try {
    const res = await api.post("/users/sign-in", payload);
    const token = res?.data?.token;

    if (token) {
      saveAuthToken(token); // ⬅️ save with 2h expiry
    }

    return res.data;
  } catch (err) {
    throw err;
  }
}

// 🔹 logout request
export async function logoutUser() {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No token found!");

  const res = await api.post(
    "/users/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Remove locally
  localStorage.removeItem("authToken");
  localStorage.removeItem("tokenExpiry");
  setAuthToken(null);

  return res.data;
}

// 🔹 Other API functions
export const getPlans = () => {
  return api.get("/payments/get-plans", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const getAllCourses = () => api.get("/users/get-user-courses");
export const getJobNames = () => api.get("/users/get-user-job-names");
export const getUserDetails = () => api.get("/users/get-user-details");
export const getAllJobs = () => api.get("/users/get-all-jobs");

export const uploadCv = (formData) => {
  const token = localStorage.getItem("authToken"); // جلب التوكن من التخزين المحلي

  return api.patch(`/users/edit-cv`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token && { Authorization: `Bearer ${token}` }), // ✅ نضيف التوكن لو موجود
    },
  });
};


// Get user reports
export const getUserReports = () => {
  const token = localStorage.getItem("authToken"); // ✅ المفتاح الصحيح
  // console.log("📦 Token used for reports:", token);
  return api.get("/reports/get-all-reports-by-user", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};
export const getMoyassarKey = () => {
  const token = localStorage.getItem("authToken"); // ✅ المفتاح الصحيح
  console.log(token)
  return api.get("/admin/get-keys", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};

export const getCvMeta = () => {
  const token = localStorage.getItem("authToken"); // ✅ المفتاح الصحيح
  return api.get("/users/get-user-cv-metadata", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};
// Get jobs list with lang
export const getJobsList = (lang = "en") => {
  return api.get(`/jobs/list?lang=${lang}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export default api;
