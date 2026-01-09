import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCcJw6nlW12TBqD_WvvQruWaeyhF_GNZZc",
  authDomain: "expenestracker-aditya-s.firebaseapp.com",
  projectId: "expenestracker-aditya-s",
  storageBucket: "expenestracker-aditya-s.firebasestorage.app",
  messagingSenderId: "470638758410",
  appId: "1:470638758410:web:e39a030a4af770d4316df3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Configure auth based on platform
export const auth = Platform.OS === 'web' 
  ? getAuth(app)  // Use standard web auth
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);