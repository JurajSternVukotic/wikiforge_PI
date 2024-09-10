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

      <button @click="loginWithGoogle">Login with Google</button>

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
// Import Firebase auth functions from your firebase.js
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";

export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      isLogin: true, // toggle between login and register
      errorMessage: "", // to hold error message
    };
  },
  methods: {
    toggleAuthMode() {
      this.isLogin = !this.isLogin;
      this.errorMessage = ""; // Clear error message when switching modes
    },
    loginWithEmail() {
      this.errorMessage = ""; // Clear any previous error message
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          const user = userCredential.user;
          if (!user.emailVerified) {
            this.errorMessage = "Please verify your email before logging in.";
            return;
          }
          this.$router.push("/profile");
        })
        .catch((error) => {
          this.errorMessage = error.message; // Set the error message
        });
    },
    registerWithEmail() {
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      this.errorMessage = ""; // Clear any previous error message
      createUserWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log(user);
          sendEmailVerification(user)
            .then(() => {
              this.errorMessage =
                "Verification email sent! Please check your inbox.";
            })
            .catch((verificationError) => {
              console.log(verificationError);
              this.errorMessage = "Failed to send verification email.";
            });

          this.$router.push("/profile");
        })
        .catch((error) => {
          this.errorMessage = error.message; // Set the error message
        });
    },
    loginWithGoogle() {
      this.errorMessage = ""; // Clear any previous error message
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          console.log(result);
          this.$router.push("/profile");
        })
        .catch((error) => {
          this.errorMessage = error.message; // Set the error message
        });
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
</style>
