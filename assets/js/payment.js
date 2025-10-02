// payment.js
// =========================
// 1) ضع الـ Publishable Key الخاص بك من لوحة مويّسر
// ملاحظة: لا تضع الـ Secret Key في الفرونت إطلاقاً.
const PUBLISHABLE_KEY = "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx"; // غيّره

// 2) مراجع DOM
const amountInput = document.getElementById("amount");
const descInput = document.getElementById("desc");
const statusBox = document.getElementById("status");

// Helper UI
function setStatus(msg, type = "ok") {
  statusBox.className = "";
  statusBox.classList.add(
    type === "ok" ? "ok" : type === "warn" ? "warn" : "err"
  );
  statusBox.textContent = msg;
  statusBox.style.display = "block";
}

// 3) اجلب قيمة amount من الكويري لو موجود ?amount=99
const urlParams = new URLSearchParams(window.location.search);
const queryAmount = urlParams.get("amount");
if (queryAmount && !Number.isNaN(parseFloat(queryAmount))) {
  amountInput.value = parseFloat(queryAmount);
}

// 4) دالة لتحويل الريال إلى هللة (مويّسر تستقبل القيمة بالهللة)
const toHalalas = (sarAmountNumber) =>
  Math.round(Number(sarAmountNumber) * 100);

// 5) دالة لإعادة تهيئة الفورم بعد تغيير المبلغ/الوصف
function initMoyasar() {
  // امسح أي فورم قديم
  const mountEl = document.getElementById("payment-form");
  mountEl.innerHTML = "";

  // جهز بيانات الطلب
  const amountSAR = Number(amountInput.value || 0);
  if (!amountSAR || amountSAR <= 0) {
    setStatus("من فضلك أدخل مبلغًا صحيحًا.", "warn");
    return;
  }

  const amountInHalalas = toHalalas(amountSAR);
  const description = descInput.value?.trim() || `طلب ${Date.now()}`;
  const orderId = "ORD-" + Date.now();

  // 6) تهيئة مويّسر Embedded
  Moyasar.init({
    element: "#payment-form",
    // العملة والمبلغ
    amount: amountInHalalas, // بالهللة
    currency: "SAR",
    description,

    // المفتاح المعلن (ليس سرياً)
    publishable_api_key: PUBLISHABLE_KEY,

    // طرق الدفع المتاحة (فعل/عطّل حسب الحاجة)
    methods: ["creditcard", "applepay", "stcpay"],

    // بيانات إضافية تُخزن مع الدفع
    metadata: {
      order_id: orderId,
      locale: document.documentElement.dir === "rtl" ? "ar" : "en",
    },

    // Callbacks
    on_completed: function (payment) {
      // console.log("✅ Payment Completed:", payment);
      setStatus("تم الدفع بنجاح. رقم العملية: " + payment.id, "ok");

      // ⚠️ (اختياري) أرسل payment.id للسيرفر لتأكيد/تخزين العملية:
      /*
      fetch("/api/moyasar/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id })
      })
      .then(r => r.json())
      .then(data => console.log("Server confirm:", data))
      .catch(err => console.error("Confirm failed:", err));
      */
    },

    on_failure: function (error) {
      console.error("❌ Payment Failed:", error);
      // error قد يحتوي fields أو message
      const msg =
        error?.message ||
        error?.detail ||
        "فشل في إتمام عملية الدفع. حاول مرة أخرى.";
      setStatus(msg, "err");
    },

    // (اختياري) تغيّر اللغة/الاتجاه تلقائياً
    language: document.documentElement.dir === "rtl" ? "ar" : "en",
  });

  // console.log("Moyasar initialized with:", {
  //   amountSAR,
  //   amountInHalalas,
  //   description,
  //   orderId,
  // });
}

// 7) هيّئ عند التحميل وأعد التهيئة لو تغيّر المبلغ/الوصف
initMoyasar();
amountInput.addEventListener("change", initMoyasar);
descInput.addEventListener("change", initMoyasar);
