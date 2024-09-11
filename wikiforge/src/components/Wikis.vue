<template>
  <div class="wikis-container">
    <h1>Your Wikis</h1>

    <!-- If the user is not logged in, show the message -->
    <div v-if="!isUserLoggedIn">
      <p>
        Unfortunately, Wikiforge requires users to log in before creating wikis.
      </p>
    </div>

    <!-- If the user is logged in, show the wiki creation form and list -->
    <div v-else>
      <!-- New Wiki Card -->
      <div class="new-wiki-card">
        <h2>Create a New Wiki</h2>
        <input
          v-model="newWikiTitle"
          type="text"
          placeholder="Enter wiki title"
        />
        <button @click="createWiki">Create Wiki</button>
      </div>

      <!-- List of Wikis -->
      <div class="wiki-list">
        <h2>Your Wikis</h2>

        <div v-if="wikis.length > 0">
          <div v-for="wiki in wikis" :key="wiki.id" class="wiki-card">
            <h3>{{ wiki.title }}</h3>
            <button @click="editWikiTitle(wiki)">Edit Title</button>
            <button @click="deleteWiki(wiki.id)" class="danger">
              Delete Wiki
            </button>
            <button @click="openShareModal(wiki)">Share</button>
          </div>
        </div>

        <div v-else>
          <p>No wikis found. Start by creating a new one!</p>
        </div>
      </div>
    </div>

    <!-- Share Wiki Modal -->
    <div v-if="showShareModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Manage Permissions for: {{ selectedWiki.title }}</h3>

        <!-- Tabs -->
        <div class="tabs">
          <button
            @click="activeTab = 'grant'"
            :class="{ active: activeTab === 'grant' }"
          >
            Grant Permissions
          </button>
          <button
            @click="activeTab = 'revoke'"
            :class="{ active: activeTab === 'revoke' }"
          >
            Revoke Permissions
          </button>
        </div>

        <!-- Grant Permissions -->
        <div v-if="activeTab === 'grant'">
          <label for="friendSelect">Select a Friend:</label>
          <select v-model="selectedFriend" id="friendSelect">
            <option
              v-for="friend in friends"
              :key="friend.uid"
              :value="friend.uid"
            >
              {{ friend.displayName }}
            </option>
          </select>

          <label for="permissionSelect">Select Permission:</label>
          <select v-model="selectedPermission" id="permissionSelect">
            <option value="viewer">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="editor">Editor</option>
          </select>

          <button @click="grantPermission">Grant Permission</button>
        </div>

        <!-- Revoke Permissions -->
        <div v-if="activeTab === 'revoke'">
          <label for="revokeSelect">Select User to Revoke:</label>
          <select v-model="selectedUserToRevoke" id="revokeSelect">
            <option
              v-for="(permission, userId) in selectedWiki.permissions"
              :key="userId"
              :value="userId"
            >
              {{ getFriendDisplayName(userId) }} - {{ permission }}
            </option>
          </select>

          <button @click="revokePermission">Revoke Permission</button>
        </div>

        <!-- Close Modal -->
        <button @click="closeShareModal" class="close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  deleteField,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default {
  name: "WikisPage",
  data() {
    return {
      newWikiTitle: "",
      wikis: [],
      isUserLoggedIn: false,
      displayName: "Guest",
      showShareModal: false,
      activeTab: "grant", // Tracks active tab (grant/revoke permissions)
      friends: [], // User's friends list
      selectedWiki: null, // Currently selected wiki for sharing
      selectedFriend: "", // Selected friend to grant permission to
      selectedPermission: "viewer", // Selected permission (default: viewer)
      selectedUserToRevoke: "", // User to revoke permission from
    };
  },
  mounted() {
    this.checkUserStatus();
  },
  methods: {
    checkUserStatus() {
      const user = auth.currentUser;
      if (user) {
        this.isUserLoggedIn = true;
        this.loadWikis();
        this.loadFriends(); // Load friends for permission sharing
        this.displayName = user.displayName || "User";
      }

      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.isUserLoggedIn = true;
          this.loadWikis();
          this.loadFriends();
          this.displayName = user.displayName || "User";
        } else {
          this.isUserLoggedIn = false;
          this.displayName = "Guest";
        }
      });
    },
    async loadWikis() {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "wikis"));
      this.wikis = querySnapshot.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
        .filter((wiki) => wiki.owner === auth.currentUser.uid);
    },
    async loadFriends() {
      const db = getFirestore();
      const currentUser = auth.currentUser;
      const userDoc = doc(db, "users", currentUser.uid);
      onSnapshot(userDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const friends = userData.friends || [];
          const friendsQuery = query(
            collection(db, "users"),
            where("__name__", "in", friends)
          );
          getDocs(friendsQuery).then((snapshot) => {
            this.friends = snapshot.docs.map((doc) => ({
              uid: doc.id,
              displayName: doc.data().displayName,
            }));
          });
        }
      });
    },
    openShareModal(wiki) {
      this.selectedWiki = wiki;
      this.showShareModal = true;

      // Listen for changes in the wiki's permissions
      this.trackWikiPermissions(wiki.id);
    },
    closeShareModal() {
      this.showShareModal = false;
      this.selectedFriend = "";
      this.selectedPermission = "viewer";
      this.selectedUserToRevoke = "";
    },
    // Track permissions for real-time updates
    trackWikiPermissions(wikiId) {
      const db = getFirestore();
      const wikiDoc = doc(db, "wikis", wikiId);

      onSnapshot(wikiDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          this.selectedWiki.permissions = docSnapshot.data().permissions || {};
        }
      });
    },
    async grantPermission() {
      if (!this.selectedFriend) {
        alert("Please select a friend.");
        return;
      }

      try {
        const db = getFirestore();
        const wikiDoc = doc(db, "wikis", this.selectedWiki.id);
        await updateDoc(wikiDoc, {
          [`permissions.${this.selectedFriend}`]: this.selectedPermission,
        });

        alert("Permission granted successfully!");
        this.closeShareModal();
      } catch (error) {
        alert("Failed to grant permission.");
      }
    },
    async revokePermission() {
      if (!this.selectedUserToRevoke) {
        alert("Please select a user to revoke.");
        return;
      }

      try {
        const db = getFirestore();
        const wikiDoc = doc(db, "wikis", this.selectedWiki.id);
        await updateDoc(wikiDoc, {
          [`permissions.${this.selectedUserToRevoke}`]: deleteField(),
        });

        alert("Permission revoked successfully!");
        this.closeShareModal();
      } catch (error) {
        alert("Failed to revoke permission.");
      }
    },
    getFriendDisplayName(uid) {
      const friend = this.friends.find((friend) => friend.uid === uid);
      return friend ? friend.displayName : "Unknown User";
    },
    async createWiki() {
      if (!this.newWikiTitle) {
        alert("Please enter a wiki title.");
        return;
      }

      try {
        const db = getFirestore();
        await addDoc(collection(db, "wikis"), {
          title: this.newWikiTitle,
          owner: auth.currentUser.uid,
          permissions: {
            [auth.currentUser.uid]: "owner",
          },
          createdAt: new Date(),
        });

        this.newWikiTitle = "";
        this.loadWikis();
      } catch (error) {
        alert("Failed to create a new wiki. Please try again.");
      }
    },
    async editWikiTitle(wiki) {
      const newTitle = prompt("Enter new title", wiki.title);
      if (newTitle && newTitle !== wiki.title) {
        try {
          const db = getFirestore();
          const wikiDoc = doc(db, "wikis", wiki.id);
          await updateDoc(wikiDoc, {
            title: newTitle,
          });
          this.loadWikis();
        } catch (error) {
          alert("Failed to update wiki title.");
        }
      }
    },
    async deleteWiki(wikiId) {
      if (confirm("Are you sure you want to delete this wiki?")) {
        try {
          const db = getFirestore();
          await deleteDoc(doc(db, "wikis", wikiId));
          this.loadWikis();
        } catch (error) {
          alert("Failed to delete the wiki.");
        }
      }
    },
  },
};
</script>

<style scoped>
.wikis-container {
  padding: 20px;
}

h1 {
  text-align: center;
}

.new-wiki-card {
  background-color: #f4f4f4;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.wiki-list {
  margin-top: 20px;
}

.wiki-card {
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}

button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}

.close-btn {
  background-color: #ccc;
}

.tabs {
  display: flex;
  justify-content: space-between;
}

.tabs button {
  flex: 1;
  padding: 10px;
  cursor: pointer;
  background-color: #f0f0f0;
}

.tabs button.active {
  background-color: #333;
  color: white;
}
</style>
