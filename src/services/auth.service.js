import { auth, db } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export const authService = {
  async login(usernameOrEmail, password) {
    // You might need to check if it's a username or email and handle accordingly
    return signInWithEmailAndPassword(auth, usernameOrEmail, password)
  },
  async register(email, password, username) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    // Store additional user info in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: username,
      email: email,
    })
    return userCredential
  },

  logout() {
    return signOut(auth)
  },

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe()
          resolve(user)
        },
        reject
      )
    })
  },

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    // Check if it's a new user and store additional info if needed
    const isNewUser = result.additionalUserInfo.isNewUser
    if (isNewUser) {
      await setDoc(doc(db, 'users', result.user.uid), {
        username: result.user.displayName,
        email: result.user.email,
      })
    }
    return result
  },
}
