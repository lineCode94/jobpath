// home.js
import { sendOtp, verifyOtp } from "./api.js";

// 🔹 دالة لتحديث الـ placeholder حسب اللغة
function updatePlaceholders(lang) {
  const inputs = document.querySelectorAll("[data-en]");
  inputs.forEach((input) => {
    if (input.placeholder !== undefined) {
      input.placeholder = input.getAttribute(`data-${lang}`);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const phoneInput = document.getElementById("phoneInput");
  const sendBtn = document.getElementById("sendOtpBtn");

  // عناصر مرحلة التحقق
  const otpInput = document.createElement("input");
  otpInput.type = "text";
  otpInput.id = "otpInput";
  otpInput.placeholder =
    document.documentElement.lang === "ar"
      ? "أدخل رمز التحقق"
      : "Enter verification code";
  otpInput.className = phoneInput.className || "";
  otpInput.style.display = "none";
  otpInput.setAttribute("data-en", "Enter verification code");
  otpInput.setAttribute("data-ar", "أدخل رمز التحقق");

  const verifyBtn = document.createElement("button");
  verifyBtn.type = "submit";
  verifyBtn.id = "verifyOtpBtn";
  verifyBtn.textContent =
    document.documentElement.lang === "ar" ? "تأكيد الرمز" : "Verify Code";
  verifyBtn.className = "rts__btn fill__btn black-btn";
  verifyBtn.style.display = "none";
  verifyBtn.disabled = true;

  // إضافتهم بعد زرار الإرسال
  sendBtn.insertAdjacentElement("afterend", otpInput);
  otpInput.insertAdjacentElement("afterend", verifyBtn);

  // 👇 نخزن البيانات هنا
  let step = "send"; // send | verify
  let savedPhone = "";

  // Toastify helper
  const showToast = (msg, type = "info") => {
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
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 20px",
      },
    }).showToast();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (step === "send") {
      const phone = phoneInput.value.trim();
      if (!phone) {
        showToast(
          document.documentElement.lang === "ar"
            ? "⚠️ من فضلك أدخل رقم الجوال."
            : "⚠️ Please enter your phone number.",
          "warning"
        );
        return;
      }

      showToast(
        document.documentElement.lang === "ar"
          ? "⏳ جاري إرسال رمز التحقق..."
          : "⏳ Sending verification code...",
        "info"
      );
      sendBtn.disabled = true;

      try {
        await sendOtp(phone);
        savedPhone = phone; // خزّن الرقم
        localStorage.setItem("phoneNumber", phone); // ✅ نحطه في localStorage

        showToast(
          document.documentElement.lang === "ar"
            ? "✅ تم إرسال رمز التحقق! من فضلك افحص هاتفك."
            : "✅ Verification code sent! Please check your phone.",
          "success"
        );

        // بدّل الواجهة
        phoneInput.style.display = "none";
        phoneInput.required = false;
        phoneInput.value = "";

        sendBtn.style.display = "none";

        otpInput.style.display = "inline-block";
        otpInput.required = true;
        otpInput.value = "";

        verifyBtn.style.display = "inline-block";
        verifyBtn.disabled = false;

        otpInput.focus();
        step = "verify";
      } catch (err) {
        showToast(
          `❌ ${
            err.response?.data?.message ||
            (document.documentElement.lang === "ar"
              ? "حدث خطأ أثناء الإرسال."
              : "An error occurred while sending.")
          }`,
          "error"
        );
      } finally {
        sendBtn.disabled = false;
      }
    } else if (step === "verify") {
      const otp = otpInput.value.trim();
      if (!otp) {
        showToast(
          document.documentElement.lang === "ar"
            ? "⚠️ من فضلك أدخل رمز التحقق."
            : "⚠️ Please enter the verification code.",
          "warning"
        );
        otpInput.focus();
        return;
      }

      if (!savedPhone) {
        showToast(
          document.documentElement.lang === "ar"
            ? "❌ رقم الجوال غير متوفر. أعد الإرسال مرة أخرى."
            : "❌ Phone number missing. Please resend.",
          "error"
        );
        step = "send";
        phoneInput.style.display = "inline-block";
        sendBtn.style.display = "inline-block";
        otpInput.style.display = "none";
        verifyBtn.style.display = "none";
        return;
      }

      showToast(
        document.documentElement.lang === "ar"
          ? "⏳ جاري التحقق..."
          : "⏳ Verifying...",
        "info"
      );
      verifyBtn.disabled = true;

      try {
        const res = await verifyOtp(savedPhone, otp); // ✅ لازم await
        const token = res?.data?.token || res?.data?.access_token;
        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("userId", res?.data?.id);
          showToast(
            document.documentElement.lang === "ar"
              ? "  تم التحقق من الرمز بنجاح!"
              : "  Verification successful!",
            "success"
          );
          window.location.reload();
        }

        // ✅ نرجع الواجهة للوضع الأول مع إظهار input فاضي
        otpInput.style.display = "none";
        verifyBtn.style.display = "none";
        otpInput.value = "";

        phoneInput.style.display = "inline-block";
        sendBtn.style.display = "inline-block";
        phoneInput.value = "";
        step = "send";
      } catch (err) {
        showToast(
          `❌ ${
            err.response?.data?.message ||
            (document.documentElement.lang === "ar"
              ? "فشل التحقق."
              : "Verification failed.")
          }`,
          "error"
        );
        verifyBtn.disabled = false;
      }
    }
  });

  // ✅ أول ما الصفحة تفتح
  updatePlaceholders(document.documentElement.lang || "en");

  // ✅ زر تغيير اللغة (اختياري لو عندك زرار)
  document.getElementById("langToggle")?.addEventListener("click", () => {
    const currentLang = document.documentElement.lang === "ar" ? "en" : "ar";
    document.documentElement.lang = currentLang;
    updatePlaceholders(currentLang);
  });
});
