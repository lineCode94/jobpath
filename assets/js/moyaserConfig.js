  
    //   import { getMoyassarKey} from"./assets/js/api.js"
      import { getMoyassarKey } from "./api";
      const userId = localStorage.getItem("userId") || null;
      const urlParams = new URLSearchParams(window.location.search);
      const planId = urlParams.get("planId");
      const amount = urlParams.get("amount");
      const response = await getMoyassarKey();
      console.log(response)
      alert(1)
      const finalPlanId = Number(planId);
      const finalUserId = Number(userId)
      const finalAmount = Number(amount)  ;

      // ✅ اللغة من localStorage
      const lang = localStorage.getItem("lang") || "en";

      // ✅ الوصف حسب اللغة
      const description =
        lang === "ar" ? "طلب اشتراك جديد" : "New Subscription Order";

      Moyasar.init({
        element: ".mysr-form",
        // Amount in the smallest currency unit.
        amount: finalAmount, // مثال: 200 SAR → 20000 Halalas
        currency: "SAR",
        description: description, // ✅ مترجم حسب اللغة
        publishable_api_key: "pk_live_Ab9y7F5oBTHFiFqDQN5eioQ3Kv2j36MhYhXfPJN4",
        callback_url: "https://jobzai.net/thanks.html",
        methods: ["creditcard"],
        manual: false,
        credit_card: {
          save_card: true,
        },
        metadata: {
          userId: finalUserId,
          planId: finalPlanId,
          lang: lang, // ✅ خزنا كمان اللغة في الميتاداتا
        },
        locale: lang === "ar" ? "ar" : "en",
      });
      // alert(lang);
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
          if (lang === "ar") {
            document.querySelectorAll(".mysr-form label").forEach((label) => {
              if (label.textContent.includes("Card Number"))
                label.textContent = "رقم البطاقة";
              if (label.textContent.includes("Expiry Date"))
                label.textContent = "تاريخ الانتهاء";
              if (label.textContent.includes("CVV"))
                label.textContent = "رمز التحقق (CVV)";
            });

            // زر الدفع
            const btn = document.querySelector(".mysr-form button");
            if (btn) btn.textContent = "ادفع الآن";
          }
        }, 500); // ✅ نستنى شوية لحد ما الفورم يترندر
      });
 