import { sendOtp, verifyOtp, loginUser, logoutUser } from "./api.js";
import api from "./api.js";

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

  /* ================= AUTH STATE (LOCAL) ================= */
  let authState = {
    loggedIn: false,
  };

  /* ================= Language ================= */
  function t(ar, en) {
    return (localStorage.getItem("lang") || "en") === "ar" ? ar : en;
  }
  
  //===============Get error message=========================
  function getErrorMessage(err, fallbackAr, fallbackEn) {
    const backendMsg =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      err?.response?.data?.error;

    if (backendMsg) return backendMsg;

    return t(fallbackAr, fallbackEn);
  }


  /* ================= Toast ================= */
  function showToast(message, type = "info") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "center",
      style: { background: type === "error" ? "#dc3545" : "#28a745" },
    }).showToast();
  }

  /* ================= AUTH ================= */

async function isLoggedIn() {
  try {
    const res = await api.get("/users/get-user-details", {
      withCredentials: true, // الكوكيز يتم إرسالها تلقائيًا
    });

    return res.status === 200 && !!res.data?.currentUser?.id;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      return false;
    }
    console.error("isLoggedIn error:", err);
    return false;
  }
}

function renderUI(logged) {
  // Buttons
  loginBtn?.classList.toggle("d-none", logged);
  loginBtn?.classList.toggle("d-sm-flex", !logged);

  logoutBtn?.classList.toggle("d-none", !logged);
  logoutBtn?.classList.toggle("d-sm-flex", logged);

  // ATS Menu (🔥 المطلوب)
  const atsMenu = document.getElementById("atsMenu");
  if (atsMenu) {
    atsMenu.style.display = logged ? "block" : "none";
  }
  // Profile menu
  document
    .querySelectorAll(".profile-menu")
    .forEach((menu) => (menu.style.display = logged ? "block" : "none"));
}

  async function updateUIFromServer() {
    const logged = await isLoggedIn();
    authState.loggedIn = logged;
    renderUI(logged);

    // 🔥 show بعد ما نحدد الحالة
    document.getElementById("authButtons").style.visibility = "visible";
  }

  function forceLoginUI() {
    authState.loggedIn = true;
    renderUI(true);
  }

  /* ================= INIT ================= */
  updateUIFromServer(); // ⬅️ فقط عند تحميل الصفحة

  /* ================= OTP LOGIN ================= */
  if (loginFormPhone && sendBtn) {
    sendBtn.addEventListener("click", async () => {
      if (step === "verify") {
        const otp = otpInput.value.trim();
        if (!otp) return showToast(t("ادخل الكود", "Enter code"), "error");

        try {
          await verifyOtp(savedPhone, otp); // cookie set by backend

          forceLoginUI(); // ⬅️ مهم جدًا
          showToast(t("تم تسجيل الدخول", "Login successful"), "success");

          bootstrap.Modal.getInstance(
            document.getElementById("loginModal"),
          )?.hide();
        } catch (err) {
          const msg = getErrorMessage(err, "كود غير صحيح", "Invalid code");
          showToast(msg, "error");
        }

      } else {
        const phone = phoneInput.value.trim();
        if (!phone)
          return showToast(t("ادخل رقم الهاتف", "Enter phone"), "error");

        try {
          await sendOtp(phone);
          savedPhone = phone;

          otpSection.classList.remove("d-none");
          phoneInput.closest(".form-group").style.display = "none";
          sendBtn.textContent = t("تحقق", "Verify");
          step = "verify";

          showToast(t("تم إرسال الكود", "Code sent"), "success");
        } catch (err) {
          const msg = getErrorMessage(
            err,
            "فشل الإرسال",
            "Failed to send code",
          );
          showToast(msg, "error");
        }

      }
    });
  }

  /* ================= EMAIL LOGIN ================= */
  if (loginFormMail) {
    loginFormMail.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password)
        return showToast(t("املأ الحقول", "Fill fields"), "error");

      try {
        await loginUser(email, password); // cookie stored

        forceLoginUI(); // ⬅️ الحل الحقيقي
        showToast(t("تم تسجيل الدخول", "Login successful"), "success");

        bootstrap.Modal.getInstance(
          document.getElementById("loginModal"),
        )?.hide();
      } catch (err) {
        const msg = getErrorMessage(err, "بيانات خاطئة", "Invalid credentials");
        showToast(msg, "error");
      }

    });
  }

  /* ================= LOGOUT ================= */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await logoutUser(); // backend clears cookie

        authState.loggedIn = false;
        renderUI(false);

        showToast(t("تم تسجيل الخروج", "Logged out"), "success");
      } catch (err) {
        const msg = getErrorMessage(err, "فشل تسجيل الخروج", "Logout failed");
        showToast(msg, "error");
      }

    });
  }
});
