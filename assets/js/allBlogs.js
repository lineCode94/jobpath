import { getAllBlogs } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const blogContainer = document.querySelector(".row.g-30");
  const lang = localStorage.getItem("lang") || "en";

  if (!blogContainer) return;

  try {
    const res = await getAllBlogs();
    const blogs = res.data?.blogs || [];

    if (blogs.length > 0) {
      blogContainer.innerHTML = "";

      blogs.forEach((blog) => {
        const title = lang === "ar" ? blog.arabic_title : blog.title;
        const content = lang === "ar" ? blog.arabic_content : blog.content;
        const publishedAt = new Date(blog.publishedAt);
        const formattedDate =
          lang === "ar"
            ? publishedAt.toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : publishedAt.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
const readMoreText = lang === "ar" ? "اقرأ المزيد" : "Read More";
        const blogHTML = `
          <div class="col-lg-12 col-xl-6">
            <div class="rts__single__blog blog__style__four rounded-0">
              <a href="blog-details.html?blogId=${
                blog.blogId
              }" class="blog__img">
                <img src="assets/img/pages/blog-1/${
                  (blog.blogId % 6) + 1
                }.webp" class="mb-2 rounded-0" alt="blog">
              </a>
              <div class="blog__meta">
                <div class="blog__meta__info d-flex gap-2 gap-lg-3 my-3 flex-wrap">
                  <span class="d-flex gap-1 align-items-center"> 
                    <img class="svg" src="assets/img/icon/calender.svg" alt=""> 
                    <span data-en="${formattedDate}" data-ar="${formattedDate}">${formattedDate}</span>
                  </span>
                  <a href="#" class="d-flex gap-1 align-items-center"> 
                    <img class="svg" src="assets/img/icon/user.svg" alt=""> 
                    <span data-en="Jon Adom" data-ar="جون آدم">Jon Adom</span>
                  </a>
                </div>
                <a href="blog-details.html?blogId=${
                  blog.blogId
                }" class="h6 fw-semibold"
                   data-en="${blog.title}"
                   data-ar="${blog.arabic_title}">
                   ${title}
                </a>
             <a href="blog-details.html?blogId=${
               blog.blogId
             }" class="readmore__btn d-flex mt-3 gap-2 align-items-center"
           data-en="Read More"
           data-ar="اقرأ المزيد">
           ${readMoreText} <i class="fa-light fa-arrow-right"></i>
        </a>

              </div>
            </div>
          </div>
        `;

        blogContainer.insertAdjacentHTML("beforeend", blogHTML);
      });
    } else {
      blogContainer.innerHTML = `<p data-en="No blogs found" data-ar="لا توجد مدونات">No blogs found</p>`;
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    blogContainer.innerHTML = `<p data-en="Failed to load blogs" data-ar="فشل تحميل المدونات">Failed to load blogs</p>`;
  }
});
