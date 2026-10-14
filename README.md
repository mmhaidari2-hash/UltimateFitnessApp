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
