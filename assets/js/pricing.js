import { getPlans } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".mysr-form");

  // ✅ اللغة من localStorage أو افتراضي EN
  const lang = localStorage.getItem("lang") || "en";

  try {
    const plans = await getPlans();

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
                <h3 class="h6 fw-medium lh-1 mb-2 text-primary">
                  ${lang === "ar" ? plan.ar_name : plan.name}
                </h3>
                <div class="plan__price lh-1 mb-40">
                  <span class="h2 mb-0 me-1">${plan.price} ${
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

    // Attach events to buttons بعد ما الـ innerHTML يتعمل
    document.querySelectorAll(".choose-plan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const planId = e.target.getAttribute("data-plan-id");
        const price = e.target.getAttribute("data-price");

        // هنا هتعمل redirect لصفحة الدفع بالـ params كلها
        window.location.href = `moyasser.html?planId=${planId}&amount=${price}`;
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
