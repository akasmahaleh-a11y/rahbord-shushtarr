// ==========================================
// سامانه راهبرد شوشتر
// اتصال واقعی به Supabase
// ==========================================

const SUPABASE_URL =
  "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

let supabaseClient = null;


// ==========================================
// راه‌اندازی Supabase
// ==========================================

function loadSupabase() {
  return new Promise((resolve, reject) => {

    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = resolve;

    script.onerror = () => {
      reject(new Error("خطا در بارگذاری Supabase"));
    };

    document.head.appendChild(script);
  });
}


async function initSupabase() {

  try {

    await loadSupabase();

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    console.log("✅ اتصال به Supabase برقرار شد");

    return true;

  } catch (error) {

    console.error(
      "❌ خطا در اتصال Supabase:",
      error
    );

    return false;
  }
}


// ==========================================
// ورود کاربر
// ==========================================

async function login() {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  const errorBox =
    document.getElementById("loginError");


  errorBox.textContent = "";


  if (!email || !password) {

    errorBox.textContent =
      "ایمیل و رمز عبور را وارد کنید.";

    return;
  }


  try {

    if (!supabaseClient) {

      const connected =
        await initSupabase();

      if (!connected) {

        errorBox.textContent =
          "اتصال به سامانه برقرار نشد.";

        return;
      }
    }


    const { data, error } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      console.error(
        "Login error:",
        error
      );

      errorBox.textContent =
        "ایمیل یا رمز عبور اشتباه است.";

      return;
    }


    if (!data.user) {

      errorBox.textContent =
        "ورود انجام نشد.";

      return;
    }


    console.log(
      "✅ ورود موفق:",
      data.user.email
    );


    await loadUserProfile();


    const loginPage =
      document.getElementById("loginPage");

    const dashboard =
      document.getElementById("dashboard");


    if (loginPage) {
      loginPage.style.display = "none";
    }


    if (dashboard) {
      dashboard.style.display = "flex";
    }


    await loadDashboard();


  } catch (error) {

    console.error(
      "Login exception:",
      error
    );

    errorBox.textContent =
      "خطایی هنگام ورود رخ داد.";
  }
}


// ==========================================
// دریافت پروفایل کاربر
// ==========================================

async function loadUserProfile() {

  try {

    const {
      data: { user },
      error: userError
    } =
      await supabaseClient.auth.getUser();


    if (userError || !user) {

      console.error(
        "User error:",
        userError
      );

      return null;
    }


    const { data, error } =
      await supabaseClient

        .from("user_profiles")

        .select("*")

        .eq("id", user.id)

        .single();


    if (error) {

      console.error(
        "Profile error:",
        error
      );

      return null;
    }


    window.currentUserProfile =
      data;


    console.log(
      "👤 پروفایل:",
      data
    );


    // نمایش نام کاربر
    const badges =
      document.querySelectorAll(".user-badge");


    badges.forEach((element) => {

      element.textContent =
        data.full_name || "کاربر";

    });


    return data;


  } catch (error) {

    console.error(
      "Profile exception:",
      error
    );

    return null;
  }
}


// ==========================================
// داشبورد
// ==========================================

