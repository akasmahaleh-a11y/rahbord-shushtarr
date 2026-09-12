const SUPABASE_URL =
    "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

let supabaseClient = null;
let currentUserProfile = null;
let selectedArea = null;


// ===============================
// اتصال به Supabase
// ===============================

function initSupabase() {
    if (!window.supabase) {
        console.error("Supabase پیدا نشد");
        return false;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    console.log("اتصال به Supabase برقرار شد");
    return true;
}


// ===============================
// ورود
// ===============================

async function login() {

    const email =
        document.getElementById("email")?.value.trim();

    const password =
        document.getElementById("password")?.value;

    const errorBox =
        document.getElementById("loginError");

    if (errorBox) {
        errorBox.textContent = "";
    }

    if (!email || !password) {
        if (errorBox) {
            errorBox.textContent =
                "ایمیل و رمز عبور را وارد کنید.";
        }
        return;
    }

    if (!supabaseClient) {
        if (!initSupabase()) {
            return;
        }
    }

    const button =
        document.getElementById("loginButton");

    if (button) {
        button.disabled = true;
        button.textContent = "در حال ورود...";
    }

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            console.error(error);

            if (errorBox) {
                errorBox.textContent =
                    "ایمیل یا رمز عبور اشتباه است.";
            }

            return;
        }

        await loadUserProfile();

        document.getElementById("loginPage").style.display =
            "none";

        document.getElementById("dashboard").style.display =
            "block";

        await loadDashboard();
        await loadAreas();

    } catch (error) {

        console.error(error);

        if (errorBox) {
            errorBox.textContent =
                "خطایی هنگام ورود رخ داد.";
        }

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "ورود به سامانه";
        }
    }
}


// ===============================
// دریافت پروفایل کاربر
// ===============================

async function loadUserProfile() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (error) {
        console.error("خطای پروفایل:", error);
        return;
    }

    currentUserProfile = data;
    window.currentUserProfile = data;

    document
        .querySelectorAll(".user-badge")
        .forEach(element => {
            element.textContent =
                data.full_name || "کاربر";
        });

    console.log("کاربر:", data);
}


// ===============================
// دریافت حوزه‌ها از دیتابیس
// ===============================

async function loadAreas() {

    if (!supabaseClient) {
        return;
    }

    console.log("در حال دریافت حوزه‌ها...");

    const {
        data,
        error
    } =
        await supabaseClient
            .from("areas")
            .select("*")
            .order("id");

    if (error) {
        console.error(
            "خطا در دریافت حوزه‌ها:",
            error
        );
        return;
    }

    console.log("حوزه‌های دریافت شده:", data);

    const container =
        document.getElementById("areasContainer");

    if (!container) {
        console.warn(
            "areasContainer در صفحه پیدا نشد."
        );
        return;
    }

    container.innerHTML = "";

    if (!data || data.length === 0) {

        container.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
            ">
                هنوز حوزه‌ای ثبت نشده است.
            </div>
        `;

        return;
    }

    data.forEach(area => {

        const card =
            document.createElement("div");

        card.className = "area-card";

        card.innerHTML = `
            <div class="area-icon">🏢</div>

            <div class="area-info">
                <h3>${area.name}</h3>
                <p>حوزه عملیاتی</p>
            </div>

            <button
                class="area-select-btn"
                onclick="selectArea(${area.id})"
            >
                انتخاب حوزه
            </button>
        `;

        container.appendChild(card);
    });
}


// ===============================
// انتخاب حوزه
// ===============================

async function selectArea(areaId) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("areas")
            .select("*")
            .eq("id", areaId)
            .single();

    if (error) {
        console.error(
            "خطا در انتخاب حوزه:",
            error
        );
        return;
    }

    selectedArea = data;

    console.log(
        "حوزه انتخاب شده:",
        selectedArea
    );

    alert(
        "حوزه انتخاب شد:\n" +
        selectedArea.name
    );

    window.selectedArea = selectedArea;
}


// ===============================
// داشبورد
// ===============================

async function loadDashboard() {

    if (!supabaseClient) {
        return;
    }

    const {
        count,
        error
    } =
        await supabaseClient
            .from("reports")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("status", "approved");

    if (error) {
        console.error(
            "خطای آمار گزارش‌ها:",
            error
        );
        return;
    }

    updateNumber(
        "totalReports",
        count || 0
    );
}


// ===============================
// نمایش عدد
// ===============================

function updateNumber(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ===============================
// نمایش صفحات
// ===============================

function showPage(pageId, button) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.style.display = "none";
        });

    const page =
        document.getElementById(pageId);

    if (page) {
        page.style.display = "block";
    }

    document
        .querySelectorAll(".menu-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }

    const titles = {
        dashboardPage: "داشبورد",
        areasPage: "انتخاب حوزه",
        reportsPage: "گزارش‌ها",
        settingsPage: "تنظیمات"
    };

    const title =
        document.getElementById("pageTitle");

    if (title) {
        title.textContent =
            titles[pageId] ||
            "سامانه راهبرد شوشتر";
    }

    if (pageId === "areasPage") {
        loadAreas();
    }
}


// ===============================
// خروج
// ===============================

async function logout() {

    await supabaseClient.auth.signOut();

    currentUserProfile = null;
    selectedArea = null;

    document.getElementById("dashboard").style.display =
        "none";

    document.getElementById("loginPage").style.display =
        "flex";
}


// ===============================
// منوی موبایل
// ===============================

function toggleMenu() {

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}


// ===============================
// بررسی نشست قبلی
// ===============================

async function checkSession() {

    const {
        data
    } =
        await supabaseClient.auth.getSession();

    if (data.session) {

        await loadUserProfile();

        document.getElementById("loginPage").style.display =
            "none";

        document.getElementById("dashboard").style.display =
            "block";

        await loadDashboard();
        await loadAreas();
    }
}


// ===============================
// شروع برنامه
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "سامانه راهبرد شوشتر اجرا شد"
        );

        if (!initSupabase()) {
            return;
        }

        await checkSession();
    }
);
