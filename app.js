const SUPABASE_URL =
    "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

let supabaseClient = null;
let currentUserProfile = null;
let selectedArea = null;


/* =========================
   اتصال
========================= */

function initSupabase() {

    try {

        if (!window.supabase) {
            console.error("Supabase پیدا نشد.");
            return false;
        }

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

        console.log("✅ Supabase متصل شد");

        return true;

    } catch (error) {

        console.error(error);

        return false;
    }
}


/* =========================
   ورود
========================= */

async function login(event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const identifierInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("loginButton");

    const errorBox =
        document.getElementById("loginError");


    const identifier =
        identifierInput.value.trim();

    const password =
        passwordInput.value;


    errorBox.style.display = "none";
    errorBox.textContent = "";


    if (!identifier || !password) {

        errorBox.textContent =
            "کد کاربری و رمز عبور را وارد کنید.";

        errorBox.style.display = "block";

        return;
    }


    if (!supabaseClient) {

        if (!initSupabase()) {

            errorBox.textContent =
                "اتصال به سامانه برقرار نشد.";

            errorBox.style.display = "block";

            return;
        }
    }


    /*
       فعلاً ADMIN مستقیماً به حساب مدیر اصلی وصل می‌شود.
    */

    let email = identifier;


    if (
        identifier.toUpperCase() === "ADMIN"
    ) {

        email =
            "admin@raahbord-shushtar.local";
    }


    if (loginButton) {

        loginButton.disabled = true;

        loginButton.textContent =
            "در حال ورود...";
    }


    try {

        const result =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (result.error) {

            console.error(
                result.error
            );

            errorBox.textContent =
                "کد کاربری یا رمز عبور اشتباه است.";

            errorBox.style.display =
                "block";

            return;
        }


        if (!result.data.user) {

            errorBox.textContent =
                "کاربر پیدا نشد.";

            errorBox.style.display =
                "block";

            return;
        }


        console.log(
            "✅ ورود موفق"
        );


        const profile =
            await loadUserProfile();


        if (!profile) {

            await supabaseClient.auth.signOut();

            errorBox.textContent =
                "پروفایل کاربر پیدا نشد.";

            errorBox.style.display =
                "block";

            return;
        }


        document.getElementById(
            "loginPage"
        ).style.display = "none";


        document.getElementById(
            "dashboard"
        ).style.display = "block";


        await loadDashboard();

        await loadAreas();

        updateProfileInfo();

        applyRoleAccess();


    } catch (error) {

        console.error(error);

        errorBox.textContent =
            "خطایی هنگام ورود رخ داد.";

        errorBox.style.display =
            "block";

    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.textContent =
                "ورود به سامانه";
        }
    }
}


/* =========================
   پروفایل
========================= */

async function loadUserProfile() {

    try {

        const userResult =
            await supabaseClient.auth.getUser();


        if (
            userResult.error ||
            !userResult.data.user
        ) {

            return null;
        }


        const user =
            userResult.data.user;


        const result =
            await supabaseClient
                .from("user_profiles")
                .select("*")
                .eq("id", user.id)
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            return null;
        }


        currentUserProfile =
            result.data;


        window.currentUserProfile =
            result.data;


        document
            .querySelectorAll(".user-badge")
            .forEach(function(element) {

                element.textContent =
                    result.data.full_name ||
                    "کاربر";

            });


        return result.data;


    } catch (error) {

        console.error(error);

        return null;
    }
}


/* =========================
   اطلاعات پروفایل
========================= */

function updateProfileInfo() {

    if (!currentUserProfile) {
        return;
    }


    const name =
        document.getElementById(
            "profileName"
        );


    const role =
        document.getElementById(
            "profileRole"
        );


    if (name) {

        name.textContent =
            currentUserProfile.full_name ||
            "-";
    }


    if (role) {

        const roles = {

            admin: "مدیر اصلی",

            area_manager: "مدیر حوزه",

            section_manager: "مدیر بخش",

            force: "نیروی عادی"

        };


        role.textContent =
            roles[
                currentUserProfile.role
            ] ||
            currentUserProfile.role ||
            "-";
    }
}


/* =========================
   دسترسی نقش
========================= */

