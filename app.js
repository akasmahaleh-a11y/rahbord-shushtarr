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

            console.error("Supabase library پیدا نشد.");

            return false;
        }

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

        console.log("✅ اتصال Supabase برقرار شد");

        return true;

    } catch (error) {

        console.error(
            "❌ خطا در اتصال Supabase:",
            error
        );

        return false;
    }
}


/* =========================
   پیام خطا
========================= */

function showLoginError(message) {

    const errorBox =
        document.getElementById("loginError");

    if (errorBox) {

        errorBox.textContent = message;

        errorBox.style.display = "block";
    }
}


/* =========================
   ورود
========================= */

async function login(event) {

    /* جلوگیری از رفرش صفحه */

    if (event) {

        event.preventDefault();
        event.stopPropagation();
    }

    const identifierInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const errorBox =
        document.getElementById("loginError");

    const loginButton =
        document.getElementById("loginButton");


    if (!identifierInput || !passwordInput) {

        console.error(
            "فیلدهای ورود پیدا نشدند."
        );

        return;
    }


    const identifier =
        identifierInput.value.trim();

    const password =
        passwordInput.value;


    if (errorBox) {

        errorBox.textContent = "";
        errorBox.style.display = "none";
    }


    if (!identifier || !password) {

        showLoginError(
            "کد کاربری و رمز عبور را وارد کنید."
        );

        return;
    }


    /* اتصال */

    if (!supabaseClient) {

        const connected =
            initSupabase();

        if (!connected) {

            showLoginError(
                "اتصال به سامانه برقرار نشد."
            );

            return;
        }
    }


    if (loginButton) {

        loginButton.disabled = true;

        loginButton.textContent =
            "در حال ورود...";
    }


    try {

        /*
         اگر کاربر ADMIN وارد کند،
         آن را به ایمیل مدیر اصلی تبدیل می‌کنیم.
        */

        let email = identifier;


        if (
            identifier.toUpperCase() === "ADMIN"
        ) {

            email =
                "admin@raahbord-shushtar.local";
        }


        /*
         اگر ایمیل وارد شده باشد،
         همان ایمیل استفاده می‌شود.
        */

        const result =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        const data =
            result.data;

        const error =
            result.error;


        if (error) {

            console.error(
                "❌ خطای ورود:",
                error
            );


            showLoginError(
                "کد کاربری یا رمز عبور اشتباه است."
            );

            return;
        }


        if (!data || !data.user) {

            showLoginError(
                "کاربر پیدا نشد."
            );

            return;
        }


        console.log(
            "✅ ورود موفق:",
            data.user.email
        );


        /* دریافت پروفایل */

        const profile =
            await loadUserProfile();


        if (!profile) {

            await supabaseClient.auth.signOut();

            showLoginError(
                "پروفایل کاربر در سامانه پیدا نشد."
            );

            return;
        }


        /* مخفی کردن صفحه ورود */

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
                "block";
        }


        /* داشبورد */

        await loadDashboard();


        /* حوزه‌ها */

        await loadAreas();


    } catch (error) {

        console.error(
            "❌ خطای ورود:",
            error
        );


        showLoginError(
            "خطایی هنگام ورود رخ داد. دوباره تلاش کنید."
        );


    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.textContent =
                "ورود به سامانه";
        }
    }
}


/* =========================
   پروفایل کاربر
========================= */

