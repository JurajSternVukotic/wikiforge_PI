<template>
  <div class="profile-container">
    <h1>Hello, {{ displayName || "User" }}!</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'about' }"
        @click="activeTab = 'about'"
      >
        About Me
      </button>
      <button
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        Settings
      </button>
    </div>

    <!-- About Me Tab -->
    <div v-if="activeTab === 'about'" class="about-tab">
      <h2>About Me</h2>
      <div class="info-box">
        <h3>Interests</h3>
        <textarea
          v-model="interests"
          placeholder="Your interests..."
        ></textarea>
      </div>
      <div class="info-box">
        <h3>Biography</h3>
        <textarea
          v-model="biography"
          placeholder="Your biography..."
        ></textarea>
      </div>
      <button @click="saveAboutMe" :disabled="saving">
        {{ saving ? "Saving..." : "Save About Me" }}
      </button>
    </div>

    <!-- Settings Tab -->
    <div v-if="activeTab === 'settings'" class="settings-tab">
      <h2>Settings</h2>
      <div class="info-box">
        <h3>Change Display Name</h3>
        <input
          v-model="newDisplayName"
          type="text"
          placeholder="New display name"
        />
        <button @click="changeDisplayName">Change Display Name</button>
      </div>
      <div class="info-box">
        <h3>Reset Password</h3>
        <button @click="resetPassword">Reset Password</button>
      </div>
      <div class="info-box">
        <h3>Delete Account</h3>
        <button @click="deleteAccount" class="danger">Delete Account</button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    <!-- Logout button (visible on both tabs) -->
    <button class="logout-btn" @click="logout">Logout</button>
  </div>
</template>

<script>
import { auth } from "@/firebase";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";

export default {
  name: "ProfilePage",
  data() {
    return {
      activeTab: "about", // 'about' or 'settings'
      displayName: "",
      newDisplayName: "",
      interests: "",
      biography: "",
      errorMessage: "",
      successMessage: "",
      saving: false,
    };
  },
  created() {
    // Check if user is authenticated
    if (!auth.currentUser) {
      this.$router.push("/login"); // Redirect to login if not authenticated
      return;
    }

    // Load user display name and about me data
    this.displayName = auth.currentUser.displayName || "User";
    this.loadAboutMe();
  },
  methods: {
    // Load About Me data from Firestore
    async loadAboutMe() {
      try {
        const db = getFirestore();
        const userDoc = doc(db, "users", auth.currentUser.uid);
        const docSnapshot = await getDoc(userDoc);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          this.interests = data.interests || "";
          this.biography = data.biography || "";
        }
      } catch (error) {
        this.errorMessage = "Failed to load profile data.";
      }
    },
    // Save Interests and Biography to Firestore
    async saveAboutMe() {
      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const db = getFirestore();
        const userDoc = doc(db, "users", auth.currentUser.uid);
        await setDoc(
          userDoc,
          {
            interests: this.interests,
            biography: this.biography,
          },
          { merge: true }
        ); // Use { merge: true } to avoid overwriting other fields

        this.successMessage = "Profile updated successfully!";
      } catch (error) {
        this.errorMessage = "Failed to save profile data.";
      } finally {
        this.saving = false;
      }
    },
    // Change Display Name
    async changeDisplayName() {
      this.errorMessage = "";
      this.successMessage = "";

      if (!this.newDisplayName) {
        this.errorMessage = "Display name cannot be empty.";
        return;
      }

      try {
        // Update display name in Firebase Authentication
        await updateProfile(auth.currentUser, {
          displayName: this.newDisplayName,
        });

        // Update display name in Firestore
        const db = getFirestore();
        const userDoc = doc(db, "users", auth.currentUser.uid);
        await setDoc(
          userDoc,
          {
            displayName: this.newDisplayName,
          },
          { merge: true }
        ); // Use { merge: true } to avoid overwriting other fields

        this.displayName = this.newDisplayName;
        this.newDisplayName = "";
        this.successMessage = "Display name updated successfully!";
      } catch (error) {
        this.errorMessage = "Failed to change display name.";
      }
    },
    // Reset Password
    async resetPassword() {
      this.errorMessage = "";
      this.successMessage = "";

      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        this.successMessage = "Password reset email sent!";
      } catch (error) {
        this.errorMessage = "Failed to send password reset email.";
      }
    },
    // Delete Account
    async deleteAccount() {
      if (
        !confirm(
          "Are you sure you want to delete your account? This cannot be undone."
        )
      ) {
        return;
      }

      this.errorMessage = "";
      this.successMessage = "";

      try {
        await deleteUser(auth.currentUser);
        this.successMessage = "Account deleted successfully!";
        this.$router.push("/"); // Redirect to home or login after deletion
      } catch (error) {
        this.errorMessage = "Failed to delete account.";
      }
    },
    async logout() {
      try {
        await auth.signOut();
        this.$router.push("/login"); // Redirect to login after logging out
      } catch (error) {
        this.errorMessage = "Failed to log out.";
      }
    },
  },
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

h1 {
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  margin: 0 10px;
  background-color: #eee;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tabs button.active {
  background-color: #333;
  color: white;
}

.info-box {
  margin-bottom: 20px;
}

textarea,
input {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #555;
}

button.danger {
  background-color: red;
}

button.danger:hover {
  background-color: darkred;
}

.error {
  color: red;
  text-align: center;
}

.success {
  color: green;
  text-align: center;
}
.logout-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #555;
}
</style>
