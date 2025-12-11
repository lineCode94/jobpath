import { sendOtp, verifyOtp, loginUser } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginFormPhone = document.getElementById("loginFormPhone");
  const loginFormMail = document.getElementById("loginFormMail");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const profileMenu = document.getElementById("profileMenu");

  const phoneInput = document.getElementById("phone");
  const otpSection = document.getElementById("otpSection");
  const otpInput = document.getElementById("otp");
  const sendBtn = document.getElementById("sendOtpBtnLogin");

  let step = "send";
  let savedPhone = "";

  // ✅ Toast helper
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
    gravity: "bottom", // يظهر تحت
    position: "left", // شمال
    close: true,
    escapeMarkup: false, // 👈 مهم عشان يسمح بعرض HTML داخل التوست
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



  // ✅ تحديث الواجهة
  function updateUI() {
    const token = localStorage.getItem("authToken");
    if (token) {
      if (loginBtn) loginBtn.classList.add("log-toggle");
      if (logoutBtn) logoutBtn.classList.remove("log-toggle");
      if (profileMenu) profileMenu.style.display = "block";
    } else {
      if (loginBtn) loginBtn.classList.remove("log-toggle");
      if (logoutBtn) logoutBtn.classList.add("log-toggle");
      if (profileMenu) profileMenu.style.display = "none";
    }
  }

  updateUI();

  // ---------------- PHONE LOGIN (OTP) ----------------
  if (loginFormPhone && sendBtn) {
    sendBtn.addEventListener("click", async () => {
      if (step === "verify") {
        // تحقق من الكود
        const otp = otpInput.value.trim();
        if (!otp) {
          showToast(" Please enter the verification code", "warning");
          return;
        }

        showToast(" Verifying code...", "info");
        sendBtn.disabled = true;

        try {
          const res = await verifyOtp(savedPhone, otp);
          const token = res?.data?.token || res?.data?.access_token;

          if (token) {
            localStorage.setItem("authToken", token);
            showToast("Login successful!", "success");
            updateUI();

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("loginModal")
            );
            if (modal) modal.hide();
          }
        } catch (err) {
          showToast(" Invalid verification code", "error");
        } finally {
          sendBtn.disabled = false;
        }
      } else {
        // إرسال الكود
        const phone = phoneInput.value.trim();
        if (!phone) {
          showToast(" Please enter your phone number", "warning");
          return;
        }

        showToast(" Sending verification code...", "info");
        sendBtn.disabled = true;

        try {
          await sendOtp(phone);
          savedPhone = phone;
          localStorage.setItem("phoneNumber", phone);

          showToast(" Code sent successfully!", "success");
          otpSection.classList.remove("d-none");
          phoneInput.parentElement.parentElement.classList.add("d-none");

          sendBtn.textContent = "Verify Code";
          step = "verify";
        } catch (err) {
          showToast(" Failed to send code", "error");
        } finally {
          sendBtn.disabled = false;
        }
      }
    });
  }

  // ---------------- EMAIL OR PHONE + PASSWORD LOGIN ----------------
  if (loginFormMail) {
    loginFormMail.addEventListener("submit", async function (e) {
      e.preventDefault();

      const identifier = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
alert(identifier)
      if (!identifier || !password) {
        showToast(" Please fill all fields", "warning");
        return;
      }

      showToast(" Logging in...", "info");

      try {
        const res = await loginUser(identifier, password);
        const token = res?.token || res?.access_token;
        console.log(res)
        if (token) {
          localStorage.setItem("authToken", token);
          showToast(" Login successful!", "success");
          updateUI();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          );
          if (modal) modal.hide();
        } else {
          showToast(" Invalid response from server", "error");
        }
      } catch (err) {
        showToast(
          err.response?.data?.message || "❌ Incorrect email/phone or password",
          "error"
        );
      }
    });
  }

  // ---------------- LOGOUT ----------------
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("authToken");
      showToast(" Logged out successfully!", "success");
      window.location.reload();
      window.location.href = "index.html";
      updateUI();
    });
  }
});
