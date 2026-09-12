const SUPABASE_URL =
    "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

let supabaseClient = null;
let currentUserProfile = null;


// ===============================
// اتصال به Supabase
// ===============================

function initSupabase() {

    try {

        if (!window.supabase) {
            console.error("Supabase library پیدا نشد.");
            return false;
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("✅ اتصال Supabase برقرار شد");

        return true;

    } catch (error) {

        console.error("❌ خطا در اتصال:", error);

        return false;
    }
}


// ===============================
// ورود
// ===============================

async function login() {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("loginError");
    const loginButton = document.getElementById("loginButton");

    if (!emailInput || !passwordInput) {
        console.error("فیلدهای ورود پیدا نشدند.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

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


    // اتصال

    if (!supabaseClient) {

        const connected = initSupabase();

        if (!connected) {

            if (errorBox) {
                errorBox.textContent =
                    "اتصال به سامانه برقرار نشد.";
            }

            return;
        }
    }


    // حالت در حال ورود

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "در حال ورود...";
    }


    try {

        const result =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        const data = result.data;
        const error = result.error;


        if (error) {

            console.error("❌ Login error:", error);

            if (errorBox) {

                if (
                    error.message &&
                    error.message.toLowerCase().includes("invalid")
                ) {
                    errorBox.textContent =
                        "ایمیل یا رمز عبور اشتباه است.";
                } else {
                    errorBox.textContent =
                        "ورود انجام نشد. دوباره تلاش کنید.";
                }
            }

            return;
        }


        if (!data || !data.user) {

            if (errorBox) {
                errorBox.textContent =
                    "کاربر پیدا نشد.";
            }

            return;
        }


        console.log("✅ ورود موفق:", data.user.email);


        // دریافت پروفایل

        await loadUserProfile();


        // نمایش داشبورد

        const loginPage =
            document.getElementById("loginPage");

        const dashboard =
            document.getElementById("dashboard");


        if (loginPage) {
            loginPage.style.display = "none";
        }

        if (dashboard) {
            dashboard.style.display = "block";
        }


        // بارگذاری داشبورد

        await loadDashboard();


    } catch (error) {

        console.error("❌ خطای ورود:", error);

        if (errorBox) {
            errorBox.textContent =
                "خطایی هنگام ورود رخ داد.";
        }

    } finally {

        if (loginButton) {

            loginButton.disabled = false;
            loginButton.textContent = "ورود به سامانه";
        }
    }
}


// ===============================
// دریافت پروفایل کاربر
// ===============================

async function loadUserProfile() {

    try {

        if (!supabaseClient) {
            return null;
        }


        const {
            data: {
                user
            },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !user) {

            console.error(
                "خطای دریافت کاربر:",
                userError
            );

            return null;
        }


        const {
            data,
            error
        } = await supabaseClient
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();


        if (error) {

            console.error(
                "خطای پروفایل:",
                error
            );

            return null;
        }


        currentUserProfile = data;

        window.currentUserProfile = data;


        console.log(
            "👤 پروفایل کاربر:",
            data
        );


        // نمایش نام کاربر

        const badges =
            document.querySelectorAll(".user-badge");


        badges.forEach(function (element) {

            element.textContent =
                data.full_name || "کاربر";

        });


        return data;


    } catch (error) {

        console.error(
            "خطای پروفایل:",
            error
        );

        return null;
    }
}


// ===============================
// داشبورد
// ===============================

async function loadDashboard() {

    if (!supabaseClient) {
        return;
    }


    try {

        // کل گزارش‌های تأیید شده

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
                "Total reports:",
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


        // گزارش امروز

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
                "Today reports:",
                todayError
            );
        }


        updateDashboardNumber(
            "todayReports",
            todayReports || 0
        );


        // ابتدای ماه

        const now = new Date();

        const firstDay =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )
                .toISOString()
                .split("T")[0];


        // گزارش‌های ماه

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
                .gte("report_date", firstDay);


        if (monthError) {
            console.error(
                "Month reports:",
                monthError
            );
        }


        updateDashboardNumber(
            "monthReports",
            monthReports || 0
        );


        // تعداد تصاویر

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
                "Photo count:",
                photoError
            );
        }


        updateDashboardNumber(
            "photoCount",
            photoCount || 0
        );


    } catch (error) {

        console.error(
            "❌ خطای داشبورد:",
            error
        );
    }
}


// ===============================
// تغییر عددهای داشبورد
// ===============================

function updateDashboardNumber(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ===============================
// خروج
// ===============================

async function logout() {

    try {

        if (supabaseClient) {

            await supabaseClient.auth.signOut();

        }


        currentUserProfile = null;
        window.currentUserProfile = null;


        const dashboard =
            document.getElementById("dashboard");

        const loginPage =
            document.getElementById("loginPage");


        if (dashboard) {
            dashboard.style.display = "none";
        }

        if (loginPage) {
            loginPage.style.display = "flex";
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


// ===============================
// بررسی نشست قبلی
// ===============================

async function checkSession() {

    try {

        if (!supabaseClient) {

            const connected =
                initSupabase();

            if (!connected) {
                return;
            }
        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }


        const session = data.session;


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
                loginPage.style.display = "none";
            }

            if (dashboard) {
                dashboard.style.display = "block";
            }


            await loadDashboard();

        } else {

            console.log(
                "ℹ️ کاربر وارد نشده است"
            );
        }


    } catch (error) {

        console.error(
            "Session exception:",
            error
        );
    }
}


// ===============================
// تغییر صفحات
// ===============================

function showPage(pageId, button) {

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(function (page) {

        page.style.display = "none";

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.style.display =
            "block";
    }


    const titles = {

        dashboardPage: "داشبورد",

        areasPage: "انتخاب حوزه",

        reportsPage: "گزارش‌ها",

        settingsPage: "تنظیمات"
    };


    const pageTitle =
        document.getElementById("pageTitle");


    if (pageTitle) {

        pageTitle.textContent =
            titles[pageId] ||
            "سامانه راهبرد شوشتر";
    }


    // فعال کردن دکمه

    const buttons =
        document.querySelectorAll(".menu-btn");


    buttons.forEach(function (btn) {

        btn.classList.remove("active");

    });


    if (button) {

        button.classList.add("active");

    }


    // بستن منوی موبایل

    const sidebar =
        document.getElementById("sidebar");


    if (
        sidebar &&
        window.innerWidth <= 900
    ) {

        sidebar.classList.remove("open");

    }
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
// شروع برنامه
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "🚀 سامانه راهبرد شوشتر"
        );


        const connected =
            initSupabase();


        if (connected) {

            await checkSession();

        }

    }
);
