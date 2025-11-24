import { getPlans } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".mysr-form");
  const lang = localStorage.getItem("lang") || "en";

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

  try {
    const data = await getPlans();
    const plans = data.data.plansWithAmount;
    console.log(plans);

    if (!plans || plans.length === 0) {
      container.innerHTML = `<p class="text-center">${
        lang === "en" ? "No plans available." : "لا توجد باقات متاحة"
      }</p>`;
      return;
    }
  

    container.innerHTML = `
      <div class="row justify-content-center">
 
        ${plans
          .map(
            (plan) => `
 

          <div class="col-md-6 col-lg-4 mb-4">
            <div class="rts__pricing__box style-1 rounded-3 h-100">
              <div class="py-4">
                <h3 style="text-transform: capitalize;" class="h6 fw-medium lh-1  mb-2 text-primary">
                  ${lang === "ar" ? plan.ar_name : plan.name}
                </h3>
                <div class="plan__price lh-1 mb-40">
                  <span class="h2 mb-0 me-1">${plan.price / 100}  ${
              plan.currency
            }</span>
                  <small class="text-muted d-block">
                    ${lang === "en" ? "Duration" : "المدة"}: ${plan.duration} 
                    ${lang === "en" ? "days" : "يوم"}
                  </small>
                </div>
                ${
                  plan.isTrial
                    ? `<span class="badge bg-success">${
                        lang === "en" ? "Trial" : "تجريبي"
                      }</span>`
                    : ""
                }
              </div>
              <div class="pricing-footer p-3">
                <button 
                  class="rts__btn pricing__btn choose-plan-btn no__fill__btn mt-40" 
                  data-plan-id="${plan.id}"
                  data-price="${plan.price}"
                  data-plan-name="${lang === "ar" ? plan.ar_name : plan.name}"
                >
                  ${lang === "en" ? "Choose Plan" : "اختر الباقة"}
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    // ✅ Attach events after rendering
    document.querySelectorAll(".choose-plan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const token = localStorage.getItem("authToken");

        if (!token) {
          // 🔒 User not logged in
          showToast(
            lang === "en"
              ? "⚠️ Please log in before choosing a plan."
              : "⚠️ يرجى تسجيل الدخول قبل اختيار الباقة.",
            "warning"
          );

          // Try to open login modal if it exists
          const loginModalEl = document.getElementById("loginModal");
          if (loginModalEl) {
            const loginModal = new bootstrap.Modal(loginModalEl);
            loginModal.show();
          }

          return;
        }

        // ✅ User logged in → go to payment page
        const planId = e.target.getAttribute("data-plan-id");
        const price = e.target.getAttribute("data-price");
        const planName = e.target.getAttribute("data-plan-name");

        window.location.href = `payment-choose.html?planId=${planId}&amount=${price}&planName=${planName}`;
      });
    });
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    container.innerHTML = `<p class="text-center text-danger">${
      lang === "en"
        ? "Failed to load plans. Please try again."
        : "فشل تحميل الباقات. برجاء المحاولة لاحقًا"
    }</p>`;
  }
});
