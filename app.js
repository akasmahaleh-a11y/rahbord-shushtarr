<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>سامانه راهبرد شوشتر</title>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Tahoma, Arial, sans-serif;
            background: #f4f7fb;
            color: #172033;
        }

        button,
        input,
        textarea,
        select {
            font-family: inherit;
        }

        /* ================= LOGIN ================= */

        #loginPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
                linear-gradient(
                    135deg,
                    #0b5ed7,
                    #0a2f6b
                );
        }

        .login-box {
            width: 100%;
            max-width: 430px;
            background: white;
            border-radius: 22px;
            padding: 35px 28px;
            box-shadow:
                0 20px 60px rgba(0,0,0,.25);
        }

        .logo {
            width: 75px;
            height: 75px;
            margin: 0 auto 18px;
            border-radius: 20px;
            background: #0b5ed7;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: bold;
        }

        .login-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .login-subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 28px;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 14px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            border: 1px solid #d8e0eb;
            border-radius: 12px;
            padding: 13px;
            font-size: 15px;
            outline: none;
            background: white;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            border-color: #0b5ed7;
        }

        .login-button {
            width: 100%;
            border: 0;
            border-radius: 13px;
            padding: 14px;
            background: #0b5ed7;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        .login-button:hover {
            background: #084db5;
        }

        .login-button:disabled {
            opacity: .7;
        }

        #loginError {
            color: #dc3545;
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
        }

        /* ================= DASHBOARD ================= */

        #dashboard {
            display: none;
            min-height: 100vh;
        }

        .app-layout {
            display: flex;
            min-height: 100vh;
        }

        /* ================= SIDEBAR ================= */

        #sidebar {
            width: 270px;
            background: #092f6d;
            color: white;
            padding: 22px 15px;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            z-index: 1000;
            transition: .3s;
        }

        .sidebar-logo {
            text-align: center;
            font-size: 21px;
            font-weight: bold;
            padding: 15px 5px 25px;
        }

        .user-badge {
            display: block;
            text-align: center;
            background: rgba(255,255,255,.1);
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 22px;
            font-size: 13px;
        }

        .menu-btn {
            width: 100%;
            border: 0;
            background: transparent;
            color: white;
            padding: 13px 14px;
            margin-bottom: 7px;
            border-radius: 11px;
            text-align: right;
            cursor: pointer;
            font-size: 14px;
        }

        .menu-btn:hover,
        .menu-btn.active {
            background: rgba(255,255,255,.14);
        }

        .logout-btn {
            margin-top: 25px;
            background: #dc3545;
        }

        .logout-btn:hover {
            background: #bb2d3b;
        }

        /* ================= MAIN ================= */

        .main-content {
            width: calc(100% - 270px);
            margin-right: 270px;
            padding: 25px;
        }

        .topbar {
            background: white;
            border-radius: 15px;
            padding: 18px 22px;
            margin-bottom: 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 18px rgba(0,0,0,.05);
        }

        .page-title {
            font-size: 21px;
            font-weight: bold;
        }

        .mobile-menu {
            display: none;
            border: 0;
            background: #0b5ed7;
            color: white;
            border-radius: 10px;
            padding: 10px 14px;
            cursor: pointer;
        }

        /* ================= PAGES ================= */

        .page {
            display: none;
        }

        #dashboardPage {
            display: block;
        }

        .welcome-box {
            background: linear-gradient(
                135deg,
                #0b5ed7,
                #174ea6
            );
            color: white;
            border-radius: 18px;
            padding: 25px;
            margin-bottom: 22px;
        }

        .welcome-box h2 {
            margin-top: 0;
        }

        /* ================= STATS ================= */

        .stats-grid {
            display: grid;
            grid-template-columns:
                repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 25px;
        }

        .stat-card {
            background: white;
            border-radius: 16px;
            padding: 22px;
            box-shadow:
                0 4px 18px rgba(0,0,0,.05);
        }

        .stat-title {
            color: #718096;
            font-size: 13px;
            margin-bottom: 12px;
        }

        .stat-number {
            font-size: 30px;
            font-weight: bold;
            color: #0b5ed7;
        }

        /* ================= SECTION ================= */

        .section-title {
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 18px;
        }

        .areas-grid {
            display: grid;
            grid-template-columns:
                repeat(2, 1fr);
            gap: 15px;
        }

        .area-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 15px;
            padding: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            text-align: right;
            transition: .2s;
        }

        .area-card:hover {
            transform: translateY(-2px);
            border-color: #0b5ed7;
            box-shadow:
                0 5px 18px rgba(0,0,0,.07);
        }

        .area-number {
            min-width: 42px;
            height: 42px;
            border-radius: 12px;
            background: #e8f1ff;
            color: #0b5ed7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .area-name {
            font-size: 14px;
            font-weight: bold;
            line-height: 1.7;
        }

        /* ================= SELECTED AREA ================= */

        #selectedAreaPanel {
            display: none;
            margin-top: 25px;
        }

        .selected-area {
            background: white;
            border-radius: 18px;
            padding: 22px;
            box-shadow:
                0 4px 18px rgba(0,0,0,.05);
        }

        .selected-area-title {
            color: #0b5ed7;
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .sections-grid {
            display: grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap: 15px;
        }

        .section-card {
            background: #f8faff;
            border: 1px solid #dce8f8;
            border-radius: 15px;
            padding: 20px;
            cursor: pointer;
            text-align: center;
            transition: .2s;
        }

        .section-card:hover {
            background: #edf5ff;
            border-color: #0b5ed7;
            transform: translateY(-2px);
        }

        .section-card-icon {
            font-size: 30px;
            margin-bottom: 10px;
        }

        .section-card-name {
            font-weight: bold;
        }

        /* ================= SUBJECTS ================= */

        #subjectsPanel {
            display: none;
            margin-top: 22px;
            background: white;
            border-radius: 18px;
            padding: 22px;
        }

        .subjects-grid {
            display: grid;
            grid-template-columns:
                repeat(2, 1fr);
            gap: 12px;
        }

        .subject-btn {
            border: 1px solid #dce8f8;
            background: #f8faff;
            padding: 14px;
            border-radius: 12px;
            cursor: pointer;
            text-align: right;
        }

        .subject-btn:hover {
            border-color: #0b5ed7;
            background: #edf5ff;
        }

        /* ================= REPORT FORM ================= */

        #reportFormPanel {
            display: none;
            margin-top: 22px;
            background: white;
            border-radius: 18px;
            padding: 22px;
        }

        .report-form-title {
            font-size: 19px;
            font-weight: bold;
            color: #0b5ed7;
            margin-bottom: 20px;
        }

        .submit-report-btn {
            width: 100%;
            border: 0;
            background: #0b5ed7;
            color: white;
            padding: 14px;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
        }

        /* ================= MESSAGES ================= */

        .loading,
        .empty-box,
        .error-box {
            background: white;
            padding: 20px;
            border-radius: 14px;
            text-align: center;
        }

        .error-box {
            color: #dc3545;
        }

        /* ================= MOBILE ================= */

        @media (max-width: 900px) {

            #sidebar {
                transform: translateX(100%);
            }

            #sidebar.open {
                transform: translateX(0);
            }

            .main-content {
                width: 100%;
                margin-right: 0;
                padding: 15px;
            }

            .mobile-menu {
                display: block;
            }

            .stats-grid {
                grid-template-columns:
                    repeat(2, 1fr);
            }

            .sections-grid {
                grid-template-columns:
                    repeat(2, 1fr);
            }

        }

        @media (max-width: 600px) {

            .login-box {
                padding: 28px 20px;
            }

            .stats-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .stat-card {
                padding: 16px;
            }

            .stat-number {
                font-size: 25px;
            }

            .areas-grid,
            .subjects-grid,
            .sections-grid {
                grid-template-columns: 1fr;
            }

            .topbar {
                padding: 14px;
            }

            .page-title {
                font-size: 18px;
            }
        }

    </style>
