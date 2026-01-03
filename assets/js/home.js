// home.js
import { sendOtp, verifyOtp } from "./api.js";

/* ================= Cookies Helpers ================= */
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

/* ================= Toast ================= */
function showToast(msg, type = "info") {
  Toastify({
    text: msg,
    duration: 3000,
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
      borderRadius: "8px",
    },
  }).showToast();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const phoneInput = document.getElementById("phoneInput");
  const subscribeBtn = document.getElementById("sendOtpBtn");

  /* ================= Auth Guard ================= */
  function isLoggedIn() {
    return !!getCookie("authToken");
  }

  if (isLoggedIn()) {
    subscribeBtn.disabled = true;
    subscribeBtn.style.cursor = "not-allowed";
    // phoneInput.disabled = true;

    subscribeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showToast(
        document.documentElement.lang === "ar"
          ? "أنت مسجل دخول بالفعل"
          : "You are already logged in",
        "warning"
      );
    });

    return; // 🔴 نوقف أي OTP logic نهائيًا
  }

  /* ================= OTP Elements ================= */
  const otpInput = document.createElement("input");
  otpInput.type = "number";
  otpInput.id = "otpInput";
  otpInput.placeholder =
    document.documentElement.lang === "ar"
      ? "أدخل رمز التحقق"
      : "Enter verification code";
  otpInput.className = phoneInput.className;
  otpInput.style.display = "none";

  const verifyBtn = document.createElement("button");
  verifyBtn.type = "button";
  verifyBtn.textContent =
    document.documentElement.lang === "ar" ? "تأكيد الرمز" : "Verify Code";
  verifyBtn.className = subscribeBtn.className;
  verifyBtn.style.display = "none";

  phoneInput.after(otpInput);
  otpInput.after(verifyBtn);

  let step = "send";
  let savedPhone = "";

  /* ================= Subscribe ================= */
  subscribeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (isLoggedIn()) {
      showToast(
        document.documentElement.lang === "ar"
          ? "أنت مسجل دخول بالفعل"
          : "You are already logged in",
        "warning"
      );
      return;
    }

    const phone = phoneInput.value.trim();
    if (!phone) {
      showToast(
        document.documentElement.lang === "ar"
          ? "من فضلك أدخل رقم الجوال"
          : "Please enter your phone number",
        "warning"
      );
      return;
    }

    subscribeBtn.disabled = true;

    try {
      await sendOtp(phone);
      savedPhone = phone;

      phoneInput.style.display = "none";
      subscribeBtn.style.display = "none";

      otpInput.style.display = "block";
      verifyBtn.style.display = "block";

      showToast(
        document.documentElement.lang === "ar"
          ? "تم إرسال رمز التحقق"
          : "Verification code sent",
        "success"
      );

      step = "verify";
    } catch {
      showToast(
        document.documentElement.lang === "ar"
          ? "فشل إرسال الكود"
          : "Failed to send code",
        "error"
      );
      subscribeBtn.disabled = false;
    }
  });

  /* ================= Verify OTP ================= */
  verifyBtn.addEventListener("click", async () => {
    const otp = otpInput.value.trim();
    if (!otp) {
      showToast(
        document.documentElement.lang === "ar"
          ? "أدخل رمز التحقق"
          : "Enter verification code",
        "warning"
      );
      return;
    }

    verifyBtn.disabled = true;

    try {
      const res = await verifyOtp(savedPhone, otp);
      const token = res?.data?.token || res?.data?.access_token;

      if (!token) throw new Error();

      setCookie("authToken", token, 7);

      showToast(
        document.documentElement.lang === "ar"
          ? "تم تسجيل الدخول بنجاح"
          : "Login successful",
        "success"
      );

      window.location.reload();
    } catch {
      showToast(
        document.documentElement.lang === "ar"
          ? "كود غير صحيح"
          : "Invalid code",
        "error"
      );
      verifyBtn.disabled = false;
    }
  });
});
