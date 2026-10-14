# Ultimate Fitness App

An offline-first fitness tracker built with React Native and Expo, intended for Expo Go on iPhone and Android, with device-local storage. Physical-device operation has not yet been verified.

## Source and validation

This follow-up includes the actual app source and unchanged dependency lockfile from
[PR #1](https://github.com/mmhaidari2-hash/UltimateFitnessApp/pull/1),
commit `792e7726b5db5f9d118d6914bca7fa6b3ba9652c`. It depends on that implementation;
it does not add duplicate app features or merge PR #1. Until the app is merged,
the default branch may still contain only the original README.

The **App validation** workflow (`.github/workflows/app-validation.yml`) checks out
its own revision, installs with `npm ci`, runs TypeScript, Expo dependency checks
and Expo Doctor, exports the iOS JavaScript/Hermes bundle, and briefly checks
Metro and the iOS manifest on localhost. It uses read-only repository permission,
no custom secrets, no public tunnel, and stops the server afterward. Each run
records step outcomes in its job summary and keeps logs, audit results and any
iOS export in the `app-validation` artifact for seven days. Expo Doctor needs
access to external Expo/React Native services; failures remain visible.

Verified in the coding sandbox with Node 24.21.0:

- `npm ci`, `npm run typecheck`, and `npx expo export --platform ios` succeeded.
- SDK 57's bundled dependency map matches the declared native dependencies;
  online version validation fell back to this map because networking was disabled.
- Expo Doctor passed 19/21 checks; Expo schema and React Native Directory checks
  could not complete because their external services were unreachable.
- Localhost Metro status, an iOS manifest, and an iOS development bundle responded.
  React Native DevTools also logged a desktop sandbox installation error; this
  does not establish that its desktop UI works.
- `npm audit` reported 15 high-severity affected dependency entries, rooted in
  `braces <=3.0.3` and `node-forge <=1.4.0` in the build tooling. At verification,
  npm had no newer patched release of either package. The workflow reports the
  audit separately without claiming a clean security result.

These are sandbox results, not a claim that a GitHub Actions run has passed.
An iOS export is **not** an IPA, a signed native/Xcode build, an iPhone/simulator
test, or a live preview. No physical iPhone testing or public preview was achieved.

## گزارش فارسی ادامهٔ اعتبارسنجی — ۱۴ اکتبر ۲۰۲۶

### منبع و محدوده

این ادامه در [PR #3](https://github.com/mmhaidari2-hash/UltimateFitnessApp/pull/3)
ثبت می‌شود، چون جلسهٔ جدید به آن شاخه متصل شده است؛ شاخهٔ
[PR #2](https://github.com/mmhaidari2-hash/UltimateFitnessApp/pull/2) تغییر نکرد.
این PR وابسته به PR #2 است، نه برنامه‌ای جدید یا جایگزین آن.
تمام فایل‌های برنامه، workflow و lockfile عیناً از head آن، یعنی
`4bc0b3f804b6a60a784200b1c2f1c2e48858ef6e`، گرفته و با hash مقایسه شدند.
تغییر اختصاصی این ادامه، همین گزارش است؛ قابلیت، وابستگی یا سطح دسترسی جدیدی
اضافه نشده است. هیچ PR ادغام نشده است.

### نتیجهٔ واقعی فرمان‌ها در sandbox

محیط: Node `24.21.0`، npm `11.19.0`؛ این جدول **نتیجهٔ GitHub Actions نیست**.
مسیرهای `/tmp/fitness-validation/` فقط شواهد موقت این جلسه هستند و artifact
ماندگار یا قابل دانلود از Actions محسوب نمی‌شوند.

| فرمان / بررسی | نتیجه |
| --- | --- |
| `npm ci --no-audit --no-fund` | خروجی ۰؛ نصب ۴۷۲ بسته با lockfile بدون تغییر |
| `npm run typecheck` | خروجی ۰ |
| `CI=1 EXPO_NO_TELEMETRY=1 npx --no-install expo install --check` | خروجی ۰؛ فقط نقشهٔ محلی `expo/bundledNativeModules.json`، با هشدار unreliable offline validation؛ نه تأیید آنلاین |
| `CI=1 EXPO_NO_TELEMETRY=1 npx --yes expo-doctor@1.20.4` | خروجی ۱؛ ۱۹/۲۱ بررسی موفق؛ schema با `ENOTFOUND exp.host` و React Native Directory با خطای پاسخ سرویس کامل نشدند |
| `CI=1 EXPO_NO_TELEMETRY=1 npx --no-install expo export --platform ios --output-dir /tmp/fitness-validation/ios-export --source-maps` | خروجی ۰؛ ۵۹۹ ماژول، فایل Hermes حدود ۱٫۲ MB و source map حدود ۳٫۷ MB |
| `expo start --localhost --port 8081` با `CI=1` و `EXPO_NO_TELEMETRY=1`، مهلت ۱۲۰ ثانیه و توقف فرایند در پایان | وضعیت `packager-status:running`، manifest معتبر iOS و bundle توسعهٔ ۳٬۹۳۵٬۷۲۰ بایتی دریافت شد |
| `npm audit --json` و `npm audit --omit=dev --json` | هر دو خروجی ۱؛ ۱۵ high، صفر critical/moderate/low؛ هنوز حل نشده |
| `npm view braces version` / `npm view braces dist-tags --json` | آخرین نسخه و تنها tag: `3.0.3`؛ همچنان آسیب‌پذیر |
| `npm view node-forge version` / `npm view node-forge dist-tags --json` | آخرین نسخه و تنها tag: `1.4.0`؛ همچنان آسیب‌پذیر |

در smoke نخست، وضعیت و manifest پاسخ دادند ولی آدرس bundle در manifest،
`127.0.0.1:8081`، خطای `ECONNREFUSED` داد. در تکرار، فقط hostname درخواست
bundle به همان `localhost` سرور تغییر کرد و دریافت موفق بود؛ خود برنامه یا
manifest دست‌کاری نشد. بعد از توقف، درخواست وضعیت با curl خروجی ۷
(عدم اتصال) داد. لاگ همچنین خطای نصب **React Native DevTools دسکتاپ**
به‌علت SUID sandbox و هشدار resolve نشدن assets را ثبت کرد؛ sandbox غیرفعال
نشد و کارکرد DevTools، آیکن‌ها یا فونت‌ها روی دستگاه تأیید نشده است.

### ممیزی امنیت وابستگی‌ها

۱۵ ورودی high به معنی ۱۵ آسیب‌پذیری مستقل نیست: دو advisory ریشه و
بسته‌های وابستهٔ متأثر در درخت npm شمرده شده‌اند:

- [`GHSA-vfj7-8cjw-p6xm`](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  `braces <=3.0.3`، stack-exhaustion/DoS با الگوهای بسیار تو‌در‌تو.
  مسیر نصب: `expo@57.0.29 → @expo/metro@56.0.2 → metro-file-map@0.84.5
  → micromatch@4.0.8 → braces@3.0.3`.
- [`GHSA-86w9-cpqp-85rv`](https://github.com/advisories/GHSA-86w9-cpqp-85rv):
  `node-forge <=1.4.0`، پذیرش ساختار اضافی در بررسی امضای RSA PKCS#1 v1.5.
  مسیر نصب: `expo → @expo/cli@57.0.30 → node-forge@1.4.0` و
  `@expo/cli → @expo/code-signing-certificates@0.0.6 → node-forge`.

این مسیرها متعلق به ابزار ساخت/Metro و گواهی/امضای Expo CLI هستند؛ چون Expo
وابستگی اصلی است، `--omit=dev` آن‌ها را حذف نمی‌کند. در source map همین
خروجی iOS (۵۹۵ source)، هیچ source از `braces` یا `node-forge` دیده نشد؛
این شاهد محدود به همین bundle است، نه اثبات امنیت همهٔ buildها یا سرویس‌های Expo.
ابزارهای ساخت همچنان متأثرند؛ ورودی/الگوی نامطمئن یا گواهی نامطمئن را نباید
امن فرض کرد. سرور آزمایشی فقط localhost بود، نه شبکهٔ عمومی یا tunnel.

بازبینی مستقل امنیتیِ read-only روی همین SHA نیز مسیر بهره‌برداری قابل‌اثبات
از ورودی نامطمئن برنامه پیدا نکرد: الگوهای Metro از تنظیمات ابزار می‌آیند؛
استفادهٔ بررسی‌شده از node-forge مربوط به گواهی محلی/امضای تولیدشده در ابزار
است و تنظیم update-signing یا EAS در برنامه وجود ندارد. این نتیجه نه
آسیب‌پذیری وابستگی را رفع می‌کند و نه مجوز اعلام «امنیت کامل» است.

رجیستری هنگام بررسی patch منتشرشده‌ای برای این دو ریشه ارائه نکرد.
`npm audit` تغییر به `expo@44.0.6` و `react-native@0.72.17` را پیشنهاد می‌دهد؛
این‌ها تنزل ناسازگار از SDK 57 / React Native 0.86 هستند، نه اصلاح امن سازگار.
بنابراین `npm audit fix --force`، override نسخهٔ ناموجود، حذف audit یا ارتقای
ناسازگار انجام نشد. `react-native` جدیدتر (`0.87.1`) به‌تنهایی سازگاری با این
SDK یا رفع دو ریشه را ثابت نمی‌کند. مانع امنیتی تا انتشار patch و بررسی مجدد
باقی است؛ audit موجود workflow همچنان شکست را جداگانه و آشکار گزارش می‌کند.

### Actions: متوقف برای اقدام، نه CI موفق

دو اجرای موردنظر برای همان SHA منبع بررسی شدند:

- [run `38645902709`](https://github.com/mmhaidari2-hash/UltimateFitnessApp/actions/runs/38645902709):
  رویداد `pull_request`، وضعیت `completed`، نتیجهٔ `action_required`.
- [run `38645897457`](https://github.com/mmhaidari2-hash/UltimateFitnessApp/actions/runs/38645897457):
  رویداد `push`، وضعیت `completed`، نتیجهٔ `action_required`.

`actions_get`، `actions_list(list_workflow_jobs)` و `get_job_logs` برای هر دو
بررسی شدند: **صفر job** و هیچ لاگ job شکست‌خورده وجود ندارد؛ بررسی PR #2 نیز
صفر check run و status کلی `pending` با صفر status نشان داد.
پس هیچ فرمان نصب/ساخت در این دو run اجرا نشده و هیچ artifact موفقی نداریم.
اجرای قدیمی‌تر `38645580069` نیز `failure` با صفر job دارد؛ از این داده‌ها
علت آن قابل تعیین نیست و موفق تلقی نمی‌شود.

طبق [مستند رسمی تأیید workflowهای Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings#allowing-github-actions-workflows-to-run-automatically-when-copilot-pushes)،
پیش‌فرض GitHub اجرای workflow بعد از push عامل را تا تأیید انسانی متوقف می‌کند.
این با `action_required` و نبود job سازگار است؛ اما APIهای در دسترس متن دقیق
علت یا تنظیم approval این مخزن را نشان ندادند. صفحهٔ run از ابزار مرورگر
قابل خواندن نبود و درخواست عمومی REST در sandbox مسدود شد؛ تنظیمی که
مشاهده نشده، قطعی گزارش نمی‌شود.

**اقدام باقی‌ماندهٔ نگه‌دارنده:** تغییرات PR #2 و این پیگیری را بازبینی کند،
در merge box گزینهٔ **Approve and run workflows** را بررسی و در صورت پذیرش
اجرا کند؛ اگر آن گزینه نیست، پیام دقیق صفحهٔ run و تنظیمات approval مخزن را
بررسی کند. سپس نتیجهٔ واقعی jobها، summary و artifact همان SHA ارزیابی شود.
در این جلسه تأیید، retry/dispatch برای دورزدن محدودیت، تغییر تنظیمات امنیتی
یا افزایش permission انجام نشد. workflow با `contents: read` و
`persist-credentials: false` بدون تغییر باقی ماند؛ نقص اجرایی جدیدی از
runهای بدون job اثبات نشد.

پس از ثبت گزارش در commit
`33fa8dfc7ad7cf0ec574fdc850d8a2851b423aff`، اجرای PR #3
[`38651131659`](https://github.com/mmhaidari2-hash/UltimateFitnessApp/actions/runs/38651131659)
و اجرای push
[`38651125270`](https://github.com/mmhaidari2-hash/UltimateFitnessApp/actions/runs/38651125270)
نیز `action_required` با صفر job بودند؛ این پیگیری هم CI موفق ندارد.

### بازبینی نهایی

- اسکن اسرار روی هر ۱۴ فایل تغییرکرده/بازیابی‌شده: موردی پیدا نشد.
- CodeQL روی `javascript` و `actions`: صفر alert؛ این جایگزین رفع advisoryهای npm نیست.
- ابزار داخلی Code Review موجود نبود (`autofind binary not found`)؛ بنابراین
  نتیجهٔ خالی آن «بازبینی موفق» تلقی نشد. بازبین مستقلِ جایگزین، diff نسبت
  به SHA منبع PR #2 و شواهد فرمان‌ها را read-only بررسی کرد و ایراد مهمی نیافت.
- بازبینی امنیتی مستقل نیز انجام شد؛ نتیجه و محدودیت‌هایش در بخش ممیزی بالا
  ثبت است. تغییری در کد اجرایی نسبت به PR #2 وجود ندارد.

**جمع‌بندی:** نصب، typecheck، export جاوااسکریپت iOS و smoke محدود sandbox
انجام شد؛ دو بررسی آنلاین Expo، ۱۵ ورودی امنیتی و تأیید/اجرای واقعی Actions
باز هستند. خروجی Hermes **IPA امضاشده یا build بومی Xcode نیست**.
هیچ تست iPhone/simulator، انتشار، استقرار، tunnel، استفاده از credential یا
پیش‌نمایش زنده انجام نشده است؛ تکمیل همهٔ موارد در این محیط ممکن نبود.

## Run on iPhone

1. Install [Node.js LTS](https://nodejs.org/) and the **Expo Go** app from the App Store.
2. Clone this repository and install dependencies:

   ```sh
   git clone --branch copilot/mmhaidari2-hashultimatefitnessapp-again https://github.com/mmhaidari2-hash/UltimateFitnessApp.git
   cd UltimateFitnessApp
   npm ci
   ```

3. Start Expo on the same Wi-Fi network as your phone:

   ```sh
   npx expo start
   ```

   Use a trusted local network; Expo's default LAN development server is not
   intended for exposure to untrusted networks or the public internet.

4. Scan the QR code with the iPhone Camera app and open it in Expo Go.

## Included

- Local email/password sign-up and login, profile editing, and device-only AsyncStorage persistence
- Workout creation, editing, deletion, exercise logging, and completion tracking
- Completion-based progressive-overload suggestions, XP, levels, streaks, ten workout badges, a daily challenge, and a rest timer
- Weekly training volume, exercise progress, and muscle-group summaries
- Searchable exercise video links with level and muscle-group filters
- English/Persian interface, dark/light appearance, kg/lb preference, JSON data export/import, and reset

This is a personal, offline-first MVP. Accounts and workouts are stored only on the current device; local sign-in is not a production authentication service, and there is no cloud sync or remote leaderboard. Video lessons open YouTube search results and therefore require internet access. Back up data using **Export data** before deleting the app or resetting its storage.

## Commands

- `npm start` — start Expo
- `npm run typecheck` — check TypeScript types
