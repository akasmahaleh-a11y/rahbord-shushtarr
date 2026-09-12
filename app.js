const SUPABASE_URL =
    "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";


let db = null;

let currentUser = null;
let currentProfile = null;
let selectedAreaId = null;


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("App started");

    try {

        if (!window.supabase) {
            showLoginError(
                "کتابخانه Supabase بارگذاری نشده است."
            );
            return;
        }

        db = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log("Supabase connected");

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                login
            );
        }

        await checkSession();

    } catch (error) {

        console.error(error);

        showLoginError(
            "خطا در راه‌اندازی سامانه: " +
            error.message
        );
    }

});


/* =========================
   LOGIN
========================= */

async function login(event) {

    if (event) {
        event.preventDefault();
    }

    console.log("Login clicked");

    const identifier =
        document.getElementById("email")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value;

    const button =
        document.getElementById("loginButton");

    hideLoginError();

    if (!identifier || !password) {

        showLoginError(
            "کد کاربری و رمز عبور را وارد کنید."
        );

        return false;
    }


    button.disabled = true;
    button.textContent = "در حال ورود...";


    try {

        let email = identifier;


        /*
          مدیر اصلی با کد ADMIN
        */

        if (
            identifier.toUpperCase() ===
            "ADMIN"
        ) {

            email =
                "admin@raahbord-shushtar.local";
        }


        console.log(
            "Trying login with:",
            email
        );


        const result =
            await db.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (result.error) {
            throw result.error;
        }


        currentUser =
            result.data.user;


        console.log(
            "Login successful",
            currentUser
        );


        await loadUserProfile();


        if (!currentProfile) {

            await db.auth.signOut();

            throw new Error(
                "برای این حساب پروفایل سامانه پیدا نشد."
            );
        }


        document.getElementById(
            "loginPage"
        ).style.display = "none";


        document.getElementById(
            "dashboard"
        ).style.display = "block";


        updateProfileInfo();

        applyRoleAccess();

        await loadDashboard();

        await loadAreas();


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        let message =
            "ورود انجام نشد.";


        if (
            error.message
        ) {

            message =
                error.message;
        }


        showLoginError(
            message
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "ورود به سامانه";
    }


    return false;
}


/* =========================
   LOAD PROFILE
========================= */

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }


    const result =
        await db
            .from("user_profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (result.error) {

        console.error(
            "PROFILE ERROR:",
            result.error
        );

        throw result.error;
    }


    currentProfile =
        result.data;
}


/* =========================
   PROFILE INFO
========================= */

function updateProfileInfo() {

    if (!currentProfile) {
        return;
    }


    const roleNames = {

        admin: "مدیر اصلی",

        area_manager: "مدیر حوزه",

        section_manager: "مدیر بخش",

        force: "کاربر"

    };


    setText(
        "profileName",
        currentProfile.full_name ||
        "کاربر"
    );


    setText(
        "profileRole",
        roleNames[
            currentProfile.role
        ] ||
        currentProfile.role ||
        "کاربر"
    );


    setText(
        "settingsName",
        currentProfile.full_name ||
        "کاربر"
    );


    setText(
        "settingsRole",
        roleNames[
            currentProfile.role
        ] ||
        currentProfile.role ||
        "کاربر"
    );
}


/* =========================
   ACCESS
========================= */

function applyRoleAccess() {

    const usersMenu =
        document.getElementById(
            "usersMenu"
        );


    if (!usersMenu) {
        return;
    }


    if (
        currentProfile &&
        currentProfile.role === "admin"
    ) {

        usersMenu.style.display =
            "block";

    } else {

        usersMenu.style.display =
            "none";
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

    try {

        const result =
            await db
                .from("reports")
                .select(
                    "id, created_at, status"
                )
                .eq(
                    "status",
                    "approved"
                );


        if (result.error) {

            console.warn(
                "Reports table error:",
                result.error
            );

            return;
        }


        const reports =
            result.data || [];


        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                now.getDate()
            ).padStart(2, "0");


        const today =
            `${year}-${month}-${day}`;


        const monthPrefix =
            `${year}-${month}`;


        const todayReports =
            reports.filter(
                item =>
                    item.created_at &&
                    item.created_at.startsWith(
                        today
                    )
            );


        const monthReports =
            reports.filter(
                item =>
                    item.created_at &&
                    item.created_at.startsWith(
                        monthPrefix
                    )
            );


        setText(
            "totalReports",
            reports.length
        );


        setText(
            "todayReports",
            todayReports.length
        );


        setText(
            "monthReports",
            monthReports.length
        );


        const photos =
            await db
                .from("report_photos")
                .select("id");


        if (!photos.error) {

            setText(
                "photoCount",
                (photos.data || []).length
            );
        }


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );
    }
}


