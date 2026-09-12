/* =========================================================
   سامانه راهبرد شوشتر
   Main JavaScript
   ========================================================= */

const SUPABASE_URL = "https://ruxurkublhqtmwjflyxp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_11au_IG9FFtRdUpaeFtDwQ_hhsRHhc8";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let selectedArea = null;
let selectedSection = null;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("سامانه راهبرد شوشتر - JS loaded");

  setupEvents();

  await checkSession();

});


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

  const loginButton =
    document.getElementById("loginButton");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        login(event);

      }
    );

  }


  const loginForm =
    document.getElementById("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        login(event);

        return false;

      }
    );

  }


  const reportForm =
    document.getElementById("reportForm");

  if (reportForm) {

    reportForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();
        event.stopPropagation();

        await submitReport(event);

        return false;

      }
    );

  }


  const userForm =
    document.getElementById("userForm");

  if (userForm) {

    userForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();
        event.stopPropagation();

        await createUser(event);

        return false;

      }
    );

  }

}


/* =========================================================
   CHECK SESSION
   ========================================================= */

async function checkSession() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      showLogin();

      return;

    }


    const session = data.session;


    if (!session) {

      showLogin();

      return;

    }


    currentUser =
      session.user;


    await loadProfile(
      currentUser.id
    );


  } catch (error) {

    console.error(
      "Check session error:",
      error
    );

    showLogin();

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(event) {

  /*
   این بخش مهم است.
   اجازه نمی‌دهیم فرم باعث Refresh صفحه شود.
  */

  if (event) {

    event.preventDefault();
    event.stopPropagation();

  }


  const emailInput =
    document.getElementById("email");

  const passwordInput =
    document.getElementById("password");

  const loginButton =
    document.getElementById("loginButton");

  const errorBox =
    document.getElementById("loginError");


  if (!emailInput || !passwordInput) {

    console.error(
      "Login inputs not found"
    );

    return false;

  }


  let userCode =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (errorBox) {

    errorBox.classList.add(
      "hidden"
    );

    errorBox.textContent = "";

  }


  if (!userCode || !password) {

    showLoginError(
      "کد کاربری و رمز عبور را وارد کنید."
    );

    return false;

  }


  /*
   ADMIN به ایمیل واقعی Auth متصل می‌شود.
  */

  let email = userCode;


  if (
    userCode.toUpperCase() ===
    "ADMIN"
  ) {

    email =
      "admin@raahbord-shushtar.local";

  }


  /*
   اگر کاربر ایمیل وارد نکرده باشد،
   برای کدهای معمولی ساختار ایمیل داخلی می‌سازیم.
  */

  else if (
    !userCode.includes("@")
  ) {

    email =
      userCode.toLowerCase() +
      "@raahbord-shushtar.local";

  }


  if (loginButton) {

    loginButton.disabled = true;

    loginButton.textContent =
      "در حال ورود...";

  }


  try {

    console.log(
      "Trying login:",
      email
    );


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
        "Supabase login error:",
        error
      );

      showLoginError(
        getLoginErrorMessage(error)
      );

      resetLoginButton();

      return false;

    }


    if (!data || !data.user) {

      showLoginError(
        "ورود انجام نشد."
      );

      resetLoginButton();

      return false;

    }


    currentUser =
      data.user;


    console.log(
      "Login successful:",
      currentUser.id
    );


    await loadProfile(
      currentUser.id
    );


  } catch (error) {

    console.error(
      "Login exception:",
      error
    );

    showLoginError(
      "خطا در اتصال به سامانه. دوباره تلاش کنید."
    );

    resetLoginButton();

  }


  return false;

}


/* =========================================================
   LOGIN ERROR
   ========================================================= */

function getLoginErrorMessage(error) {

  if (!error) {

    return "ورود ناموفق بود.";

  }


  const message =
    String(
      error.message || ""
    ).toLowerCase();


  if (
    message.includes(
      "invalid login credentials"
    )
  ) {

    return "کد کاربری یا رمز عبور اشتباه است.";

  }


  if (
    message.includes(
      "email not confirmed"
    )
  ) {

    return "حساب کاربری هنوز تأیید نشده است.";

  }


  if (
    message.includes(
      "too many requests"
    )
  ) {

    return "تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.";

  }


  return (
    error.message ||
    "ورود ناموفق بود."
  );

}


function showLoginError(message) {

  const errorBox =
    document.getElementById(
      "loginError"
    );


  if (!errorBox) {

    alert(message);

    return;

  }


  errorBox.textContent =
    message;

  errorBox.classList.remove(
    "hidden"
  );

}


