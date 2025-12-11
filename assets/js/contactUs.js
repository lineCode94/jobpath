// contactUs.js

// Initialize EmailJS (replace with your correct Public Key)
emailjs.init("YOUR_CORRECT_PUBLIC_KEY");

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector(".job__contact form");

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("cemail").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      Toastify({
        text: "Please fill in all fields!",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#FF6B6B",
        stopOnFocus: true,
      }).showToast();
      return;
    }

    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
    };

    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams).then(
      (response) => {
        Toastify({
          text: "Your message has been sent successfully!",
          duration: 3000,
          gravity: "top",
          position: "right",
          backgroundColor: "#4CAF50",
          stopOnFocus: true,
        }).showToast();
        contactForm.reset();
      },
      (error) => {
        Toastify({
          text: "Oops! Something went wrong. Try again later.",
          duration: 3000,
          gravity: "top",
          position: "right",
          backgroundColor: "#FF6B6B",
          stopOnFocus: true,
        }).showToast();
        console.error("EmailJS Error:", error);
      }
    );
  });
});
