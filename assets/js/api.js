// api.js
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm";
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify-es.js";

const API_BASE = "https://api.jobzai.net/api/v1";

// ==================== AXIOS INSTANCE ====================
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==================== TOAST ====================
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

// ==================== TOKEN HANDLING ====================
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export function saveAuthToken(token) {
  const expiryTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  localStorage.setItem("authToken", token);
  localStorage.setItem("tokenExpiry", expiryTime.toString());
  setAuthToken(token);
}

export function isTokenExpired() {
  const expiry = localStorage.getItem("tokenExpiry");
  if (!expiry) return false;
  return Date.now() > parseInt(expiry, 10);
}

export function checkTokenExpiration() {
  const token = localStorage.getItem("authToken");
  const expiry = localStorage.getItem("tokenExpiry");

  if (!token || !expiry) return;

  if (Date.now() > parseInt(expiry, 10)) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiry");
    setAuthToken(null);

    showToast("⚠️ Session expired. Please login again.", "warning");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

// check every minute
setInterval(checkTokenExpiration, 60 * 1000);

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.msg || error?.response?.data?.message;

    if (status === 401 || status === 403 || msg === "Token not provided") {
      console.warn("🚫 Unauthorized – redirecting to login");

      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenExpiry");
      setAuthToken(null);

      showToast("⚠️ Please login again", "warning");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const sendOtp = (phone) => api.post("/users/send-otp", { phone });

export const verifyOtp = (phone, otp) =>
  api.post("/users/verify-otp", { phone, otp });

export async function loginUser(identifier, password) {
  const payload = identifier.includes("@")
    ? { email: identifier, password }
    : { phone: identifier, password };

  const res = await api.post("/users/sign-in", payload);
  const token = res?.data?.token;

  if (token) saveAuthToken(token);

  return res.data;
}

export async function logoutUser() {
  await api.post("/users/logout");
  localStorage.removeItem("authToken");
  localStorage.removeItem("tokenExpiry");
  setAuthToken(null);
}

// ==================== USER ====================
export const updateProfile = (data) =>
  api.patch("/users/complete-profile", data);

export const getUserDetails = () => api.get("/users/get-user-details");

export const getAllCourses = () => api.get("/users/get-user-courses");

export const getJobNames = () => api.get("/users/get-user-job-names");

export const getCvMeta = () => api.get("/users/get-user-cv-metadata");

// ==================== JOBS ====================
export const getAllJobs = () => api.get("/users/get-all-jobs");

export const getJobsList = (lang = "en") => api.get(`/jobs/list?lang=${lang}`);

export const getSingleJob = async (id, lang = "en") => {
  if (!id) return null;

  const token = localStorage.getItem("authToken"); // الاسم الصحيح
  console.log("Token:", token); // للتأكد

  const res = await api.get(`/jobs/get-single-job/${id}?lang=${lang}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  return res.data?.status ? res.data.job : null;
};



// ==================== BLOGS ====================
export const getAllBlogs = () => api.get("/users/get-all-blogs");

export const getSingleBlog = async (id) => {
  const res = await api.get(`/users/get-blog-by-id/${id}`);
  return res.data?.status ? res.data.blog : null;
};

// ==================== PAYMENTS / ADMIN ====================
export const getPlans = () => api.get("/payments/get-plans");

export const getUserReports = () => api.get("/reports/get-all-reports-by-user");

export const getMoyassarKey = () =>
  api.get("/admin/get-keys", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  });


// ==================== UPLOAD ====================
export const uploadCv = (formData) =>
  api.patch("/users/edit-cv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export default api;