async function loadUserProfile() {

    try {

        if (!supabaseClient) {

            return null;
        }


        const userResult =
            await supabaseClient.auth.getUser();


        const user =
            userResult.data.user;


        const userError =
            userResult.error;


        if (userError || !user) {

            console.error(
                "خطای دریافت کاربر:",
                userError
            );

            return null;
        }


        const profileResult =
            await supabaseClient
                .from("user_profiles")
                .select("*")
                .eq("id", user.id)
                .single();


        const data =
            profileResult.data;


        const error =
            profileResult.error;


        if (error) {

            console.error(
                "خطای دریافت پروفایل:",
                error
            );

            return null;
        }


        currentUserProfile =
            data;

        window.currentUserProfile =
            data;


        console.log(
            "👤 پروفایل:",
            data
        );


        /* نام کاربر */

        const badges =
            document.querySelectorAll(
                ".user-badge"
            );


        badges.forEach(function(element) {

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


/* =========================
   داشبورد
========================= */

async function loadDashboard() {

    if (!supabaseClient) {

        return;
    }


    try {

        /* کل گزارش‌ها */

        const totalResult =
            await supabaseClient
                .from("reports")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "approved");


        updateDashboardNumber(
            "totalReports",
            totalResult.count || 0
        );


        /* امروز */

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const todayResult =
            await supabaseClient
                .from("reports")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "approved")
                .eq("report_date", today);


        updateDashboardNumber(
            "todayReports",
            todayResult.count || 0
        );


        /* ماه جاری */

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


        const monthResult =
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


        updateDashboardNumber(
            "monthReports",
            monthResult.count || 0
        );


        /* تعداد عکس‌ها */

        const photoResult =
            await supabaseClient
                .from("report_photos")
                .select("*", {
                    count: "exact",
                    head: true
                });


        updateDashboardNumber(
            "photoCount",
            photoResult.count || 0
        );


    } catch (error) {

        console.error(
            "❌ خطای داشبورد:",
            error
        );
    }
}


/* =========================
   تغییر عدد داشبورد
========================= */

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


/* =========================
   دریافت حوزه‌ها
========================= */

async function loadAreas() {

    if (!supabaseClient) {

        return;
    }


    try {

        const result =
            await supabaseClient
                .from("areas")
                .select("*")
                .order("id");


        const data =
            result.data;


        const error =
            result.error;


        if (error) {

            console.error(
                "خطای دریافت حوزه‌ها:",
                error
            );

            return;
        }


        const container =
            document.getElementById(
                "areasContainer"
            );


        if (!container) {

            console.log(
                "areasContainer پیدا نشد."
            );

            return;
        }


        container.innerHTML = "";


        data.forEach(function(area) {

            const card =
                document.createElement("div");


            card.className =
                "area-card";


            card.innerHTML = `

                <div class="area-card-title">
                    ${area.name || ""}
                </div>

                <button
                    class="area-select-btn"
                    onclick="selectArea(${area.id})"
                >
                    ورود به حوزه
                </button>

            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(
            "خطای حوزه‌ها:",
            error
        );
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

        const result =
            await supabaseClient
                .from("areas")
                .select("*")
                .eq("id", areaId)
                .single();


        const area =
            result.data;


        const error =
            result.error;


        if (error) {

            console.error(
                "خطای حوزه:",
                error
            );

            return;
        }


        window.selectedArea =
            area;


        const panel =
            document.getElementById(
                "selectedAreaPanel"
            );


        if (panel) {

            panel.style.display =
                "block";
        }


        const areaName =
            document.getElementById(
                "selectedAreaName"
            );


        if (areaName) {

            areaName.textContent =
                area.name;
        }


        console.log(
            "📍 حوزه انتخاب شد:",
            area
        );


    } catch (error) {

        console.error(
            "خطای انتخاب حوزه:",
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


        currentUserProfile =
            null;

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
            "خطای خروج:",
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


        const result =
            await supabaseClient.auth.getSession();


        const session =
            result.data.session;


        const error =
            result.error;


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }


        if (session) {

            console.log(
                "✅ نشست قبلی پیدا شد"
            );


            const profile =
                await loadUserProfile();


            if (!profile) {

                await supabaseClient.auth.signOut();

                return;
            }


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
   شروع برنامه
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


        /* اطمینان از جلوگیری از رفرش فرم ورود */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();

                    login(event);

                }
            );
        }

    }
);


/* =========================
   دسترسی سراسری
========================= */

window.login =
    login;

window.logout =
    logout;

window.loadAreas =
    loadAreas;

window.selectArea =
    selectArea;

window.loadDashboard =
    loadDashboard;
