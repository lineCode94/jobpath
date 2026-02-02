import { getCvTemplates } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const templateCards = document.querySelectorAll(".template-card");
  if (!templateCards.length) return;

  let selectedTemplateId = null;

  // ===== Load Templates From Backend =====
  async function loadTemplates() {
    try {
      const res = await getCvTemplates();
console.log(res);
      if (!res?.data?.status) {
        throw new Error("Failed to load templates");
      }

      bindBackendData(res.data.data);
    } catch (err) {
      console.error("Templates error:", err);
    }
  }

  // ===== Map Backend Data To Static HTML =====
  function bindBackendData(templates) {
    templateCards.forEach((card) => {
      const templateName = card.dataset.template; // modern | classic | creative | minimal

      const backendTemplate = templates.find((t) => t.name === templateName);

      if (!backendTemplate) return;

      // store real templateId from backend
      card.dataset.templateId = backendTemplate.id;

      // update description from backend (optional but correct)
      const descEl = card.querySelector(".template-description");
      if (descEl && backendTemplate.description) {
        descEl.textContent = backendTemplate.description;
      }
    });

    bindTemplateEvents();
  }

  // ===== Selection Logic =====
  function bindTemplateEvents() {
    templateCards.forEach((card) => {
      card.addEventListener("click", () => {
        templateCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");

        selectedTemplateId = card.dataset.templateId;

        // persist for next steps
        sessionStorage.setItem("selectedTemplateId", selectedTemplateId);
      });
    });
  }

  loadTemplates();
});
