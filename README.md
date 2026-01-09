# ExpenseTracker (Expo + Firebase)

Simple budget tracker with email auth and Firestore persistence.

🌐 **Live Demo**: [https://aditya3525.github.io/ExpenseTracker/](https://aditya3525.github.io/ExpenseTracker/)

## Prerequisites
- Node.js LTS
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Web config (Auth + Firestore enabled)

## Setup
1) Install deps
```bash
npm install
```
2) Configure Firebase
- Copy your Firebase web config into `firebaseConfig.js` (already referenced by the app).
- Ensure Authentication (Email/Password) and Firestore are enabled.

3) Run the app
```bash
npm start       # start Metro
npm run android # or npm run ios / npm run web
```

## Notes
- Expenses are scoped per user via `userId` in Firestore.
- Long-press an expense to delete it.
- Adjust currency symbol/formatting in `App.js` via `formatCurrency` if needed.