async function loadDashboard() {

  try {

    if (!supabaseClient) {
      return;
    }


    // تعداد کل گزارش‌های تأیید شده
    const {
      count: totalReports,
      error: totalError
    } =
      await supabaseClient

        .from("reports")

        .select("*", {
          count: "exact",
          head: true
        })

        .eq("status", "approved");


    if (totalError) {

      console.error(
        "Total reports error:",
        totalError
      );
    }


    updateDashboardNumber(
      "totalReports",
      totalReports || 0
    );


    // تاریخ امروز
    const today =
      new Date()
        .toISOString()
        .split("T")[0];


    // گزارش‌های امروز
    const {
      count: todayReports,
      error: todayError
    } =
      await supabaseClient

        .from("reports")

        .select("*", {
          count: "exact",
          head: true
        })

        .eq("status", "approved")

        .eq("report_date", today);


    if (todayError) {

      console.error(
        "Today reports error:",
        todayError
      );
    }


    updateDashboardNumber(
      "todayReports",
      todayReports || 0
    );


    // گزارش‌های ماه جاری
    const now = new Date();

    const firstDay =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];


    const {
      count: monthReports,
      error: monthError
    } =
      await supabaseClient

        .from("reports")

        .select("*", {
          count: "exact",
          head: true
        })

        .eq("status", "approved")

        .gte(
          "report_date",
          firstDay
        );


    if (monthError) {

      console.error(
        "Month reports error:",
        monthError
      );
    }


    updateDashboardNumber(
      "monthReports",
      monthReports || 0
    );


    // تعداد عکس‌های گزارش‌ها
    const {
      count: photoCount,
      error: photoError
    } =
      await supabaseClient

        .from("report_photos")

        .select("*", {
          count: "exact",
          head: true
        });


    if (photoError) {

      console.error(
        "Photo count error:",
        photoError
      );
    }


    updateDashboardNumber(
      "photoCount",
      photoCount || 0
    );


  } catch (error) {

    console.error(
      "Dashboard exception:",
      error
    );
  }
}


// ==========================================
// تغییر عدد کارت داشبورد
// ==========================================

function updateDashboardNumber(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }
}


// ==========================================
// خروج
// ==========================================

async function logout() {

  try {

    if (supabaseClient) {

      await supabaseClient.auth.signOut();

    }


    window.currentUserProfile =
      null;


    const dashboard =
      document.getElementById("dashboard");

    const loginPage =
      document.getElementById("loginPage");


    if (dashboard) {

      dashboard.style.display =
        "none";

    }


    if (loginPage) {

      loginPage.style.display =
        "flex";

    }


    const password =
      document.getElementById("password");


    if (password) {

      password.value = "";

    }


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }
}


// ==========================================
// بررسی ورود قبلی
// ==========================================

async function checkSession() {

  try {

    if (!supabaseClient) {

      const connected =
        await initSupabase();

      if (!connected) {
        return;
      }
    }


    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();


    if (session) {

      console.log(
        "✅ نشست قبلی پیدا شد"
      );


      await loadUserProfile();


      const loginPage =
        document.getElementById("loginPage");

      const dashboard =
        document.getElementById("dashboard");


      if (loginPage) {

        loginPage.style.display =
          "none";

      }


      if (dashboard) {

        dashboard.style.display =
          "flex";

      }


      await loadDashboard();

    } else {

      console.log(
        "ℹ️ کاربر وارد نشده است"
      );

    }


  } catch (error) {

    console.error(
      "Session error:",
      error
    );
  }
}


// ==========================================
// تغییر صفحات
// ==========================================

function showPage(
  pageId,
  button
) {

  const pages =
    document.querySelectorAll(
      ".page"
    );


  pages.forEach((page) => {

    page.style.display =
      "none";

  });


  const selectedPage =
    document.getElementById(pageId);


  if (selectedPage) {

    selectedPage.style.display =
      "block";

  }


  // عنوان صفحه
  const pageTitle =
    document.getElementById(
      "pageTitle"
    );


  if (pageTitle) {

    const titles = {

      dashboardPage:
        "داشبورد",

      areasPage:
        "انتخاب حوزه",

      reportsPage:
        "گزارش‌ها",

      settingsPage:
        "تنظیمات"

    };


    pageTitle.textContent =
      titles[pageId] ||
      "سامانه راهبرد شوشتر";

  }


  // بستن منوی موبایل
  const sidebar =
    document.getElementById(
      "sidebar"
    );


  if (
    sidebar &&
    window.innerWidth <= 900
  ) {

    sidebar.classList.remove(
      "open"
    );

  }
}


// ==========================================
// منوی موبایل
// ==========================================

function toggleMenu() {

  const sidebar =
    document.getElementById(
      "sidebar"
    );


  if (sidebar) {

    sidebar.classList.toggle(
      "open"
    );

  }
}


// ==========================================
// اجرای اولیه سایت
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 سامانه راهبرد شوشتر"
    );


    await initSupabase();


    await checkSession();

  }
);
