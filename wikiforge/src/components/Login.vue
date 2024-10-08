<template>
  <div class="auth-container">
    <div class="auth-form">
      <h1>{{ isLogin ? "Login" : "Register" }}</h1>

      <!-- Display error message -->
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <div v-if="isLogin">
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Password" />
        <button @click="loginWithEmail">Login with Email</button>
        <!-- Forgot Password link -->
      </div>

      <div v-else>
        <input v-model="username" type="text" placeholder="Username" />
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Password" />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Repeat Password"
        />
        <button @click="registerWithEmail">Register</button>
      </div>

      <!-- Reset password form (shown when forgot password is clicked) -->
      <div v-if="isResetPassword">
        <input
          v-model="resetEmail"
          type="email"
          placeholder="Enter your email"
        />
        <button @click="resetPassword">Send Reset Password Email</button>
        <p v-if="resetMessage" class="success">{{ resetMessage }}</p>
      </div>

      <button @click="loginWithGoogle">Login with Google</button>
      <p @click="toggleResetPassword" class="forgot-password-link">
        Forgot Password?
      </p>
      <p>
        {{ isLogin ? "Need an account?" : "Already have an account?" }}
        <span @click="toggleAuthMode">{{
          isLogin ? "Register" : "Login"
        }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { auth } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      isLogin: true,
      isResetPassword: false,
      errorMessage: "",
      resetEmail: "",
      resetMessage: "",
    };
  },
  methods: {
    toggleAuthMode() {
      this.isLogin = !this.isLogin;
      this.errorMessage = ""; // Clear error message when switching modes
    },
    toggleResetPassword() {
      this.isResetPassword = !this.isResetPassword;
      this.errorMessage = "";
      this.resetMessage = "";
    },

    // Login method with email verification check
    loginWithEmail() {
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          const user = userCredential.user;

          if (!user.emailVerified) {
            this.errorMessage = "Please verify your email before logging in.";

            // Log the user out immediately
            return auth
              .signOut()
              .then(() => {
                this.$router.push("/verify-email");
              })
              .catch((signOutError) => {
                // Handle any sign-out errors
                console.error("Sign out failed:", signOutError);
              });
          }

          // If email is verified, continue with Firestore or redirect to profile page
          this.$router.push("/profile");
        })
        .catch((error) => {
          console.error("Login failed:", error);

          if (error.code === "auth/wrong-password") {
            this.errorMessage = "Incorrect password. Please try again.";
          } else if (error.code === "auth/user-not-found") {
            this.errorMessage = "No account found with this email.";
          } else {
            this.errorMessage = "Login failed. Please try again.";
          }
        });
    },
    // Reset password method
    resetPassword() {
      if (!this.resetEmail) {
        this.errorMessage = "Please enter your email.";
        return;
      }

      sendPasswordResetEmail(auth, this.resetEmail)
        .then(() => {
          this.resetMessage =
            "Password reset email sent. Please check your inbox.";
        })
        .catch((error) => {
          this.errorMessage = error.message;
        });
    },

    // Register method: Set displayName to username and send verification email
    registerWithEmail() {
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Passwords do not match!";
        return;
      }

      // Register user and set the displayName to the username
      createUserWithEmailAndPassword(auth, this.email, this.password)
        .then(async (userCredential) => {
          const user = userCredential.user;

          // Set the user's display name to the entered username
          await updateProfile(user, {
            displayName: this.username,
          });

          const db = getFirestore();
          const userDoc = doc(db, "users", user.uid);

          // Initialize the user document with friends and friendRequests arrays
          await setDoc(userDoc, {
            displayName: this.username,
            email: user.email,
            biography: "",
            interests: "",
            isAdmin: false,
            friends: [], // Initialize empty friends array
            friendRequests: [], // Initialize empty friendRequests array
          });

          // Send email verification
          await sendEmailVerification(user);
          await auth.signOut(); // Log out after registration until email is verified

          // Redirect to the VerifyEmail page
          this.$router.push("/verify-email");

          // Optionally, show a message to the user
          this.errorMessage =
            "Verification email sent. Please check your inbox.";
        })
        .catch((error) => {
          this.errorMessage = error.message;
        });
    },
    async loginWithGoogle() {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the Firestore user document exists
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        // If user document does not exist, create it
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            displayName: user.displayName || "Anonymous", // Use displayName from Google or fallback to 'Anonymous'
            email: user.email,
            friends: [],
            friendRequests: [],
          });
        }

        // Redirect or proceed with further actions after login
        this.$router.push("/profile");
      } catch (error) {
        console.error("Error logging in with Google:", error);
        this.errorMessage = "Login failed. Please try again.";
      }
    },
  },
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f4;
}

.auth-form {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #555;
}

p {
  margin-top: 20px;
}

span {
  color: blue;
  cursor: pointer;
}

.error {
  color: red;
  font-size: 14px;
  margin-bottom: 15px;
}
.forgot-password-link {
  color: blue;
  cursor: pointer;
  margin-top: 10px;
}
</style>
