const { createClient } = supabase;

const SUPABASE_URL = "https://ruxurkublhqtmwjflyxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let selectedAreaId = null;


/* =========================
   LOGIN
========================= */

async function login(event) {
    if (event) event.preventDefault();

    const identifier = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("loginError");
    const loginButton = document.getElementById("loginButton");

    errorBox.textContent = "";

    if (!identifier || !password) {
        errorBox.textContent = "کد کاربری و رمز عبور را وارد کنید.";
        return false;
    }

    loginButton.disabled = true;
    loginButton.textContent = "در حال ورود...";

    try {
        let email = identifier;

        if (identifier.toUpperCase() === "ADMIN") {
            email = "admin@raahbord-shushtar.local";
        }

        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        currentUser = data.user;

        await loadUserProfile();

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        updateProfileInfo();
        applyRoleAccess();

        await loadDashboard();
        await loadAreas();

    } catch (error) {
        console.error(error);

        errorBox.textContent =
            "ورود ناموفق بود. کد کاربری یا رمز عبور را بررسی کنید.";
    }

    loginButton.disabled = false;
    loginButton.textContent = "ورود به سامانه";

    return false;
}


/* =========================
   PROFILE
========================= */

async function loadUserProfile() {
    if (!currentUser) return;

    const { data, error } = await db
        .from("user_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error("Profile error:", error);
        return;
    }

    currentProfile = data;
}


function updateProfileInfo() {
    if (!currentProfile) return;

    const name = document.getElementById("profileName");
    const role = document.getElementById("profileRole");

    if (name) {
        name.textContent =
            currentProfile.full_name || "کاربر سامانه";
    }

    if (role) {
        const roles = {
            admin: "مدیر اصلی",
            area_manager: "مدیر حوزه",
            section_manager: "مدیر بخش",
            force: "کاربر"
        };

        role.textContent =
            roles[currentProfile.role] ||
            currentProfile.role ||
            "کاربر";
    }
}


/* =========================
   ACCESS
========================= */