/* =========================
   AREAS
========================= */

async function loadAreas() {

    const container =
        document.getElementById(
            "areasContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        '<div class="loading">در حال دریافت حوزه‌ها...</div>';


    try {

        const result =
            await db
                .from("areas")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (result.error) {
            throw result.error;
        }


        const areas =
            result.data || [];


        if (areas.length === 0) {

            container.innerHTML =
                '<div class="empty">هنوز حوزه‌ای ثبت نشده است.</div>';

            return;
        }


        container.innerHTML = "";


        areas.forEach(
            area => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "area-card";


                card.innerHTML = `

                    <div class="area-card-title">

                        ${escapeHtml(
                            area.name ||
                            "حوزه بدون نام"
                        )}

                    </div>

                    <button
                        class="small-btn"
                        type="button"
                        onclick="selectArea(${area.id})">

                        ورود به حوزه

                    </button>
                `;


                container.appendChild(
                    card
                );
            }
        );


    } catch (error) {

        console.error(
            "AREAS ERROR:",
            error
        );


        container.innerHTML =
            '<div class="empty">خطا در دریافت حوزه‌ها</div>';
    }
}


/* =========================
   SELECT AREA
========================= */

async function selectArea(
    areaId
) {

    selectedAreaId =
        areaId;


    const panel =
        document.getElementById(
            "selectedAreaPanel"
        );


    if (!panel) {
        return;
    }


    try {

        const result =
            await db
                .from("areas")
                .select("*")
                .eq(
                    "id",
                    areaId
                )
                .single();


        if (result.error) {
            throw result.error;
        }


        panel.style.display =
            "block";


        setText(
            "selectedAreaTitle",
            result.data.name ||
            "حوزه"
        );


        panel.scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            error
        );
    }
}


/* =========================
   USERS
========================= */

