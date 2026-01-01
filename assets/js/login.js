import { sendOtp, verifyOtp, loginUser } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginFormPhone = document.getElementById("loginFormPhone");
  const loginFormMail = document.getElementById("loginFormMail");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");

  const phoneInput = document.getElementById("phone");
  const otpSection = document.getElementById("otpSection");
  const otpInput = document.getElementById("otp");
  const sendBtn = document.getElementById("sendOtpBtnLogin");

  let step = "send";
  let savedPhone = "";

  /* ================= Language Helper ================= */
  function t(ar, en) {
    return (localStorage.getItem("lang") || "en") === "ar" ? ar : en;
  }

  /* ================= Toast ================= */
  function showToast(message, type = "info") {
    const styles = {
      success: {
        icon: '<i class="fa-solid fa-circle-check"></i>',
        bg: "linear-gradient(135deg, #28a745, #6fdc8d)",
      },
      error: {
        icon: '<i class="fa-solid fa-circle-xmark"></i>',
        bg: "linear-gradient(135deg, #dc3545, #ff6b81)",
      },
      warning: {
        icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
        bg: "linear-gradient(135deg, #ffc107, #ffd861)",
      },
      info: {
        icon: '<i class="fa-solid fa-circle-info"></i>',
        bg: "linear-gradient(135deg, #007bff, #6bb6ff)",
      },
    };

    const lang = localStorage.getItem("lang") || "en";

    Toastify({
      text: `${styles[type].icon} <span style="margin-left:8px">${message}</span>`,
      duration: 3500,
      gravity: "bottom",
      position: lang === "ar" ? "right" : "left",
      close: true,
      escapeMarkup: false,
      offset: { x: 20, y: 20 },
      style: {
        background: styles[type].bg,
        color: "#fff",
        fontSize: "15px",
        fontWeight: "600",
        borderRadius: "10px",
        padding: "8px 14px",
      },
    }).showToast();
  }

  /* ================= Cookie Helpers ================= */

  function setCookie(name, value, hours) {
    const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }

  /* ================= Auth Helpers ================= */

  function setAuth(token) {
    setCookie("authToken", token, 2); // ساعتين
  }

  function clearAuth() {
    deleteCookie("authToken");
  }

  function isLoggedIn() {
    return !!getCookie("authToken");
  }

  function updateUI() {
    const logged = isLoggedIn();

    loginBtn?.classList.toggle("log-toggle", logged);
    logoutBtn?.classList.toggle("log-toggle", !logged);

    document.querySelectorAll(".profile-menu").forEach((menu) => {
      menu.style.display = logged ? "block" : "none";
    });
  }

  updateUI();

  /* ================= OTP Login ================= */

  if (loginFormPhone && sendBtn) {
    sendBtn.addEventListener("click", async () => {
      if (step === "verify") {
        const otp = otpInput.value.trim();
        if (!otp) {
          showToast(t("ادخل كود التحقق", "Enter verification code"), "warning");
          return;
        }

        try {
          const res = await verifyOtp(savedPhone, otp);
          const token = res?.data?.token || res?.data?.access_token;

          if (!token) throw new Error("NO_TOKEN");

          setAuth(token);
          updateUI();

          showToast(t("تم تسجيل الدخول", "Login successful"), "success");
          bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          )?.hide();
        } catch {
          showToast(t("كود غير صحيح", "Invalid code"), "error");
        }
      } else {
        const phone = phoneInput.value.trim();
        if (!phone) {
          showToast(t("ادخل رقم الهاتف", "Enter phone number"), "warning");
          return;
        }

        try {
          await sendOtp(phone);
          savedPhone = phone;

          otpSection.classList.remove("d-none");
          phoneInput.parentElement.parentElement.style.display = "none";

          sendBtn.textContent = t("تحقق", "Verify");
          step = "verify";

          showToast(t("تم إرسال الكود", "Code sent"), "success");
        } catch {
          showToast(t("فشل الإرسال", "Failed to send code"), "error");
        }
      }
    });
  }

  /* ================= Email Login ================= */

  if (loginFormMail) {
    loginFormMail.addEventListener("submit", async function (e) {
      e.preventDefault();

      const identifier = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!identifier || !password) {
        showToast(t("املأ كل الحقول", "Fill all fields"), "warning");
        return;
      }

      try {
        const res = await loginUser(identifier, password);
        const token = res?.token || res?.access_token;

        if (!token) throw new Error("NO_TOKEN");

        setAuth(token);
        updateUI();

        showToast(t("تم تسجيل الدخول", "Login successful"), "success");
        bootstrap.Modal.getInstance(
          document.getElementById("loginModal")
        )?.hide();
      } catch (err) {
        showToast(
          err?.response?.data?.message ||
            t("بيانات غير صحيحة", "Invalid credentials"),
          "error"
        );
      }
    });
  }

  /* ================= Logout ================= */

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      showToast(t("تم تسجيل الخروج", "Logged out"), "success");
      window.location.href = "index.html";
    });
  }
});