function applyRoleAccess() {

    if (!currentUserProfile) {
        return;
    }


    const usersMenu =
        document.getElementById(
            "usersMenu"
        );


    /*
       فعلاً مدیریت کاربران
       فقط برای مدیر اصلی نمایش داده می‌شود.
    */

    if (
        currentUserProfile.role !==
        "admin"
    ) {

        if (usersMenu) {
            usersMenu.style.display =
                "none";
        }
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

        const total =
            await supabaseClient
                .from("reports")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "status",
                    "approved"
                );


        updateDashboardNumber(
            "totalReports",
            total.count || 0
        );


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
                .eq(
                    "status",
                    "approved"
                )
                .eq(
                    "report_date",
                    today
                );


        updateDashboardNumber(
            "todayReports",
            todayResult.count || 0
        );


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
                .eq(
                    "status",
                    "approved"
                )
                .gte(
                    "report_date",
                    firstDay
                );


        updateDashboardNumber(
            "monthReports",
            monthResult.count || 0
        );


        const photos =
            await supabaseClient
                .from("report_photos")
                .select("*", {
                    count: "exact",
                    head: true
                });


        updateDashboardNumber(
            "photoCount",
            photos.count || 0
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


/* =========================
   عددهای داشبورد
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
   حوزه‌ها
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


    try {

        const result =
            await supabaseClient
                .from("areas")
                .select("*")
                .order("id");


        if (result.error) {

            console.error(
                result.error
            );

            return;
        }


        container.innerHTML = "";


        result.data.forEach(
            function(area) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "area-card";


                card.innerHTML = `

                    <div class="area-card-title">
                        ${escapeHtml(area.name || "")}
                    </div>

                    <button
                        class="small-btn"
                        onclick="selectArea(${area.id})"
                    >
                        ورود به حوزه
                    </button>

                `;


                container.appendChild(card);

            }
        );


    } catch (error) {

        console.error(error);
    }
}


/* =========================
   انتخاب حوزه
========================= */

async function selectArea(areaId) {

    try {

        const result =
            await supabaseClient
                .from("areas")
                .select("*")
                .eq("id", areaId)
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            return;
        }


        selectedArea =
            result.data;


        window.selectedArea =
            result.data;


        const panel =
            document.getElementById(
                "selectedAreaPanel"
            );


        const name =
            document.getElementById(
                "selectedAreaName"
            );


        if (panel) {

            panel.style.display =
                "block";
        }


        if (name) {

            name.textContent =
                selectedArea.name;
        }


        console.log(
            "حوزه انتخاب شد:",
            selectedArea.name
        );


    } catch (error) {

        console.error(error);
    }
}


/* =========================
   مدیریت کاربران
========================= */

async function loadUsers() {

    const container =
        document.getElementById(
            "usersContainer"
        );


    if (!container) {
        return;
    }


    if (
        !currentUserProfile ||
        currentUserProfile.role !== "admin"
    ) {

        container.innerHTML =
            "<p>شما دسترسی مدیریت کاربران ندارید.</p>";

        return;
    }


    try {

        const result =
            await supabaseClient
                .from("system_users")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (result.error) {

            console.error(
                result.error
            );

            container.innerHTML =
                "<p>دریافت کاربران انجام نشد.</p>";

            return;
        }


        container.innerHTML = "";


        if (!result.data.length) {

            container.innerHTML =
                "<p>هنوز کاربری ساخته نشده است.</p>";

            return;
        }


        result.data.forEach(
            function(user) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "user-card";


                const roleNames = {

                    admin: "مدیر اصلی",

                    area_manager: "مدیر حوزه",

                    section_manager: "مدیر بخش",

                    force: "نیروی عادی"

                };


                card.innerHTML = `

                    <div class="user-card-title">
                        ${escapeHtml(user.full_name)}
                    </div>

                    <div>
                        کد:
                        <strong>
                            ${escapeHtml(user.user_code)}
                        </strong>
                    </div>

                    <div style="margin-top:8px;">
                        نقش:
                        ${roleNames[user.role] || user.role}
                    </div>

                    <div style="margin-top:12px;">

                        ${
                            user.can_submit_reports
                            ? "✅ ثبت گزارش"
                            : "❌ ثبت گزارش"
                        }

                        <br>

                        ${
                            user.can_view_reports
                            ? "✅ مشاهده گزارش"
                            : "❌ مشاهده گزارش"
                        }

                        <br>

                        ${
                            user.can_approve_reports
                            ? "✅ تأیید گزارش"
                            : "❌ تأیید گزارش"
                        }

                    </div>

                `;


                container.appendChild(card);

            }
        );


    } catch (error) {

        console.error(error);
    }
}