async function loadUsers() {

    const container =
        document.getElementById(
            "usersContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        '<div class="loading">در حال دریافت کاربران...</div>';


    try {

        const result =
            await db
                .from("system_users")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: false
                    }
                );


        if (result.error) {
            throw result.error;
        }


        const users =
            result.data || [];


        if (users.length === 0) {

            container.innerHTML =
                '<div class="empty">هنوز کاربری ثبت نشده است.</div>';

            return;
        }


        const roleNames = {

            admin: "مدیر اصلی",

            area_manager: "مدیر حوزه",

            section_manager: "مدیر بخش",

            force: "کاربر"

        };


        container.innerHTML = "";


        users.forEach(
            user => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "user-card";


                card.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            user.full_name
                        )}
                    </strong>

                    <p>
                        کد کاربری:
                        ${escapeHtml(
                            user.user_code
                        )}
                    </p>

                    <p>
                        نقش:
                        ${
                            roleNames[
                                user.role
                            ] ||
                            user.role
                        }
                    </p>

                    <p>
                        ${
                            user.can_submit_reports
                                ? "✓ ثبت گزارش"
                                : "✕ ثبت گزارش"
                        }
                    </p>

                `;


                container.appendChild(
                    card
                );
            }
        );


    } catch (error) {

        console.error(
            "USERS ERROR:",
            error
        );


        container.innerHTML =
            '<div class="empty">خطا در دریافت کاربران</div>';
    }
}


/* =========================
   OPEN USER MODAL
========================= */

function openUserModal() {

    const modal =
        document.getElementById(
            "userModal"
        );


    if (!modal) {
        return;
    }


    clearUserForm();


    modal.style.display =
        "flex";
}


/* =========================
   CLOSE USER MODAL
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
   CLEAR USER FORM
========================= */

function clearUserForm() {

    setValue(
        "newFullName",
        ""
    );

    setValue(
        "newUserCode",
        ""
    );

    setValue(
        "newUserEmail",
        ""
    );

    setValue(
        "newUserPassword",
        ""
    );

    setValue(
        "newUserRole",
        "force"
    );


    setChecked(
        "newCanSubmit",
        true
    );

    setChecked(
        "newCanView",
        false
    );

    setChecked(
        "newCanApprove",
        false
    );


    setText(
        "userMessage",
        ""
    );
}


/* =========================
   CREATE USER
========================= */

async function createUser() {

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {

        setText(
            "userMessage",
            "فقط مدیر اصلی اجازه ساخت کاربر دارد."
        );

        return;
    }


    const fullName =
        getValue(
            "newFullName"
        ).trim();


    const userCode =
        getValue(
            "newUserCode"
        )
        .trim()
        .toUpperCase();


    const email =
        getValue(
            "newUserEmail"
        ).trim();


    const password =
        getValue(
            "newUserPassword"
        );


    const role =
        getValue(
            "newUserRole"
        );


    const canSubmit =
        getChecked(
            "newCanSubmit"
        );


    const canView =
        getChecked(
            "newCanView"
        );


    const canApprove =
        getChecked(
            "newCanApprove"
        );


    if (
        !fullName ||
        !userCode ||
        !email ||
        !password
    ) {

        setText(
            "userMessage",
            "همه اطلاعات را وارد کنید."
        );

        return;
    }


    if (
        password.length < 6
    ) {

        setText(
            "userMessage",
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        );

        return;
    }


    try {

        setText(
            "userMessage",
            "در حال ثبت کاربر..."
        );


        const existing =
            await db
                .from("system_users")
                .select("id")
                .eq(
                    "user_code",
                    userCode
                )
                .maybeSingle();


        if (existing.error) {
            throw existing.error;
        }


        if (existing.data) {

            setText(
                "userMessage",
                "این کد کاربری قبلاً ثبت شده است."
            );

            return;
        }


        const result =
            await db
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

                });


        if (result.error) {
            throw result.error;
        }


        setText(
            "userMessage",
            "کاربر با موفقیت ثبت شد."
        );


        await loadUsers();


        setTimeout(
            closeUserModal,
            1000
        );


    } catch (error) {

        console.error(
            "CREATE USER ERROR:",
            error
        );


        setText(
            "userMessage",
            "خطا: " +
            error.message
        );
    }
}


/* =========================
   PAGE
========================= */

function showPage(
    pageId
) {

    const pages =
        document.querySelectorAll(
            ".page"
        );


    pages.forEach(
        page => {

            page.classList.remove(
                "active"
            );
        }
    );


    const page =
        document.getElementById(
            pageId
        );


    if (page) {

        page.classList.add(
            "active"
        );
    }


    if (
        pageId ===
        "usersPage"
    ) {

        loadUsers();
    }


    if (
        pageId ===
        "areasPage"
    ) {

        loadAreas();
    }


    if (
        pageId ===
        "dashboardPage"
    ) {

        loadDashboard();
    }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

    try {

        if (db) {

            await db.auth.signOut();
        }

    } catch (error) {

        console.error(
            error
        );
    }


    currentUser = null;
    currentProfile = null;


    document.getElementById(
        "dashboard"
    ).style.display =
        "none";


    document.getElementById(
        "loginPage"
    ).style.display =
        "flex";


    setValue(
        "password",
        ""
    );
}


/* =========================
   SESSION
========================= */

async function checkSession() {

    if (!db) {
        return;
    }


    try {

        const result =
            await db.auth.getSession();


        if (
            result.error
        ) {

            console.error(
                result.error
            );

            return;
        }


        if (
            !result.data.session
        ) {

            return;
        }


        currentUser =
            result.data.session.user;


        await loadUserProfile();


        if (!currentProfile) {

            await db.auth.signOut();

            return;
        }


        document.getElementById(
            "loginPage"
        ).style.display =
            "none";


        document.getElementById(
            "dashboard"
        ).style.display =
            "block";


        updateProfileInfo();

        applyRoleAccess();

        await loadDashboard();

        await loadAreas();


    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );
    }
}


/* =========================
   LOGIN ERROR
========================= */

function showLoginError(
    message
) {

    const box =
   
