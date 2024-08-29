import { auth, db, googleProvider } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export const authService = {
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return userCredential.user
  },
  async register(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
      })
      return userCredential.user
    } catch (error) {
      console.error('Detailed registration error:', error.code, error.message)
      throw error
    }
  },
  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        username: user.displayName || user.email.split('@')[0],
        email: user.email,
      })
    }
    return user
  },

  logout() {
    return signOut(auth)
  },

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        resolve(user)
      }, reject)
    })
  },
}