function applyRoleAccess() {
    const usersMenu = document.getElementById("usersMenu");

    if (!usersMenu) return;

    if (!currentProfile || currentProfile.role !== "admin") {
        usersMenu.style.display = "none";
    } else {
        usersMenu.style.display = "block";
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {
    if (!currentProfile) return;

    let query = db
        .from("reports")
        .select("id, created_at, status", {
            count: "exact"
        })
        .eq("status", "approved");

    const { data: reports, error } = await query;

    if (error) {
        console.error("Dashboard error:", error);
        return;
    }

    const allReports = reports || [];

    const today = new Date();

    const todayString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    const monthPrefix =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0");

    const todayReports = allReports.filter(report => {
        return report.created_at &&
            report.created_at.startsWith(todayString);
    });

    const monthReports = allReports.filter(report => {
        return report.created_at &&
            report.created_at.startsWith(monthPrefix);
    });

    setText("totalReports", allReports.length);
    setText("todayReports", todayReports.length);
    setText("monthReports", monthReports.length);

    const { count: photoCount, error: photoError } = await db
        .from("report_photos")
        .select("id", {
            count: "exact",
            head: true
        });

    if (!photoError) {
        setText("photoCount", photoCount || 0);
    }
}


/* =========================
   AREAS
========================= */

async function loadAreas() {
    const container = document.getElementById("areasContainer");

    if (!container) return;

    container.innerHTML =
        '<div class="loading">در حال دریافت حوزه‌ها...</div>';

    const { data, error } = await db
        .from("areas")
        .select("*")
        .order("id");

    if (error) {
        console.error(error);
        container.innerHTML =
            '<div class="error">خطا در دریافت حوزه‌ها</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            '<div class="empty">هنوز حوزه‌ای ثبت نشده است.</div>';
        return;
    }

    container.innerHTML = "";

    data.forEach(area => {
        const card = document.createElement("div");

        card.className = "area-card";

        card.innerHTML = `
            <div class="area-card-title">
                ${escapeHtml(area.name || "بدون نام")}
            </div>

            <button
                type="button"
                onclick="selectArea(${area.id})">
                ورود به حوزه
            </button>
        `;

        container.appendChild(card);
    });
}


async function selectArea(areaId) {
    selectedAreaId = areaId;

    const panel =
        document.getElementById("selectedAreaPanel");

    if (!panel) return;

    const { data: area, error } = await db
        .from("areas")
        .select("*")
        .eq("id", areaId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    panel.style.display = "block";

    const title =
        document.getElementById("selectedAreaTitle");

    if (title) {
        title.textContent =
            area.name || "حوزه انتخاب‌شده";
    }

    window.scrollTo({
        top: panel.offsetTop - 20,
        behavior: "smooth"
    });
}


/* =========================
   USERS
========================= */

async function loadUsers() {
    const container =
        document.getElementById("usersContainer");

    if (!container) return;

    container.innerHTML =
        '<div class="loading">در حال دریافت کاربران...</div>';

    const { data, error } = await db
        .from("system_users")
        .select("*")
        .order("id", {
            ascending: false
        });

    if (error) {
        console.error(error);

        container.innerHTML =
            '<div class="error">خطا در دریافت کاربران</div>';

        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            '<div class="empty">هنوز کاربری ساخته نشده است.</div>';

        return;
    }

    container.innerHTML = "";

    data.forEach(user => {

        const roleNames = {
            admin: "مدیر اصلی",
            area_manager: "مدیر حوزه",
            section_manager: "مدیر بخش",
            force: "کاربر"
        };

        const card = document.createElement("div");

        card.className = "user-card";

        card.innerHTML = `
            <div>
                <strong>
                    ${escapeHtml(user.full_name)}
                </strong>

                <div>
                    کد:
                    ${escapeHtml(user.user_code)}
                </div>

                <div>
                    نقش:
                    ${roleNames[user.role] || user.role}
                </div>
            </div>

            <div class="user-permissions">
                ${user.can_submit_reports ? "ثبت گزارش ✓" : "ثبت گزارش ✕"}
                <br>
                ${user.can_view_reports ? "مشاهده گزارش ✓" : "مشاهده گزارش ✕"}
                <br>
                ${user.can_approve_reports ? "تأیید گزارش ✓" : "تأیید گزارش ✕"}
            </div>
        `;

        container.appendChild(card);
    });
}


/* =========================
   USER MODAL
========================= */

function openUserModal() {
    const modal =
        document.getElementById("userModal");

    if (modal) {
        modal.style.display = "flex";
    }

    clearUserForm();
}


function closeUserModal() {
    const modal =
        document.getElementById("userModal");

    if (modal) {
        modal.style.display = "none";
    }
}


function clearUserForm() {
    setValue("newFullName", "");
    setValue("newUserCode", "");
    setValue("newUserEmail", "");
    setValue("newUserPassword", "");

    setValue("newUserRole", "force");

    setChecked("newCanSubmit", true);
    setChecked("newCanView", false);
    setChecked("newCanApprove", false);

    setText("userMessage", "");
}


/* =========================
   CREATE USER
========================= */

async function createUser() {

    if (!currentProfile ||
        currentProfile.role !== "admin") {

        setText(
            "userMessage",
            "فقط مدیر اصلی می‌تواند کاربر بسازد."
        );

        return;
    }

    const fullName =
        getValue("newFullName").trim();

    const userCode =
        getValue("newUserCode").trim().toUpperCase();

    const email =
        getValue("newUserEmail").trim();

    const password =
        getValue("newUserPassword");

    const role =
        getValue("newUserRole");

    const canSubmit =
        getChecked("newCanSubmit");

    const canView =
        getChecked("newCanView");

    const canApprove =
        getChecked("newCanApprove");


    if (!fullName ||
        !userCode ||
        !email ||
        !password) {

        setText(
            "userMessage",
            "لطفاً تمام اطلاعات کاربر را وارد کنید."
        );

        return;
    }


    if (password.length < 6) {

        setText(
            "userMessage",
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        );

        return;
    }


    try {

        setText(
            "userMessage",
            "در حال ساخت کاربر..."
        );


        const { data: existing } = await db
            .from("system_users")
            .select("id")
            .eq("user_code", userCode)
            .maybeSingle();


        if (existing) {

            setText(
                "userMessage",
                "این کد کاربری قبلاً استفاده شده است."
            );

            return;
        }


        const { error } = await db
            .from("system_users")
            .insert({
                full_name: fullName,
                user_code: userCode,
                role: role,
                can_submit_reports: canSubmit,
                can_view_reports: canView,
                can_approve_reports: canApprove
            });


        if (error) {
            throw error;
        }


        setText(
            "userMessage",
            "اطلاعات کاربر با موفقیت ثبت شد."
        );


        await loadUsers();


        setTimeout(() => {
            closeUserModal();
        }, 1200);


    } catch (error) {

        console.error(error);

        setText(
            "userMessage",
            "خطا در ساخت کاربر: " +
            (error.message || "خطای نامشخص")
        );
    }
}


/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageName) {

    const pages = [
        "dashboardPage",
        "areasPage",
        "usersPage",
        "reportsPage",
        "settingsPage"
    ];

    pages.forEach(id => {

        const page =
            document.getElementById(id);

        if (page) {
            page.style.display = "none";
        }
    });


    const selected =
        document.getElementById(pageName);

    if (selected) {
        selected.style.display = "block";
    }


    if (pageName === "usersPage") {
        loadUsers();
    }


    if (pageName === "areasPage") {
        loadAreas();
    }


    if (pageName === "dashboardPage") {
        loadDashboard();
    }
}


/* =========================
   MENU
========================= */

function toggleMenu() {

    const sidebar =
        document.getElementById("sidebar");

    if (!sidebar) return;

    sidebar.classList.toggle("open");
}


/* =========================
   LOGOUT
========================= */

async function logout() {

    await db.auth.signOut();

    currentUser = null;
    currentProfile = null;

    document.getElementById("dashboard").style.display =
        "none";

    document.getElementById("loginPage").style.display =
        "flex";

    setValue("password", "");
}


/* =========================
   SESSION
========================= */

async function checkSession() {

    const { data } =
        await db.auth.getSession();

    if (!data.session) {
        return;
    }

    currentUser = data.session.user;

    await loadUserProfile();

    if (!currentProfile) {
        await db.auth.signOut();
        return;
    }

    document.getElementById("loginPage").style.display =
        "none";

    document.getElementById("dashboard").style.display =
        "block";

    updateProfileInfo();
    applyRoleAccess();

    await loadDashboard();
    await loadAreas();
}


/* =========================
   HELPERS
========================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function getValue(id) {

    const element =
        document.getElementById(id);

    return element ? element.value : "";
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value;
    }
}


function getChecked(id) {

    const element =
        document.getElementById(id);

    return element ? element.checked : false;
}


function setChecked(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.checked = value;
    }
}


function escapeHtml(value) {

    if (value === null ||
        value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.login = login;
window.logout = logout;
window.showPage = showPage;
window.toggleMenu = toggleMenu;

window.selectArea = selectArea;

window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.createUser = createUser;

window.loadUsers = loadUsers;


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

    checkSession();

});
