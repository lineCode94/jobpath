document.addEventListener("DOMContentLoaded", async () => {
  // ---------- Get params from URL ----------
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("planId");
  const planPrice = urlParams.get("amount");
  const finalPrice = planPrice ;
  const planName = urlParams.get("planName") || "Pro Plan";
  const userId = localStorage.getItem("userId") || null;
  const lang = localStorage.getItem("lang") || "en";

  // ---------- Update UI ----------
  const planNameEl = document.getElementById("planName");
  const planPriceEl = document.getElementById("planPrice");

  if (planNameEl && planPriceEl) {
    planNameEl.textContent = planName || `No Plan`;
    planPriceEl.textContent = finalPrice
      ? `SAR ${Number(finalPrice).toLocaleString()}`
      : "No Price Found";
  }

  // ---------- Payment selection ----------
  const methods = document.querySelectorAll(".method");
  let selectedMethod = null;

  methods.forEach((method) => {
    method.addEventListener("click", async () => {
      // reset active
      methods.forEach((m) => m.classList.remove("active"));
      method.classList.add("active");

      selectedMethod = method.dataset.method;

      const formsContainer = document.getElementById("paymentForms");
      formsContainer.style.display = "block";

      // hide all forms first
      document.querySelectorAll(".payment-form").forEach((f) => {
        f.style.display = "none";
        f.style.maxHeight = null;
        f.style.transition = null;
      });

      if (selectedMethod === "apple") {
        // show Apple Pay placeholder
        const appleForm = document.getElementById("appleForm");
        appleForm.style.display = "block";
        appleForm.style.overflow = "hidden";
        appleForm.style.maxHeight = "0px";
        appleForm.style.transition = "max-height 0.5s ease";
        appleForm.offsetHeight;
        appleForm.style.maxHeight = appleForm.scrollHeight + "px";
      } else {
        // show Moyasar form
        const moyForm = document.getElementById("moyasarForm");
        moyForm.style.display = "block";
        moyForm.style.overflow = "hidden";
        moyForm.style.maxHeight = "0px";
        moyForm.style.transition = "max-height 0.5s ease";
        moyForm.offsetHeight;
        moyForm.style.maxHeight = moyForm.scrollHeight + "px";

        // 🔥 Initialize Moyasar Payment Form
        import("./assets/js/api.js").then(({ getMoyassarKey }) => {
          getMoyassarKey().then((res) => {
            const finalPlanId = Number(planId);
            const finalUserId = Number(userId);
            const finalAmount = Number(planPrice);

            const description =
              lang === "ar" ? "طلب اشتراك جديد" : "New Subscription Order";

            Moyasar.init({
              element: ".mysr-form",
              amount: finalAmount,
              currency: "SAR",
              description: description,
              publishable_api_key: res?.data?.moyasarPublishKey,
              callback_url: "https://jobzai.net/thanks.html",
              methods: ["creditcard"],
              manual: false,
              credit_card: { save_card: true },
              metadata: {
                userId: finalUserId,
                planId: finalPlanId,
                lang: lang,
              },
              locale: lang === "ar" ? "ar" : "en",
            });

            // Translate labels if Arabic
            if (lang === "ar") {
              setTimeout(() => {
                document
                  .querySelectorAll(".mysr-form label")
                  .forEach((label) => {
                    if (label.textContent.includes("Card Number"))
                      label.textContent = "رقم البطاقة";
                    if (label.textContent.includes("Expiry Date"))
                      label.textContent = "تاريخ الانتهاء";
                    if (label.textContent.includes("CVV"))
                      label.textContent = "رمز التحقق (CVV)";
                  });
                const btn = document.querySelector(".mysr-form button");
                if (btn) btn.textContent = "ادفع الآن";
              }, 500);
            }
          });
        });
      }
    });
  });
});
