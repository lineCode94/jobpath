// api.js
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm";

const API_BASE = "http://173.225.102.24:9000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ✅ Helper:  set/remove token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // console.log(
    //   "🔑 Token set in headers:",
    //   api.defaults.headers.common["Authorization"]
    // );
  } else {
    delete api.defaults.headers.common["Authorization"];
    console.log("⚠️ Token removed from headers");
  }
};

// 🔹 Interceptor للتأكد من الهيدر قبل أي request
api.interceptors.request.use((config) => {
  // console.log("🚀 Sending Request:", {
  //   url: config.url,
  //   method: config.method,
  //   headers: config.headers,
  //   data: config.data,
  // });
  return config;
});

// 🔹 Endpoints
export const sendOtp = (phone) => api.post("/users/send-otp", { phone });

export const verifyOtp = (phone, otp) => {
  return api.post("/users/verify-otp", { phone, otp });
};

export const updateProfile = (data) => {
  return api.patch("/users/complete-profile", data);
};
//get plans
export async function getPlans() {
  try {
    const res = await fetch(`${API_BASE}/payments/get-plans`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch plans");

    const data = await res.json();
    return data.plansWithAmount || [];
  } catch (err) {
    console.error("Error fetching plans:", err);
    return [];
  }
}
export const getAllCourses = () => api.get("/users/get-user-courses");
export const getJobNames = () => api.get("/users/get-user-job-names");
export const getUserDetails = () => api.get("/users/get-user-details");
export const getAllJobs = () => api.get("/users/get-all-jobs");
export const uploadCv = (userId, formData) => {
  alert(userId);

  return api.patch(`/users/edit-cv/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
