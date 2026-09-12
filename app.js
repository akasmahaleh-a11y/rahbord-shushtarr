// ===============================
// اتصال واقعی سامانه راهبرد شوشتر
// ===============================

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabaseClient = null;

// بارگذاری کتابخانه Supabase
function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = resolve;
    script.onerror = () => reject(new Error("خطا در بارگذاری Supabase"));

    document.head.appendChild(script);
  });
}

// راه‌اندازی
async function initSupabase() {
  try {
    await loadSupabase();

    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    console.log("Supabase connected");
  } catch (error) {
    console.error(error);
  }
}

// ورود واقعی
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("loginError");

  errorBox.textContent = "";

  if (!email || !password) {
    errorBox.textContent = "ایمیل و رمز عبور را وارد کنید.";
    return;
  }

  try {
    if (!supabaseClient) {
      await initSupabase();
    }

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      errorBox.textContent = "ایمیل یا رمز عبور اشتباه است.";
      console.error(error);
      return;
    }

    await loadUserProfile();

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";

    await loadDashboard();

  } catch (error) {
    console.error(error);
    errorBox.textContent = "خطا در اتصال به سامانه.";
  }
}

// دریافت پروفایل کاربر
async function loadUserProfile() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile error:", error);
    return;
  }

  console.log("کاربر:", data);

  // نام کاربر
  const badges = document.querySelectorAll(".user-badge");

  badges.forEach(el => {
    el.textContent = data.full_name || "کاربر";
  });

  // ذخیره موقت اطلاعات کاربر برای استفاده داخل سایت
  window.currentUserProfile = data;
}

// داشبورد واقعی
async function loadDashboard() {
  try {
    const { count: totalReports } = await supabaseClient
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const today = new Date().toISOString().split("T")[0];

    const { count: todayReports } = await supabaseClient
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("report_date", today);

    updateDashboardNumber("totalReports", totalReports || 0);
    updateDashboardNumber("todayReports", todayReports || 0);

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// تغییر عدد کارت‌های داشبورد
function updateDashboardNumber(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// خروج واقعی
async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  window.currentUserProfile = null;

  document.getElementById("dashboard").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
}

// بررسی نشست قبلی
async function checkSession() {
  try {
    if (!supabaseClient) {
      await initSupabase();
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
      await loadUserProfile();

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("dashboard").style.display = "flex";

      await loadDashboard();
    }

  } catch (error) {
    console.error("Session error:", error);
  }
}

// شروع برنامه
document.addEventListener("DOMContentLoaded", async () => {
  await initSupabase();
  await checkSession();
});
