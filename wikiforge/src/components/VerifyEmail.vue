<template>
  <div class="verify-container">
    <div class="verify-form">
      <h1>Email Verification Required</h1>
      <p>
        We've sent a verification email to <strong>{{ userEmail }}</strong
        >. Please check your inbox and follow the instructions to verify your
        account.
      </p>
      <p>If you haven't received the email, you can resend it below.</p>

      <button @click="resendVerificationEmail" :disabled="loading">
        {{ loading ? "Sending..." : "Resend Verification Email" }}
      </button>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { auth } from "@/firebase";
import { sendEmailVerification } from "firebase/auth";

export default {
  name: "VerifyEmail",
  data() {
    return {
      loading: false,
      message: "",
      errorMessage: "",
    };
  },
  computed: {
    userEmail() {
      return auth.currentUser ? auth.currentUser.email : "";
    },
  },
  methods: {
    resendVerificationEmail() {
      const user = auth.currentUser;
      if (user) {
        this.loading = true;
        this.message = "";
        this.errorMessage = "";

        sendEmailVerification(user)
          .then(() => {
            this.message =
              "Verification email has been resent! Please check your inbox.";
            this.loading = false;
          })
          .catch((error) => {
            this.errorMessage =
              "Error sending verification email. Please try again.";
            console.error(error);
            this.loading = false;
          });
      }
    },
  },
};
</script>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f4;
}

.verify-form {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
}

button:hover {
  background-color: #555;
}

button:disabled {
  background-color: #888;
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  color: green;
}

.error {
  margin-top: 15px;
  color: red;
}
</style>
