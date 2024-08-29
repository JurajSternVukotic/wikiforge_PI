<template>
  <div class="login">
    <h2>Login</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="usernameOrEmail">Username or Email:</label>
        <input
          type="text"
          id="usernameOrEmail"
          v-model="usernameOrEmail"
          required
        />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Log In</button>
    </form>
    <button @click="handleGoogleLogin">Login with Google</button>
    <p>
      Don't have an account? <router-link to="/register">Register</router-link>
    </p>
  </div>
</template>

<script>
import { authService } from "@/services/auth.service";

export default {
  name: "Login",
  data() {
    return {
      usernameOrEmail: "",
      password: "",
    };
  },
  methods: {
    async handleSubmit() {
      try {
        await authService.login(this.usernameOrEmail, this.password);
        this.$router.push("/");
      } catch (error) {
        console.error("Login error:", error);
        // Handle error (show message to user)
      }
    },
    async handleGoogleLogin() {
      try {
        await authService.loginWithGoogle();
        this.$router.push("/");
      } catch (error) {
        console.error("Google login error:", error);
        // Handle error (show message to user)
      }
    },
  },
};
</script>
