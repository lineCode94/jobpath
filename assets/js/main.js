/*=== Javascript function indexing ===*/
import { loginUser, logoutUser } from "./api.js";
(function ($) {
  "use strict";
  let device_width = window.innerWidth;

  var rtsJs = {
    m: function (e) {
      rtsJs.d();
      rtsJs.methods();
    },
    d: function (e) {
      (this._window = $(window)),
        (this._document = $(document)),
        (this._body = $("body")),
        (this._html = $("html"));
    },
    methods: function (e) {
      rtsJs.StickyHeader();
      rtsJs.swiperActivation();
      rtsJs.counterUp();
      rtsJs.niceSelect();
      rtsJs.pricingToggle();
      rtsJs.svgInject();
      rtsJs.mobileMenu();
      rtsJs.WowJs();
      rtsJs.preloader();
      rtsJs.activeButton();
      rtsJs.chartJs();
      rtsJs.backToTop();
    },
    // sticky Header
    StickyHeader: function () {
      $(window).on("scroll", function () {
        var ScrollBarPostion = $(window).scrollTop();
        if (ScrollBarPostion > 100) {
          $(".rts__header").addClass("sticky");
        } else {
          $(".rts__header").removeClass("sticky");
        }
      });
    },

    swiperActivation: function () {
      $(function () {
        // initialize swipers with default and custom options
        initSwipers(".swiper-data", {
          spaceBetween: 30,
          slidesPerView: 2,
          loop: true,
        });
        // utility function to initialize swiper
        // s
        function initSwipers(selector, defaults) {
          const swipers = document.querySelectorAll(selector);
          swipers.forEach((swiper) => {
            const optionsData = swiper.dataset.swiper
              ? JSON.parse(swiper.dataset.swiper)
              : {};
            const options = Object.assign({}, defaults, optionsData);
            new Swiper(swiper, options);
            options.direction =
              document.documentElement.getAttribute("dir") === "rtl"
                ? "rtl"
                : "ltr";
          });
        }
      });
      // explorer slider
      const isRTL = document.documentElement.dir === "rtl";

      var swiper = new Swiper(".rts__testimonial__four", {
        slidesPerView: 1,
        loop: true,
        autoplay: {
          delay: 5000,
        },
        navigation: {
          nextEl: isRTL ? ".rts__slide__prev" : ".rts__slide__next",
          prevEl: isRTL ? ".rts__slide__next" : ".rts__slide__prev",
        },
        rtl: document.documentElement.getAttribute("dir") === "rtl",
      });
    },
    counterUp: function () {
      try {
        $(".counter").counterUp({
          delay: 10,
          time: 2000,
        });
      } catch (error) {
        console.log("Counterup not declared");
      }
    },
    niceSelect: function (e) {
      $(document).ready(function () {
        $(".select-nice").niceSelect();
      });
    },
    pricingToggle: function () {
      $(document).ready(function () {
        $(".pricing__toogle").change(function () {
          if ($(this).is(":checked")) {
            $(".monthly__pricing").removeClass("active");
            $(".yearly__pricing").addClass("active");
          } else {
            $(".monthly__pricing").addClass("active");
            $(".yearly__pricing").removeClass("active");
          }
        });
      });
      // radio pricing check box
      $(document).ready(function () {
        // Listen for clicks on the radio buttons
        $('input[name="package"]').on("change", function () {
          if ($("#package1").is(":checked")) {
            $(".monthly__pricing").removeClass("").addClass("active");
            $(".yearly__pricing").removeClass("active").addClass("hide");
          } else if ($("#package2").is(":checked")) {
            $(".monthly__pricing").removeClass("active").addClass("hide");
            $(".yearly__pricing").removeClass("hide").addClass("active");
          }
        });
      });
    },
    svgInject: function () {
      try {
        SVGInject(document.querySelectorAll("img.svg"));
      } catch (error) {
        console.log("svginject is not declared");
      }
    },
    mobileMenu: function () {
      try {
        $("#offcanvas__menu").meanmenu({
          meanMenuContainer: ".offcanvas__menu",
          meanScreenWidth: "991",
          meanExpand: ["+"],
        });
      } catch (error) {
        console.log("Mobile Menu Not loaded");
      }
    },
    WowJs: function () {
      new WOW().init();
    },
    preloader: function () {
      window.addEventListener("load", function () {
        document.querySelector("body").classList.add("loaded");
      });
    },
    activeButton: function () {
      $(document).ready(function () {
        const currentPath = window.location.pathname.split("/").pop();
        const navLinks = document.querySelectorAll(".dash__menu .nav-link");

        navLinks.forEach((link) => {
          const linkPath = link.getAttribute("href").split("/").pop();

          if (linkPath === currentPath) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      });

      // active button
      $(document).ready(function () {
        $(".nav-link").on("click", function () {
          $(".nav-link").removeClass("active");
          $(this).addClass("active");
        });
      });

      // dashboard menu show
      $(document).ready(function () {
        $(".sidebar__action").on("click", function () {
          $(".dashboard__left").addClass("active");
        });

        $(document).on("click", function (event) {
          const $dashboardLeft = $(".dashboard__left");
          const $sidebarAction = $(".sidebar__action");

          if (
            !$dashboardLeft.is(event.target) &&
            !$dashboardLeft.has(event.target).length &&
            !$sidebarAction.is(event.target) &&
            !$sidebarAction.has(event.target).length
          ) {
            $dashboardLeft.removeClass("active");
          }
        });
      });
    },
    chartJs: function () {
      $(document).ready(function () {
        try {
          var chartOne = document.querySelector("#spline__chart__candidate");
          if (chartOne !== null) {
            var options__candidate = {
              series: [
                {
                  name: "candidate",
                  data: [100, 200, 300, 400, 500, 800, 700, 800, 1000],
                },
              ],
              chart: {
                height: 420,
                type: "area",
                toolbar: {
                  show: false,
                },
              },
              colors: ["#34A853"],
              grid: {
                show: true,
                borderColor: "#7D8087",
                strokeDashArray: 3,
                position: "back",
                yaxis: {
                  lines: {
                    show: true,
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                curve: "smooth",
              },
              xaxis: {
                type: "day",
                categories: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                labels: {
                  show: true,
                  offsetY: 2,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              tooltip: {
                enabled: true,
                x: {
                  format: "dd/MM/yy",
                },
              },
              fill: {
                type: "gradient",
                gradient: {
                  opacityFrom: 1,
                  opacityTo: 0,
                  stops: [0, 46, 100],
                  type: "vertical",
                  colorStops: [
                    {
                      offset: 0,
                      color: "#FEF2EB",
                      opacity: 1,
                    },
                    {
                      offset: 50,
                      color: "#F1F1F1",
                      opacity: 0.5,
                    },
                    {
                      offset: 100,
                      color: "#E4E0EA",
                      opacity: 0.9,
                    },
                  ],
                },
              },
              responsive: [
                {
                  breakpoint: 1800,
                  options: {
                    chart: {
                      height: "550",
                      width: "100%",
                    },
                  },
                },
                {
                  breakpoint: 1400,
                  options: {
                    chart: {
                      height: "400",
                      width: "100%",
                    },
                  },
                },
              ],
            };
            var chart = new ApexCharts(chartOne, options__candidate);
            chart.render();
          }
        } catch (error) {
          console.log("chartjs is not declared");
        }
      });

      // chart monthly
      $(document).ready(function () {
        try {
          var chartTwo = document.querySelector(
            "#spline__chart__candidate__monthly"
          );
          if (chartTwo !== null) {
            var options__candidate__monthly = {
              series: [
                {
                  name: "candidate",
                  data: [100, 200, 300, 400, 500, 800, 700, 800, 1000],
                },
              ],
              chart: {
                height: 420,
                type: "area",
                toolbar: {
                  show: false,
                },
              },
              colors: ["#34A853"],
              grid: {
                show: true,
                borderColor: "#7D8087",
                strokeDashArray: 3,
                position: "back",
                yaxis: {
                  lines: {
                    show: true,
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                curve: "smooth",
              },
              xaxis: {
                type: "day",
                categories: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                labels: {
                  show: true,
                  offsetY: 2,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              tooltip: {
                enabled: true,
                x: {
                  format: "dd/MM/yy",
                },
              },
              fill: {
                type: "gradient",
                gradient: {
                  opacityFrom: 1,
                  opacityTo: 0,
                  stops: [0, 46, 100],
                  type: "vertical",
                  colorStops: [
                    {
                      offset: 0,
                      color: "#FEF2EB",
                      opacity: 1,
                    },
                    {
                      offset: 50,
                      color: "#F1F1F1",
                      opacity: 0.5,
                    },
                    {
                      offset: 100,
                      color: "#E4E0EA",
                      opacity: 0.9,
                    },
                  ],
                },
              },
              responsive: [
                {
                  breakpoint: 1800,
                  options: {
                    chart: {
                      height: "550",
                      width: "100%",
                    },
                  },
                },
                {
                  breakpoint: 1400,
                  options: {
                    chart: {
                      height: "400",
                      width: "100%",
                    },
                  },
                },
              ],
            };
            var chart = new ApexCharts(chartTwo, options__candidate__monthly);
            chart.render();
          }
        } catch (error) {
          console.log("spline__chart__candidate__monthly not declared");
        }
      });

      $(document).ready(function () {
        try {
          var chartThree = document.querySelector("#chart__candidate__yearly");
          if (chartThree !== null) {
            var options__candidate__yearly = {
              series: [
                {
                  name: "candidate",
                  data: [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
                },
              ],
              chart: {
                height: 420,
                type: "area",
                toolbar: {
                  show: false,
                },
              },
              colors: ["#34A853"],
              grid: {
                show: true,
                borderColor: "#7D8087",
                strokeDashArray: 3,
                position: "back",
                yaxis: {
                  lines: {
                    show: true,
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                curve: "smooth",
              },
              xaxis: {
                type: "year",
                categories: [
                  "2000",
                  "2001",
                  "2002",
                  "2003",
                  "2004",
                  "2005",
                  "2006",
                  "2007",
                  "2008",
                ],
                labels: {
                  show: true,
                  offsetY: 2,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    cssClass: "apexcharts-xaxis-label",
                  },
                },
              },
              tooltip: {
                enabled: true,
                x: {
                  format: "dd/MM/yy",
                },
              },
              fill: {
                type: "gradient",
                gradient: {
                  opacityFrom: 1,
                  opacityTo: 0,
                  stops: [0, 46, 100],
                  type: "vertical",
                  colorStops: [
                    {
                      offset: 0,
                      color: "#FEF2EB",
                      opacity: 1,
                    },
                    {
                      offset: 50,
                      color: "#F1F1F1",
                      opacity: 0.5,
                    },
                    {
                      offset: 100,
                      color: "#E4E0EA",
                      opacity: 0.9,
                    },
                  ],
                },
              },
              responsive: [
                {
                  breakpoint: 1800,
                  options: {
                    chart: {
                      height: "550",
                      width: "100%",
                    },
                  },
                },
                {
                  breakpoint: 1400,
                  options: {
                    chart: {
                      height: "400",
                      width: "100%",
                    },
                  },
                },
              ],
            };
            var chart = new ApexCharts(chartThree, options__candidate__yearly);
            chart.render();
          }
        } catch (error) {
          console.log("spline__chart__candidate__yearly not declared");
        }
      });
    },

    backToTop: function () {
      $(document).ready(function () {
        var backButton = $("#rts-back-to-top");
        $(window).scroll(function () {
          if ($(this).scrollTop() > 100) {
            backButton.addClass("show");
          } else {
            backButton.removeClass("show");
          }
        });
        backButton.on("click", function () {
          $("html, body").animate(
            {
              scrollTop: 0,
            },
            1000
          );
        });
      });
    },
  };
  rtsJs.m();
})(jQuery, window);
// new js edits
// login logout functionality
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const data = await loginUser(phone, password);

        if (data.token) {
          localStorage.setItem("authToken", data.token); // ✅統一 الاسم
        }
        updateUI();

        window.location.href = "index.html";
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      try {
        localStorage.removeItem("authToken"); // ✅ امسح التوكين
        alert("Logged out successfully!");
        location.reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    });
  }
  function updateUI() {
    const token = localStorage.getItem("authToken");

    if (token) {
      // Login hidden
      if (loginBtn) loginBtn.classList.add("log-toggle");
      // Logout visible
      if (logoutBtn) logoutBtn.classList.remove("log-toggle");
      // Profile visible
      if (profileMenu) profileMenu.style.display = "block";
    } else {
      // Login visible
      if (loginBtn) loginBtn.classList.remove("log-toggle");
      // Logout hidden
      if (logoutBtn) logoutBtn.classList.add("log-toggle");
      // Profile hidden
      if (profileMenu) profileMenu.style.display = "none";
    }
  }

  // ===== عند فتح الصفحة شغل check =====
  updateUI();
});

// ✅ check لو فيه توكين
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  const profileMenu = document.getElementById("profileMenu");

  if (token && profileMenu) {
    profileMenu.style.display = "block";
  }
});

//end login&logout functionality
// header and footer layout fetch

// end header and footer layout fetch
// language switcher
// تنفيذ includes الأول

document.addEventListener("DOMContentLoaded", async function () {
  const includes = document.querySelectorAll("[data-include]");

  // تحميل ملفات الـ includes
  await Promise.all(
    Array.from(includes).map(async (el) => {
      const file = el.getAttribute("data-include");
      const res = await fetch(file);
      const html = await res.text();
      el.innerHTML = html;
    })
  );

  // بعد التحميل، شغّل اللانج سويتشر
  initLangSwitcher();
});

// تحميل ملف RTL
function loadRtlStylesheet() {
  if (document.getElementById("rtl-css")) return;
  const link = document.createElement("link");
  link.id = "rtl-css";
  link.rel = "stylesheet";
  link.href = "assets/css/rtl.css";
  document.head.appendChild(link);
}
function removeRtlStylesheet() {
  const link = document.getElementById("rtl-css");
  if (link) link.remove();
}

// السويتشر
function initLangSwitcher() {
  let currentLang = localStorage.getItem("lang") || "en";
  const langBtn = document.getElementById("lang-btn");

  // ضبط الاتجاه من أول تحميل
  if (currentLang === "ar") {
    loadRtlStylesheet();
    document.body.style.direction = "rtl";
  } else {
    removeRtlStylesheet();
    document.body.style.direction = "ltr";
  }

  function updateLanguage() {
    document.documentElement.lang = currentLang;
    langBtn.textContent = currentLang === "en" ? "Arabic" : "الانجليزية";

    // ترجم العناصر
    const translatableElements = document.querySelectorAll("[data-en]");
    translatableElements.forEach((el) => {
      const newText = el.getAttribute(`data-${currentLang}`);
      if (newText !== null) {
        if (el.placeholder !== undefined && el.placeholder !== "") {
          el.placeholder = newText; // ✅ دعم placeholder
        } else {
          el.textContent = newText;
        }
      }
    });
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "ar" : "en";
      localStorage.setItem("lang", currentLang);

      if (currentLang === "ar") {
        loadRtlStylesheet();
        document.body.style.direction = "rtl";
      } else {
        removeRtlStylesheet();
        document.body.style.direction = "ltr";
      }

      updateLanguage();
      window.location.reload();
    });
  }

  updateLanguage(); // تشغيل أول مرة
}

// مثال: تفعيل اللغة العربية
// switchLanguage('ar');
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  const profileMenu = document.getElementById("profileMenu");

  if (token && profileMenu) {
    profileMenu.style.display = "block"; // ✅ يظهر فقط لو فيه توكين
  }
});
