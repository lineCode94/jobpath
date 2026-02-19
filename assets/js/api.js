// api.js
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm";
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify-es.js";

const API_BASE = "https://api.jobzai.net/api/v1";

// ==================== AXIOS INSTANCE ====================
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ يبعت الكوكي تلقائي مع كل request
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==================== REQUEST INTERCEPTOR للـ Debug ====================
api.interceptors.request.use(
  (config) => {
    // console.log("➡️ Request URL:", config.url);
    // console.log("Method:", config.method);
    // console.log("Headers (check Cookie sent):", config.headers);

    // Note: HttpOnly cookies مش هتظهر هنا لكن هتتبعت تلقائي مع request
    return config;
  },
  (error) => Promise.reject(error)
);

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

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // if (status === 401 || status === 403) {
    //   showToast("⚠️ Session expired. Please login again.", "warning");
    //   setTimeout(() => {
    //     window.location.href = "index.html";
    //   }, 1500);
    // }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

// OTP (بدون توكين أصلاً)
export const sendOtp = (phone) => api.post("/users/send-otp", { phone });

export const verifyOtp = (phone, otp) =>
  api.post("/users/verify-otp", { phone, otp });

// Login (السيرفر بيحط التوكين في Cookie)
export async function loginUser(identifier, password) {
  const payload = identifier.includes("@")
    ? { email: identifier, password }
    : { phone: identifier, password };

  const res = await api.post("/users/sign-in", payload);
  return res.data;
}

// Logout (السيرفر يمسح الكوكي)
export async function logoutUser() {
  await api.get("/users/log-out");
  sessionStorage.clear();
  window.location.href = "index.html";
}

// ==================== USER ====================
export const updateProfile = (data) =>
  api.patch("/users/complete-profile", data);

export const getUserDetails = () => api.get("/users/get-user-details");

export const getAllCourses = () => api.get("/users/get-user-courses");

export const getJobNames = () => api.get("/users/get-user-job-names");

export const getCvMeta = () => api.get("/users/get-user-cv-metadata");

// ==================== ATS REQUEST ====================
export const sendAtsRequest = () => api.get("/ats/send-req");

export const getAtsStatus = () => api.get("/ats/get-req-status");

export const getAtsResult = () => api.get("/ats/get-req-result");
// ==================== ATS cv enhancments ====================
export const sendCvEnhancementRequest = () => api.get("/cv-enhancement/send-req");

export const getCvEnhancementStatus = () => api.get("/cv-enhancement/get-req-status");

export const getCvEnhancementResult = () => api.get("/cv-enhancement/get-req-result");

// ==================== JOBS ====================
export const getAllJobs = () => api.get("/users/get-all-jobs");

export const getJobsList = (lang = "en") => api.get(`/jobs/list?lang=${lang}`);

export const getSingleJob = async (id, lang = "en") => {
  if (!id) return null;
  const res = await api.get(`/jobs/get-single-job/${id}?lang=${lang}`);
  return res.data?.status ? res.data.job : null;
};

// ==================== BLOGS ====================
export const getAllBlogs = () => api.get("/users/get-all-blogs");
export const getLatestBlogs = () => api.get("/admin/get-recent-three-blogs");

export const getSingleBlog = async (id) => {
  const res = await api.get(`/users/get-blog-by-id/${id}`);
  return res.data?.status ? res.data.blog : null;
};

// ==================== PAYMENTS / ADMIN ====================
export const getPlans = () => api.get("/payments/get-plans");

export const getUserReports = () => api.get("/reports/get-all-reports-by-user");

export const getMoyassarKey = () => api.get("/admin/get-keys");

// ==================== UPLOAD ====================
export const uploadCv = (formData) =>
  api.patch("/users/edit-cv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
// ==================== create cv ====================
export const getCvTemplates = () => api.get("/cv-build/templates");
export const cvCreate = (data) => api.post("/cv-build/create-cv", data);
export const cvBuild = (data) => api.put("/cv-build/update-cv", data);
export const getCvById = (cvId) => {
  return api.get(`/cv-build/${cvId}`);
};

// 2️⃣ Export CV (pdf | docx)
export const exportCv = (cvId, format) =>
  api.post(`/cv-build/export/${cvId}`, { format });

// ================= CV PREVIEW (STREAM FILE) =================
export const cvPreview = (cvId) => {
  return api.get(`/cv-build/stream-file/${cvId}`, {
    responseType: "blob", // 🔥 مهم جدًا
  });
};
export default api;
