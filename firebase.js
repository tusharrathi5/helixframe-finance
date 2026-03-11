import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            "AIzaSyACmhIIqeQVX8WrON7vdSY8ceWOwaoWOZQ",
  authDomain:        "helixframe-finance.firebaseapp.com",
  databaseURL:       "https://helixframe-finance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "helixframe-finance",
  storageBucket:     "helixframe-finance.firebasestorage.app",
  messagingSenderId: "217515018788",
  appId:             "1:217515018788:web:b2f6db34a5629c876326b1",
  measurementId:     "G-YC461V29N1"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
