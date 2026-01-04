// home.js
import { sendOtp, verifyOtp, getUserDetails } from "./api.js";

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

/* ================= Auth Check (SOURCE OF TRUTH) ================= */
async function isLoggedIn() {
  try {
    // alert(1)
    await getUserDetails(); // cookie auto sent
    return true;
  } catch {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const phoneInput = document.getElementById("phoneInput");
  const subscribeBtn = document.getElementById("sendOtpBtn");

  /* ================= CHECK LOGIN STATE ================= */
  const logged = await isLoggedIn();
// console.log(logged);
  if (logged) {
    subscribeBtn.disabled = true;
    subscribeBtn.style.cursor = "not-allowed";
subscribeBtn.classList.add("btn-disabled");
    subscribeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showToast(
        document.documentElement.lang === "ar"
          ? "أنت مسجل دخول بالفعل"
          : "You are already logged in",
        "warning"
      );
    });

    return; // ⛔ نوقف OTP logic نهائيًا
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

  /* ================= Send OTP ================= */
  subscribeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

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

      // نحفظ الرقم مؤقتًا
      sessionStorage.setItem("otp_phone", phone);

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
    } catch (err) {
      console.error(err);
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
      const phone = sessionStorage.getItem("otp_phone");
      if (!phone) throw new Error("Phone not found");

      await verifyOtp(phone, otp); // backend sets cookie

      showToast(
        document.documentElement.lang === "ar"
          ? "تم تسجيل الدخول بنجاح"
          : "Login successful",
        "success"
      );

      sessionStorage.removeItem("otp_phone");
      window.location.reload();
    } catch (err) {
      console.error(err);
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
