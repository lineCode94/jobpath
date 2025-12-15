import { sendOtp, verifyOtp, loginUser } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginFormPhone = document.getElementById("loginFormPhone");
  const loginFormMail = document.getElementById("loginFormMail");

  const phoneInput = document.getElementById("phone");
  const otpSection = document.getElementById("otpSection");
  const otpInput = document.getElementById("otp");
  const sendBtn = document.getElementById("sendOtpBtnLogin");

  let step = "send";
  let savedPhone = "";

  // 🌐 Helper لتحديد اللغة
  function t(ar, en) {
    const lang = localStorage.getItem("lang") || "en";
    return lang === "ar" ? ar : en;
  }

  // ✅ Toast Helper
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

    Toastify({
      text: `${styles[type].icon} <span style="margin-left:8px">${message}</span>`,
      duration: 3500,
      gravity: "bottom",
      position: "left",
      close: true,
      escapeMarkup: false,
      offset: { x: 20, y: 20 },
      style: {
        background: styles[type].bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "15px",
        fontWeight: "600",
        borderRadius: "10px",
        padding: "12px 18px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      },
    }).showToast();
  }

  // ✅ تحديث الواجهة لجميع الأزرار (header + offcanvas)
function updateUI() {
  const token = localStorage.getItem("authToken");

  // أزرار الهيدر + offcanvas
  const loginBtns = [
    document.getElementById("login"),
    document.getElementById("loginCavas"),
  ];
  const logoutBtns = [
    document.getElementById("logout"),
    document.getElementById("logoutCavas"),
  ];

  const userProfile = document.getElementById("profileMenu");

  if (token) {
    loginBtns.forEach((btn) => {
      if (btn) btn.style.display = "none";
    });
    logoutBtns.forEach((btn) => {
      if (btn) btn.style.display = "inline-flex";
    });
    if (userProfile) userProfile.style.display = "block";
  } else {
    loginBtns.forEach((btn) => {
      if (btn) btn.style.display = "inline-flex";
    });
    logoutBtns.forEach((btn) => {
      if (btn) btn.style.display = "none";
    });
    if (userProfile) userProfile.style.display = "none";
  }
}



  updateUI();

  // ---------------- LOGOUT ----------------
  function setupLogout() {
    const logoutBtns = [
      document.getElementById("logout"),
      document.getElementById("logoutCavas"),
    ];

    logoutBtns.forEach((btn) => {
      btn?.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("loginTime");
        // window.location.reload();
        showToast(
          t("تم تسجيل الخروج بنجاح", "Logged out successfully!"),
          "success"
        );
        updateUI();
        window.location.href = "index.html";
      });
    });
  }

  setupLogout();

  // ⏱ AUTO LOGOUT AFTER 2 HOURS
  function checkAutoLogout() {
    const token = localStorage.getItem("authToken");
    const loginTime = localStorage.getItem("loginTime");
    if (!token || !loginTime) return;

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (Date.now() - loginTime >= TWO_HOURS) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("loginTime");
      updateUI();
    }
  }

  checkAutoLogout();
  setInterval(checkAutoLogout, 60 * 1000);

  // ---------------- PHONE LOGIN (OTP) ----------------
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

        showToast(t("جاري التحقق من الكود...", "Verifying code..."), "info");
        sendBtn.disabled = true;

        try {
          const res = await verifyOtp(savedPhone, otp);
          const token = res?.data?.token || res?.data?.access_token;

          if (token) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("loginTime", Date.now());
            showToast(
              t("تم تسجيل الدخول بنجاح", "Login successful!"),
              "success"
            );
            updateUI();
            bootstrap.Modal.getInstance(
              document.getElementById("loginModal")
            )?.hide();
          }
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

        showToast(
          t("جاري ارسال كود التحقق...", "Sending verification code..."),
          "info"
        );
        sendBtn.disabled = true;

        try {
          await sendOtp(phone);
          savedPhone = phone;
          showToast(
            t("تم ارسال الكود بنجاح", "Code sent successfully"),
            "success"
          );
          otpSection.classList.remove("d-none");
          phoneInput.parentElement.parentElement.classList.add("d-none");
          sendBtn.textContent = t("تحقق من الكود", "Verify Code");
          step = "verify";
        } catch {
          showToast(t("فشل في ارسال الكود", "Failed to send code"), "error");
        } finally {
          sendBtn.disabled = false;
        }
      }
    });
  }

  // ---------------- EMAIL / PHONE + PASSWORD LOGIN ----------------
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

        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("loginTime", Date.now());
          showToast(
            t("تم تسجيل الدخول بنجاح!", "Login successful!"),
            "success"
          );
          updateUI();
          bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          )?.hide();
        } else {
          showToast(
            t("استجابة غير صالحة من السيرفر", "Invalid response from server"),
            "error"
          );
        }
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            t("بيانات الدخول غير صحيحة", "Incorrect email/phone or password"),
          "error"
        );
      }
    });
  }
});
