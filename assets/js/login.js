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
    Toastify({
      text: message,
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
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 20px",
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
          showToast("⚠️ Please enter the verification code", "warning");
          return;
        }

        showToast("⏳ Verifying code...", "info");
        sendBtn.disabled = true;

        try {
          const res = await verifyOtp(savedPhone, otp);
          const token = res?.data?.token || res?.data?.access_token;

          if (token) {
            localStorage.setItem("authToken", token);
            showToast("✅ Login successful!", "success");
            updateUI();

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("loginModal")
            );
            if (modal) modal.hide();
          }
        } catch (err) {
          showToast("❌ Invalid verification code", "error");
        } finally {
          sendBtn.disabled = false;
        }
      } else {
        // إرسال الكود
        const phone = phoneInput.value.trim();
        if (!phone) {
          showToast("⚠️ Please enter your phone number", "warning");
          return;
        }

        showToast("⏳ Sending verification code...", "info");
        sendBtn.disabled = true;

        try {
          await sendOtp(phone);
          savedPhone = phone;
          localStorage.setItem("phoneNumber", phone);

          showToast("✅ Code sent successfully!", "success");
          otpSection.classList.remove("d-none");
          phoneInput.parentElement.parentElement.classList.add("d-none");

          sendBtn.textContent = "Verify Code";
          step = "verify";
        } catch (err) {
          showToast("❌ Failed to send code", "error");
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
        showToast("⚠️ Please fill all fields", "warning");
        return;
      }

      showToast("⏳ Logging in...", "info");

      try {
        const res = await loginUser(identifier, password);
        const token = res?.token || res?.access_token;
        console.log(res)
        if (token) {
          localStorage.setItem("authToken", token);
          showToast("✅ Login successful!", "success");
          updateUI();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          );
          if (modal) modal.hide();
        } else {
          showToast("❌ Invalid response from server", "error");
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
      showToast("✅ Logged out successfully!", "success");
      window.location.reload();
      window.location.href = "index.html";
      updateUI();
    });
  }
});