function resetLoginButton() {

  const button =
    document.getElementById(
      "loginButton"
    );


  if (!button) return;


  button.disabled = false;

  button.textContent =
    "ورود به سامانه";

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile(userId) {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();


    if (error) {

      console.error(
        "Profile error:",
        error
      );

      /*
       اگر پروفایل پیدا نشد،
       کاربر را از Auth خارج می‌کنیم.
      */

      await supabaseClient.auth.signOut();

      showLogin();

      showLoginError(
        "اطلاعات حساب کاربری پیدا نشد."
      );

      return;

    }


    if (!data) {

      await supabaseClient.auth.signOut();

      showLogin();

      showLoginError(
        "پروفایل این حساب در سامانه ثبت نشده است."
      );

      return;

    }


    currentProfile =
      data;


    console.log(
      "Profile loaded:",
      currentProfile
    );


    showApp();


    updateUserInformation();


    await loadDashboard();


    await loadAreas();


    if (
      currentProfile.role ===
      "admin"
    ) {

      await loadUsers();

    }


  } catch (error) {

    console.error(
      "Load profile exception:",
      error
    );

    showLogin();

    showLoginError(
      "خطا در دریافت اطلاعات کاربری."
    );

  }

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const appPage =
    document.getElementById(
      "appPage"
    );


  if (loginPage) {

    loginPage.classList.remove(
      "hidden"
    );

  }


  if (appPage) {

    appPage.classList.add(
      "hidden"
    );

  }


  resetLoginButton();

}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const appPage =
    document.getElementById(
      "appPage"
    );


  if (loginPage) {

    loginPage.classList.add(
      "hidden"
    );

  }


  if (appPage) {

    appPage.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function updateUserInformation() {

  if (!currentProfile) return;


  const nameElement =
    document.getElementById(
      "currentUserName"
    );


  if (nameElement) {

    nameElement.textContent =
      currentProfile.full_name ||
      "کاربر سامانه";

  }


  const profileInfo =
    document.getElementById(
      "profileInfo"
    );


  if (profileInfo) {

    profileInfo.innerHTML = `

      <div>
        <strong>نام:</strong>
        ${escapeHtml(
          currentProfile.full_name || "-"
        )}
      </div>

      <div>
        <strong>کد کاربری:</strong>
        ${escapeHtml(
          currentProfile.user_code || "-"
        )}
      </div>

      <div>
        <strong>نقش:</strong>
        ${getRoleName(
          currentProfile.role
        )}
      </div>

    `;

  }


  const usersNav =
    document.getElementById(
      "usersNav"
    );


  if (usersNav) {

    if (
      currentProfile.role ===
      "admin"
    ) {

      usersNav.classList.remove(
        "hidden"
      );

    } else {

      usersNav.classList.add(
        "hidden"
      );

    }

  }

}


/* =========================================================
   ROLE NAME
   ========================================================= */

function getRoleName(role) {

  switch (role) {

    case "admin":
      return "مدیر اصلی";

    case "area_manager":
      return "مدیر حوزه";

    case "section_manager":
      return "مدیر بخش";

    case "force":
      return "نیرو";

    default:
      return role || "-";

  }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("reports")
        .select(
          "id, created_at, status"
        );


    if (error) {

      console.error(
        "Dashboard error:",
        error
      );

      return;

    }


    /*
      فقط گزارش‌های تأییدشده
      در آمار نهایی محاسبه می‌شوند.
    */

    const reports =
      (data || []).filter(
        report =>
          !report.status ||
          report.status ===
          "approved"
      );


    const total =
      reports.length;


    const now =
      new Date();


    const todayString =
      now.toISOString()
        .slice(0, 10);


    const monthString =
      now.toISOString()
        .slice(0, 7);


    const today =
      reports.filter(
        report =>
          String(
            report.created_at
          ).slice(0, 10) ===
          todayString
      ).length;


    const month =
      reports.filter(
        report =>
          String(
            report.created_at
          ).slice(0, 7) ===
          monthString
      ).length;


    setText(
      "totalReports",
      toPersianNumber(total)
    );


    setText(
      "todayReports",
      toPersianNumber(today)
    );


    setText(
      "monthReports",
      toPersianNumber(month)
    );


    await loadPhotoCount();

  } catch (error) {

    console.error(
      "Dashboard exception:",
      error
    );

  }

}


/* =========================================================
   PHOTO COUNT
   ========================================================= */

async function loadPhotoCount() {

  try {

    const {
      count,
      error
    } =
      await supabaseClient
        .from("report_photos")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        );


    if (error) {

      console.error(
        "Photo count error:",
        error
      );

      return;

    }


    setText(
      "totalPhotos",
      toPersianNumber(
        count || 0
      )
    );


  } catch (error) {

    console.error(
      "Photo count exception:",
      error
    );

  }

}


/* =========================================================
   AREAS
   ========================================================= */

