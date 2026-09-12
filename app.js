const SUPABASE_URL =
    "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

let supabaseClient = null;
let currentUserProfile = null;


/* =========================
   اتصال به Supabase
========================= */

function initSupabase() {
    try {
        if (!window.supabase) {
            console.error("Supabase پیدا نشد.");
            return false;
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        window.supabaseClient = supabaseClient;

        console.log("✅ اتصال Supabase برقرار شد");

        return true;

    } catch (error) {
        console.error("❌ خطا در اتصال Supabase:", error);
        return false;
    }
}


/* =========================
   ورود
========================= */

async function login() {

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const errorBox =
        document.getElementById("loginError");

    const loginButton =
        document.getElementById("loginButton");


    if (!emailInput || !passwordInput) {
        console.error("فیلد ورود پیدا نشد.");
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


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

        const connected =
            initSupabase();

        if (!connected) {

            if (errorBox) {
                errorBox.textContent =
                    "اتصال به سامانه برقرار نشد.";
            }

            return;
        }
    }


    if (loginButton) {

        loginButton.disabled = true;
        loginButton.textContent =
            "در حال ورود...";
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            if (errorBox) {

                errorBox.textContent =
                    "ایمیل یا رمز عبور اشتباه است.";
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
            dashboard.style.display = "block";
        }


        await loadDashboard();
        await loadAreas();


    } catch (error) {

        console.error(
            "❌ خطای ورود:",
            error
        );

        if (errorBox) {
            errorBox.textContent =
                "خطایی هنگام ورود رخ داد.";
        }

    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.textContent =
                "ورود به سامانه";
        }
    }
}


/* =========================
   دریافت پروفایل
========================= */

async function loadUserProfile() {

    try {

        if (!supabaseClient) {
            return null;
        }


        const {
            data: userData,
            error: userError
        } =
            await supabaseClient.auth.getUser();


        if (userError || !userData.user) {

            console.error(
                "خطای دریافت کاربر:",
                userError
            );

            return null;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("user_profiles")
                .select("*")
                .eq("id", userData.user.id)
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
            "👤 پروفایل:",
            data
        );


        document
            .querySelectorAll(".user-badge")
            .forEach(function (element) {

                element.textContent =
                    data.full_name || "کاربر";

            });


        return data;


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        return null;
    }
}


/* =========================
   داشبورد
========================= */

async function loadDashboard() {

    if (!supabaseClient) {
        return;
    }


    try {

        /* کل گزارش‌ها */

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


        /* گزارش‌های امروز */

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


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


        /* گزارش‌های این ماه */

        const now =
            new Date();


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
                "Month reports:",
                monthError
            );
        }


        updateDashboardNumber(
            "monthReports",
            monthReports || 0
        );


        /* تعداد عکس‌ها */

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


/* =========================
   بروزرسانی اعداد
========================= */

function updateDashboardNumber(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent = value;
    }
}


/* =========================
   نمایش حوزه‌ها
========================= */

async function loadAreas() {

    if (!supabaseClient) {
        return;
    }


    const container =
        document.getElementById(
            "areasContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<div class='loading'>در حال دریافت حوزه‌ها...</div>";


    try {

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
                "خطای دریافت حوزه‌ها:",
                error
            );


            container.innerHTML =
                "<div class='error-box'>دریافت حوزه‌ها انجام نشد.</div>";

            return;
        }


        if (!data || data.length === 0) {

            container.innerHTML =
                "<div class='empty-box'>هیچ حوزه‌ای برای نمایش وجود ندارد.</div>";

            return;
        }


        container.innerHTML = "";


        data.forEach(function (area) {

            const card =
                document.createElement("button");


            card.className =
                "area-card";


            card.type =
                "button";


            card.innerHTML = `
                <div class="area-number">
                    ${area.id}
                </div>

                <div class="area-name">
                    ${escapeHtml(area.name)}
                </div>
            `;


            card.onclick =
                function () {

                    selectArea(area.id);

                };


            container.appendChild(card);

        });


        console.log(
            "✅ حوزه‌ها دریافت شدند:",
            data.length
        );


    } catch (error) {

        console.error(
            "Areas error:",
            error
        );


        container.innerHTML =
            "<div class='error-box'>خطایی هنگام دریافت حوزه‌ها رخ داد.</div>";
    }
}


/* =========================
   انتخاب حوزه
========================= */

async function selectArea(areaId) {

    if (!supabaseClient) {
        return;
    }


    try {

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
                "خطای حوزه:",
                error
            );

            return;
        }


        window.selectedArea =
            data;


        const panel =
            document.getElementById(
                "selectedAreaPanel"
            );


        if (!panel) {
            return;
        }


        panel.style.display =
            "block";


        const title =
            document.getElementById(
                "selectedAreaName"
            );


        if (title) {

            title.textContent =
                data.name;
        }


        panel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        console.log(
            "📍 حوزه انتخاب شد:",
            data
        );


    } catch (error) {

        console.error(
            "Select area error:",
            error
        );
    }
}


/* =========================
   خروج
========================= */

async function logout() {

    try {

        if (supabaseClient) {

            await supabaseClient.auth.signOut();
        }


        currentUserProfile = null;

        window.currentUserProfile =
            null;


        const dashboard =
            document.getElementById(
                "dashboard"
            );


        const loginPage =
            document.getElementById(
                "loginPage"
            );


        if (dashboard) {

            dashboard.style.display =
                "none";
        }


        if (loginPage) {

            loginPage.style.display =
                "flex";
        }


        const password =
            document.getElementById(
                "password"
            );


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


/* =========================
   بررسی نشست قبلی
========================= */

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


        if (data.session) {

            console.log(
                "✅ نشست قبلی پیدا شد"
            );


            await loadUserProfile();


            const loginPage =
                document.getElementById(
                    "loginPage"
                );


            const dashboard =
                document.getElementById(
                    "dashboard"
                );


            if (loginPage) {

                loginPage.style.display =
                    "none";
            }


            if (dashboard) {

                dashboard.style.display =
                    "block";
            }


            await loadDashboard();
            await loadAreas();


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


/* =========================
   جلوگیری از کد HTML
========================= */

function escapeHtml(text) {

    if (text === null || text === undefined) {
        return "";
    }


    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   شروع سامانه
========================= */

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