/* =========================
   باز کردن فرم کاربر
========================= */

function openUserModal() {

    const modal =
        document.getElementById(
            "userModal"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }


    clearUserForm();
}


/* =========================
   بستن فرم
========================= */

function closeUserModal() {

    const modal =
        document.getElementById(
            "userModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


/* =========================
   پاک کردن فرم
========================= */

function clearUserForm() {

    const ids = [

        "newFullName",

        "newUserCode",

        "newUserEmail",

        "newUserPassword"

    ];


    ids.forEach(
        function(id) {

            const element =
                document.getElementById(id);


            if (element) {

                element.value = "";
            }

        }
    );


    document.getElementById(
        "newCanSubmit"
    ).checked = true;


    document.getElementById(
        "newCanView"
    ).checked = false;


    document.getElementById(
        "newCanApprove"
    ).checked = false;


    const message =
        document.getElementById(
            "userMessage"
        );


    if (message) {

        message.style.display =
            "none";

        message.textContent =
            "";
    }
}


/* =========================
   ساخت کاربر
========================= */

async function createUser() {

    if (
        !currentUserProfile ||
        currentUserProfile.role !== "admin"
    ) {

        showUserMessage(
            "شما اجازه ساخت کاربر ندارید.",
            false
        );

        return;
    }


    const fullName =
        document.getElementById(
            "newFullName"
        ).value.trim();


    const userCode =
        document.getElementById(
            "newUserCode"
        ).value.trim();


    const email =
        document.getElementById(
            "newUserEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "newUserPassword"
        ).value;


    const role =
        document.getElementById(
            "newUserRole"
        ).value;


    const canSubmit =
        document.getElementById(
            "newCanSubmit"
        ).checked;


    const canView =
        document.getElementById(
            "newCanView"
        ).checked;


    const canApprove =
        document.getElementById(
            "newCanApprove"
        ).checked;


    if (
        !fullName ||
        !userCode ||
        !email ||
        !password
    ) {

        showUserMessage(
            "همه اطلاعات کاربر را وارد کنید.",
            false
        );

        return;
    }


    if (password.length < 6) {

        showUserMessage(
            "رمز عبور باید حداقل ۶ کاراکتر باشد.",
            false
        );

        return;
    }


    /*
       توجه:
       ساخت کاربر Auth با کلید عمومی
       از سمت مرورگر امن و قابل انجام نیست.

       در این مرحله اطلاعات کاربر را
       در جدول system_users ثبت می‌کنیم.
    */


    try {

        const existing =
            await supabaseClient
                .from("system_users")
                .select("id")
                .eq(
                    "user_code",
                    userCode
                )
                .maybeSingle();


        if (existing.data) {

            showUserMessage(
                "این کد کاربری قبلاً ثبت شده است.",
                false
            );

            return;
        }


        const result =
            await supabaseClient
                .from("system_users")
                .insert({

                    full_name:
                        fullName,

                    user_code:
                        userCode,

                    role:
                        role,

                    can_submit_reports:
                        canSubmit,

                    can_view_reports:
                        canView,

                    can_approve_reports:
                        canApprove

                })
                .select()
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            showUserMessage(
                "ثبت کاربر انجام نشد.",
                false
            );

            return;
        }


        showUserMessage(
            "کاربر با موفقیت ثبت شد.",
            true
        );


        await loadUsers();


        setTimeout(
            function() {

                closeUserModal();

            },
            1000
        );


    } catch (error) {

        console.error(error);

        showUserMessage(
            "خطایی هنگام ساخت کاربر رخ داد.",
            false
        );
    }
}


/* =========================
   پیام کاربر
========================= */

function showUserMessage(
    text,
    success
) {

    const message =
        document.getElementById(
            "userMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "message " +
        (
            success
            