async function loadAreas() {

  const container =
    document.getElementById(
      "areasContainer"
    );


  if (!container) return;


  container.innerHTML =
    "<p>در حال دریافت حوزه‌ها...</p>";


  try {

    let areas = [];


    if (
      currentProfile &&
      currentProfile.role ===
      "admin"
    ) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("areas")
          .select("*")
          .order("id");


      if (error) throw error;


      areas =
        data || [];

    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("user_areas")
          .select(
            "area_id, areas(*)"
          );


      if (error) throw error;


      areas =
        (data || [])
          .map(item =>
            item.areas
          )
          .filter(Boolean);

    }


    if (!areas.length) {

      container.innerHTML =
        "<p>حوزه‌ای برای شما اختصاص داده نشده است.</p>";

      return;

    }


    container.innerHTML =
      areas.map(
        (area, index) => `

          <div
            class="area-card"
            onclick="selectArea(${area.id})"
          >

            <div class="area-number">
              ${toPersianNumber(index + 1)}
            </div>

            <div class="area-name">
              ${escapeHtml(
                area.name || "-"
              )}
            </div>

          </div>

        `
      ).join("");


  } catch (error) {

    console.error(
      "Areas error:",
      error
    );

    container.innerHTML =
      "<p>خطا در دریافت حوزه‌ها.</p>";

  }

}


/* =========================================================
   SELECT AREA
   ========================================================= */

async function selectArea(areaId) {

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


    if (error) throw error;


    selectedArea =
      data;


    const title =
      document.getElementById(
        "selectedAreaTitle"
      );


    if (title) {

      title.textContent =
        selectedArea.name;

    }


    await loadSections();


    showPageById(
      "sectionPage"
    );


  } catch (error) {

    console.error(
      "Select area error:",
      error
    );

    alert(
      "خطا در انتخاب حوزه."
    );

  }

}


/* =========================================================
   SECTIONS
   ========================================================= */

async function loadSections() {

  const container =
    document.getElementById(
      "sectionsContainer"
    );


  if (!container) return;


  container.innerHTML =
    "<p>در حال دریافت بخش‌ها...</p>";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("sections")
        .select("*")
        .order("id");


    if (error) throw error;


    let sections =
      data || [];


    /*
      برای کاربران غیر مدیر،
      بخش‌های اختصاص داده‌شده بررسی می‌شوند.
    */

    if (
      currentProfile &&
      currentProfile.role !==
      "admin"
    ) {

      const {
        data: userSections
      } =
        await supabaseClient
          .from("user_sections")
          .select(
            "section_id"
          )
          .eq(
            "user_id",
            currentUser.id
          );


      const allowedIds =
        new Set(
          (userSections || [])
            .map(item =>
              item.section_id
            )
        );


      if (allowedIds.size > 0) {

        sections =
          sections.filter(
            section =>
              allowedIds.has(
                section.id
              )
          );

      }

    }


    if (!sections.length) {

      container.innerHTML =
        "<p>بخشی برای شما اختصاص داده نشده است.</p>";

      return;

    }


    const icons = [
      "📡",
      "📝",
      "🎥",
      "🎯",
      "🔎",
      "📱"
    ];


    container.innerHTML =
      sections.map(
        (section, index) => `

          <div
            class="section-card"
            onclick="selectSection(${section.id})"
          >

            <div
              style="
                font-size:28px;
                margin-bottom:10px;
              "
            >
              ${icons[index % icons.length]}
            </div>

            <div class="section-name">
              ${escapeHtml(
                section.name || "-"
              )}
            </div>

          </div>

        `
      ).join("");


  } catch (error) {

    console.error(
      "Sections error:",
      error
    );

    container.innerHTML =
      "<p>خطا در دریافت بخش‌ها.</p>";

  }

}


/* =========================================================
   SELECT SECTION
   ========================================================= */

async function selectSection(
  sectionId
) {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("sections")
        .select("*")
        .eq("id", sectionId)
        .single();


    if (error) throw error;


    selectedSection =
      data;


    const areaInput =
      document.getElementById(
        "reportArea"
      );


    const sectionInput =
      document.getElementById(
        "reportSection"
      );


    const description =
      document.getElementById(
        "reportFormDescription"
      );


    if (areaInput) {

      areaInput.value =
        selectedArea
          ? selectedArea.name
          : "";

    }


    if (sectionInput) {

      sectionInput.value =
        selectedSection.name;

    }


    if (description) {

      description.textContent =
        `ثبت گزارش برای بخش ${selectedSection.name}`;

    }


    const dateInput =
      document.getElementById(
        "reportDate"
      );


    if (
      dateInput &&
      !dateInput.value
    ) {

      dateInput.value =
        new Date()
          .toISOString()
          .slice(0, 10);

    }


    showPageById(
      "reportFormPage"
    );


  } catch (error) {

    console.error(
      "Select section error:",
      error
    );

    alert(
      "خطا در انتخاب بخش."
    );

  }

}


/* =========================================================
   SUBMIT REPORT
   ========================================================= */

async function submitReport(event) {

  if (event) {

    event.preventDefault();
    event.stopPropagation();

  }


  if (!currentUser) {

    alert(
      "ابتدا وارد سامانه شوید."
    );

    return false;

  }


  if (!selectedArea || !selectedSection) {

    alert(
      "حوزه و بخش انتخاب نشده است."
  
