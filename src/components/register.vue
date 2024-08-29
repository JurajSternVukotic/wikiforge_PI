<template>
  <div class="register">
    <h2>Register</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div>
        <label for="repeatPassword">Repeat Password:</label>
        <input
          type="password"
          id="repeatPassword"
          v-model="repeatPassword"
          required
        />
      </div>
      <button type="submit">Register</button>
    </form>
    <button @click="handleGoogleRegister">Register with Google</button>
    <p>Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script>
import { authService } from "@/services/auth.service";

export default {
  name: "Register",
  data() {
    return {
      username: "",
      email: "",
      password: "",
      repeatPassword: "",
    };
  },
  methods: {
    async handleSubmit() {
      if (this.password !== this.repeatPassword) {
        alert("Passwords don't match");
        return;
      }
      try {
        await authService.register(this.email, this.password, this.username);
        this.$router.push("/");
      } catch (error) {
        console.error("Registration error:", error);
        // Handle error (show message to user)
      }
    },
    async handleGoogleRegister() {
      try {
        await authService.loginWithGoogle();
        this.$router.push("/");
      } catch (error) {
        console.error("Google registration error:", error);
        // Handle error (show message to user)
      }
    },
  },
};
</script>
