// home.js
import { sendOtp, verifyOtp } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const phoneInput = document.getElementById("phoneInput");
  const sendBtn = document.getElementById("sendOtpBtn");

  // عناصر مرحلة التحقق
  const otpInput = document.createElement("input");
  otpInput.type = "text";
  otpInput.id = "otpInput";
  otpInput.placeholder = "أدخل رمز التحقق";
  otpInput.className = phoneInput.className || "";
  otpInput.style.display = "none";

  const verifyBtn = document.createElement("button");
  verifyBtn.type = "submit";
  verifyBtn.id = "verifyOtpBtn";
  verifyBtn.textContent = "تأكيد الرمز";
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
        showToast("⚠️ من فضلك أدخل رقم الجوال.", "warning");
        return;
      }

      showToast("⏳ جاري إرسال رمز التحقق...", "info");
      sendBtn.disabled = true;

      try {
        await sendOtp(phone);
        savedPhone = phone; // خزّن الرقم
        localStorage.setItem("phoneNumber", phone); // ✅ نحطه في localStorage

        showToast("✅ تم إرسال رمز التحقق! من فضلك افحص هاتفك.", "success");

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
          `❌ خطأ: ${err.response?.data?.message || err.message}`,
          "error"
        );
      } finally {
        sendBtn.disabled = false;
      }
    } else if (step === "verify") {
      const otp = otpInput.value.trim();
      if (!otp) {
        showToast("⚠️ من فضلك أدخل رمز التحقق.", "warning");
        otpInput.focus();
        return;
      }

      if (!savedPhone) {
        showToast("❌ رقم الجوال غير متوفر. أعد الإرسال مرة أخرى.", "error");
        step = "send";
        phoneInput.style.display = "inline-block";
        sendBtn.style.display = "inline-block";
        otpInput.style.display = "none";
        verifyBtn.style.display = "none";
        return;
      }

      showToast("⏳ جاري التحقق...", "info");
      verifyBtn.disabled = true;

      try {
        const res = await verifyOtp(savedPhone, otp); // ✅ لازم await
        // console.log("verify response:", res);

        // لو حابب تشوفها في alert:
        const token = res?.data?.token || res?.data?.access_token;
        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("userId", res?.data?.id);
          showToast("🎉 تم التحقق من الرمز بنجاح!", "success");
        }

        // ✅ نرجع الواجهة للوضع الأول مع إظهار input فاضي
        otpInput.style.display = "none";
        verifyBtn.style.display = "none";
        otpInput.value = "";

        phoneInput.style.display = "inline-block";
        sendBtn.style.display = "inline-block";
        phoneInput.value = ""; // نخليه فاضي علشان يبان جديد
        step = "send";
      } catch (err) {
        showToast(
          `❌ فشل التحقق: ${err.response?.data?.message || err.message}`,
          "error"
        );
        verifyBtn.disabled = false;
      }
    }
  });
});
