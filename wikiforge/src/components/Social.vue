<template>
  <div class="social-container">
    <!-- If the user is not logged in, show the message -->
    <div v-if="!isUserLoggedIn">
      <p>
        Unfortunately, Wikiforge requires users to log in before managing
        friends .
      </p>
    </div>

    <!-- Add Friends Section -->
    <div v-else>
      <h2>Add Friends</h2>
      <input
        v-model="searchQuery"
        placeholder="Search for friends by username"
        @input="searchUsers"
      />

      <div v-if="searchResults.length > 0">
        <div v-for="user in searchResults" :key="user.uid" class="user-card">
          <p>{{ user.displayName }}</p>
          <button @click="sendFriendRequest(user.uid)">+</button>
        </div>
      </div>
      <div v-else>
        <p>No users found.</p>
      </div>

      <!-- Friend Requests Section -->
      <h2>Incoming Friend Requests</h2>
      <div v-if="friendRequests.length > 0">
        <div
          v-for="request in friendRequests"
          :key="request.uid"
          class="friend-request-card"
        >
          <p>{{ request.displayName }}</p>
          <button @click="acceptFriendRequest(request.uid)">Accept</button>
          <button @click="declineFriendRequest(request.uid)">Decline</button>
        </div>
      </div>
      <div v-else>
        <p>No incoming friend requests.</p>
      </div>

      <!-- Friends List Section -->
      <h2>Your Friends</h2>
      <div v-if="friends.length > 0">
        <div v-for="friend in friends" :key="friend.uid" class="friend-card">
          <p>{{ friend.displayName }}</p>
          <button @click="chatWithFriend(friend.uid)">Chat</button>
          <button @click="viewProfile(friend.uid)">View Profile</button>
          <button @click="removeFriend(friend.uid)" class="danger">
            Delete Friend
          </button>
        </div>
      </div>
      <div v-else>
        <p>You have no friends yet.</p>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { auth, onAuthStateChanged } from "../firebase"; // Import Firebase auth

