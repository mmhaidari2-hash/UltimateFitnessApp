# Ultimate Fitness App

An offline-first fitness tracker built with React Native and Expo. The app runs in Expo Go on iPhone and Android and stores its data on the device.

## Run on iPhone

1. Install [Node.js LTS](https://nodejs.org/) and the **Expo Go** app from the App Store.
2. Clone this repository and install dependencies:

   ```sh
   git clone https://github.com/mmhaidari2-hash/UltimateFitnessApp.git
   cd UltimateFitnessApp
   npm install
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