</head>

<body>


<!-- ==================================================
     LOGIN
================================================== -->

<div id="loginPage">

    <div class="login-box">

        <div class="logo">
            ر
        </div>

        <div class="login-title">
            سامانه راهبرد شوشتر
        </div>

        <div class="login-subtitle">
            سامانه مدیریت و ثبت گزارشات
        </div>


        <!-- مهم: جلوگیری از Refresh شدن صفحه -->

        <form
            id="loginForm"
            onsubmit="event.preventDefault(); login();"
        >

            <div class="form-group">

                <label for="email">
                    کد کاربری / ایمیل
                </label>

                <input
                    type="text"
                    id="email"
                    autocomplete="username"
                    placeholder="کد کاربری یا ایمیل"
                >

            </div>


            <div class="form-group">

                <label for="password">
                    رمز عبور
                </label>

                <input
                    type="password"
                    id="password"
                    autocomplete="current-password"
                    placeholder="رمز عبور"
                >

            </div>


            <button
                type="submit"
                id="loginButton"
                class="login-button"
            >
                ورود به سامانه
            </button>


            <div id="loginError"></div>

        </form>

    </div>

</div>


<!-- ==================================================
     DASHBOARD
================================================== -->

<div id="dashboard">

    <div class="app-layout">


        <!-- SIDEBAR -->

        <aside id="sidebar">

            <div class="sidebar-logo">
                سامانه راهبرد شوشتر
            </div>

            <span class="user-badge">
                مدیر اصلی
            </span>


            <button
                class="menu-btn active"
                onclick="showPage('dashboardPage', this)"
            >
                🏠 داشبورد
            </button>


            <button
                class="menu-btn"
                onclick="showPage('areasPage', this)"
            >
                📍 انتخاب حوزه
            </button>


            <button
                class="menu-btn"
                onclick="showPage('reportsPage', this)"
            >
                📋 گزارش‌ها
            </button>


            <button
                class="menu-btn"
                onclick="showPage('settingsPage', this)"
            >
                ⚙️ تنظیمات
            </button>


            <button
                class="menu-btn logout-btn"
                onclick="logout()"
            >
                🚪 خروج
            </button>

        </aside>


        <!-- MAIN -->

        <main class="main-content">


            <div class="topbar">

                <div
                    id="pageTitle"
                    class="page-title"
                >
                    داشبورد
                </div>


                <button
                    class="mobile-menu"
                    onclick="toggleMenu()"
                >
                    ☰ منو
                </button>

            </div>


            <!-- ================= DASHBOARD PAGE ================= -->

            <section
                id="dashboardPage"
                class="page"
            >

                <div class="welcome-box">

                    <h2>
                        خوش آمدید 👋
                    </h2>

                    <div>
                        به سامانه راهبرد شوشتر خوش آمدید.
                    </div>

                </div>


                <div class="stats-grid">

                    <div class="stat-card">

                        <div class="stat-title">
                            کل گزارش‌های تأیید شده
                        </div>

                        <div
                            id="totalReports"
                            class="stat-number"
                        >
                            0
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-title">
                            گزارش‌های امروز
                        </div>

                        <div
                            id="todayReports"
                            class="stat-number"
                        >
                            0
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-title">
                            گزارش‌های این ماه
                        </div>

                        <div
                            id="monthReports"
                            class="stat-number"
                        >
                            0
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-title">
                            تعداد تصاویر
                        </div>

                        <div
                            id="photoCount"
                            class="stat-number"
                        >
                            0
                        </div>

                    </div>

                </div>

            </section>


            <!-- ================= AREAS PAGE ================= -->

            <section
                id="areasPage"
                class="page"
            >

                <div class="section-title">
                    انتخاب حوزه
                </div>


                <div
                    id="areasContainer"
                    class="areas-grid"
                >

                    <div class="loading">
                        در حال دریافت حوزه‌ها...
                    </div>

                </div>


                <!-- حوزه انتخاب شده -->

                <div
                    id="selectedAreaPanel"
                >

                    <div class="selected-area">

                        <div
                            id="selectedAreaName"
                            class="selected-area-title"
                        >
                            حوزه
                        </div>


                        <div class="section-title">
                            انتخاب بخش
                        </div>


                        <div class="sections-grid">


                            <div
                                class="section-card"
                                onclick="openSection('شمسا')"
                            >

                                <div class="section-card-icon">
                                    📱
                                </div>

                                <div class="section-card-name">
                                    شمسا
                                </div>

                            </div>


                            <div
                                class="section-card"
                                onclick="openSection('متنا')"
                            >

                                <div class="section-card-icon">
                                    🎬
                                </div>