export default {
  name: "SocialPage",
  data() {
    return {
      searchQuery: "", // Search input for finding users
      searchResults: [], // List of users matching the search query
      friends: [], // List of current friends
      friendRequests: [], // List of incoming friend requests
      isUserLoggedIn: false,
    };
  },
  mounted() {
    // Listen for changes in the authentication state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, now load friend requests and friends
        this.loadFriendRequests();
        this.loadFriends();
      } else {
        // User is not logged in, handle accordingly
        this.errorMessage = "Please log in to view your social data.";
      }
    });
    this.checkUserStatus();
  },
  methods: {
    checkUserStatus() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.isUserLoggedIn = true;
        } else {
          this.isUserLoggedIn = false;
        }
      });
    },

    // Search users by display name
    async searchUsers() {
      if (this.searchQuery.length === 0) {
        this.searchResults = [];
        return;
      }

      const db = getFirestore();
      const searchQueryLower = this.searchQuery.toLowerCase(); // Convert search query to lowercase
      const usersRef = collection(db, "users");

      const querySnapshot = await getDocs(usersRef);

      const currentUser = auth.currentUser;
      const currentUserDoc = doc(db, "users", currentUser.uid);
      const currentUserData = await getDoc(currentUserDoc);

      const friends = currentUserData.data().friends || [];
      const friendRequests = currentUserData.data().friendRequests || [];

      this.searchResults = querySnapshot.docs
        .map((doc) => ({
          uid: doc.id,
          displayName: doc.data().displayName,
        }))
        .filter(
          (user) =>
            user.uid !== currentUser.uid && // Exclude current user
            user.displayName.toLowerCase().includes(searchQueryLower) && // Convert displayName to lowercase for comparison
            !friends.includes(user.uid) && // Exclude current friends
            !friendRequests.includes(user.uid) // Exclude pending requests
        );
    },
    // Send a friend request
    async sendFriendRequest(targetUid) {
      const db = getFirestore();
      const currentUser = auth.currentUser;

      // Add this user's UID to the target user's friendRequests array
      const targetUserDoc = doc(db, "users", targetUid);
      await updateDoc(targetUserDoc, {
        friendRequests: arrayUnion(currentUser.uid),
      });

      alert("Friend request sent!");
    },

    // Load incoming friend requests
    async loadFriendRequests() {
      const db = getFirestore();
      const currentUser = auth.currentUser;

      try {
        if (!currentUser) {
          this.errorMessage = "User not authenticated.";
          return;
        }

        // Set up a Firestore listener for the current user's friendRequests
        const userDoc = doc(db, "users", currentUser.uid);

        onSnapshot(userDoc, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const friendRequests = userData.friendRequests || [];

            if (friendRequests.length > 0) {
              // Query Firestore for users who sent the friend requests
              const q = query(
                collection(db, "users"),
                where("__name__", "in", friendRequests)
              );
              getDocs(q).then((querySnapshot) => {
                this.friendRequests = querySnapshot.docs.map((doc) => ({
                  uid: doc.id,
                  displayName: doc.data().displayName,
                }));
              });
            } else {
              this.friendRequests = []; // No friend requests
            }
          }
        });
      } catch (error) {
        this.errorMessage = "Failed to load friend requests.";
        console.error("Error loading friend requests:", error);
      }
    },
    // Accept a friend request
    async acceptFriendRequest(requestUid) {
      const db = getFirestore();
      const currentUser = auth.currentUser;

      try {
        // Add each other as friends
        const currentUserDoc = doc(db, "users", currentUser.uid);
        const requestUserDoc = doc(db, "users", requestUid);

        // Update both documents in parallel
        await Promise.all([
          updateDoc(currentUserDoc, {
            friends: arrayUnion(requestUid),
            friendRequests: arrayRemove(requestUid), // Remove from friend requests
          }),
          updateDoc(requestUserDoc, {
            friends: arrayUnion(currentUser.uid), // Add current user to friend's list
          }),
        ]);

        alert("Friend request accepted!");
        this.loadFriendRequests(); // Refresh friend requests
        this.loadFriends(); // Refresh friends list
      } catch (error) {
        this.errorMessage = "Failed to accept friend request.";
        console.error("Error accepting friend request:", error);
      }
    },
    // Decline a friend request
    async declineFriendRequest(requestUid) {
      const db = getFirestore();
      const currentUser = auth.currentUser;

      const currentUserDoc = doc(db, "users", currentUser.uid);

      await updateDoc(currentUserDoc, {
        friendRequests: arrayRemove(requestUid), // Remove from requests
      });

      alert("Friend request declined!");
      this.loadFriendRequests(); // Refresh friend requests
    },

    // Load list of current friends
    async loadFriends() {
      try {
        const db = getFirestore();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          this.errorMessage = "User not authenticated.";
          return;
        }

        // Set up a Firestore listener for the current user's friends
        const userDoc = doc(db, "users", currentUser.uid);

        onSnapshot(userDoc, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const friends = userData.friends || [];

            if (friends.length > 0) {
              // Query Firestore to get the friends' details
              const q = query(
                collection(db, "users"),
                where("__name__", "in", friends)
              );
              const querySnapshot = await getDocs(q);
              this.friends = querySnapshot.docs.map((doc) => ({
                uid: doc.id,
                displayName: doc.data().displayName,
              }));
            } else {
              this.friends = []; // No friends found
            }
          }
        });
      } catch (error) {
        this.errorMessage = "Failed to load friends.";
        console.error("Error loading friends:", error);
      }
    },
    // Remove a friend
    async removeFriend(friendUid) {
      const db = getFirestore();
      const currentUser = auth.currentUser;

      try {
        const currentUserDoc = doc(db, "users", currentUser.uid);
        const friendUserDoc = doc(db, "users", friendUid);

        // Update both documents in parallel to remove each other from friends list
        await Promise.all([
          updateDoc(currentUserDoc, {
            friends: arrayRemove(friendUid),
          }),
          updateDoc(friendUserDoc, {
            friends: arrayRemove(currentUser.uid),
          }),
        ]);

        alert("Friend removed.");
        this.loadFriends(); // Refresh friends list
      } catch (error) {
        this.errorMessage = "Failed to remove friend.";
        console.error("Error removing friend:", error);
      }
    },
    // Placeholder functions for chat and view profile
    chatWithFriend(uid) {
      console.log(uid);
      alert("Chat feature coming soon!");
    },
    viewProfile(uid) {
      console.log(uid);
      alert("View profile feature coming soon!");
    },
  },
};
</script>

<style scoped>
.social-container {
  padding: 20px;
}

h2 {
  margin-top: 20px;
}

.user-card,
.friend-request-card,
.friend-card {
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 8px;
}

button {
  margin: 5px;
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
</style>
