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

  /* ================= Auth Helpers ================= */

  function setAuth(token) {
    // تنظيف أي بيانات قديمة
    localStorage.clear();

    localStorage.setItem("authToken", token);
    localStorage.setItem("loginTime", Date.now());
  }

  function clearAuth() {
    localStorage.clear();
  }

  function isLoggedIn() {
    return !!localStorage.getItem("authToken");
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

  /* ================= Auto Logout ================= */
  function checkAutoLogout() {
    const token = localStorage.getItem("authToken");
    const loginTime = localStorage.getItem("loginTime");
    if (!token || !loginTime) return;

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (Date.now() - Number(loginTime) >= TWO_HOURS) {
      clearAuth();
      window.location.href = "index.html";
    }
  }

  checkAutoLogout();
  setInterval(checkAutoLogout, 60 * 1000);

  /* ================= OTP Login ================= */
  if (loginFormPhone && sendBtn) {
    sendBtn.addEventListener("click", async () => {
      if (step === "verify") {
        const otp = otpInput.value.trim();
        if (!otp) {
          showToast(
            t("من فضلك ادخل كود التحقق", "Please enter the verification code"),
            "warning"
          );
          return;
        }

        sendBtn.disabled = true;
        showToast(t("جاري التحقق من الكود...", "Verifying code..."), "info");

        try {
          const res = await verifyOtp(savedPhone, otp);
          const token = res?.data?.token || res?.data?.access_token;

          if (!token) throw new Error("NO_TOKEN");

          setAuth(token);
          updateUI();

          showToast(t("تم تسجيل الدخول بنجاح", "Login successful!"), "success");

          bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          )?.hide();
        } catch {
          showToast(
            t("كود التحقق غير صحيح", "Invalid verification code"),
            "error"
          );
        } finally {
          sendBtn.disabled = false;
        }
      } else {
        const phone = phoneInput.value.trim();
        if (!phone) {
          showToast(
            t("من فضلك ادخل رقم الهاتف", "Please enter your phone number"),
            "warning"
          );
          return;
        }

        sendBtn.disabled = true;
        showToast(
          t("جاري ارسال كود التحقق...", "Sending verification code..."),
          "info"
        );

        try {
          await sendOtp(phone);
          savedPhone = phone;

          otpSection.classList.remove("d-none");
         phoneInput.parentElement.parentElement.style.display = "none";


          sendBtn.textContent = t("تحقق من الكود", "Verify Code");
          step = "verify";

          showToast(
            t("تم ارسال الكود بنجاح", "Code sent successfully"),
            "success"
          );
        } catch {
          showToast(t("فشل في ارسال الكود", "Failed to send code"), "error");
        } finally {
          sendBtn.disabled = false;
        }
      }
    });
  }

  /* ================= Email / Password Login ================= */
  if (loginFormMail) {
    loginFormMail.addEventListener("submit", async function (e) {
      e.preventDefault();

      const identifier = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!identifier || !password) {
        showToast(
          t("من فضلك املأ جميع الحقول", "Please fill all fields"),
          "warning"
        );
        return;
      }

      showToast(t("جاري تسجيل الدخول...", "Logging in..."), "info");

      try {
        const res = await loginUser(identifier, password);
        const token = res?.token || res?.access_token;

        if (!token) throw new Error("NO_TOKEN");

        setAuth(token);
        updateUI();

        showToast(t("تم تسجيل الدخول بنجاح", "Login successful!"), "success");

        bootstrap.Modal.getInstance(
          document.getElementById("loginModal")
        )?.hide();
      } catch (err) {
        showToast(
          err?.response?.data?.message ||
            t("بيانات الدخول غير صحيحة", "Incorrect login credentials"),
          "error"
        );
      }
    });
  }

  /* ================= Logout ================= */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      showToast(
        t("تم تسجيل الخروج بنجاح", "Logged out successfully"),
        "success"
      );
      window.location.href = "index.html";
    });
  }
});
