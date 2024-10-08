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

      <h2>Your Friends</h2>
      <div v-if="friends.length > 0">
        <div v-for="friend in friends" :key="friend.uid" class="friend-card">
          <p>{{ friend.displayName }}</p>

          <!-- Show the "Promote to Admin" button only if the friend is not an admin -->
          <button v-if="!friend.isAdmin" @click="promoteToAdmin(friend.uid)">
            Promote to Admin
          </button>

          <button @click="chatWithFriend(friend)">Chat</button>
          <button @click="viewProfile(friend.uid)">View Profile</button>
          <button @click="removeFriend(friend.uid)" class="danger">
            Delete Friend
          </button>
        </div>
      </div>
      <div v-else>
        <p>You have no friends yet.</p>
      </div>
      <!-- Popup for showing success or error messages -->
      <div
        v-if="isPopupVisible"
        class="popup"
        :class="popupMessage.status.toLowerCase()"
      >
        <p>{{ popupMessage.message }}</p>
      </div>
    </div>
    <!-- Chat Modal -->
    <div v-if="showChatModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Chat with {{ chatFriend.displayName }}</h2>

        <!-- Message history -->
        <div class="message-history">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="message"
          >
            <p>
              <strong>{{ message.senderName }}:</strong> {{ message.text }}
            </p>
          </div>
        </div>

        <!-- New message input -->
        <div class="message-input">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type your message..."
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage">Send</button>
        </div>

        <!-- Close button -->
        <button @click="closeChat" class="close-btn">Close</button>
      </div>
    </div>
    <!-- Profile Modal -->
    <div v-if="showProfileModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ selectedProfile.displayName }}'s Profile</h2>
        <p><strong>Biography:</strong> {{ selectedProfile.biography }}</p>
        <p><strong>Interests:</strong> {{ selectedProfile.interests }}</p>

        <h3>Wikis</h3>
        <div v-if="profileWikis.length > 0">
          <ul>
            <li v-for="wiki in profileWikis" :key="wiki.id">
              <router-link :to="{ name: 'WikiPage', params: { id: wiki.id } }">
                {{ wiki.title }} - {{ wiki.role }}
              </router-link>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>This user is not involved in any wikis.</p>
        </div>

        <button @click="closeProfileModal" class="close-btn">Close</button>
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
  addDoc,
  onSnapshot,
  serverTimestamp,
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
      showChatModal: false,
      chatFriend: null, // The friend you're chatting with
      chatMessages: [], // Message history
      newMessage: "", // The new message you're typing
      popupMessage: null, // Store the popup message and status
      isPopupVisible: false, // Control popup visibility
      showProfileModal: false, // Control profile modal visibility
      selectedProfile: null, // Store selected user's profile data
      profileWikis: [], // Wikis associated with the selected profile
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
    showPopup(status, message) {
      this.popupMessage = { status, message };
      this.isPopupVisible = true;

      // Automatically hide the popup after 3 seconds
      setTimeout(() => {
        this.isPopupVisible = false;
      }, 3000);
    },
    async chatWithFriend(friend) {
      this.chatFriend = friend;
      this.showChatModal = true;

      const db = getFirestore();
      const currentUser = auth.currentUser;

      // Check if a chat already exists between the current user and the friend
      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid)
      );

      const chatSnapshot = await getDocs(chatQuery);
      let chatId = null;

      chatSnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(friend.uid)) {
          chatId = doc.id; // Chat exists, get its ID
        }
      });

      if (!chatId) {
        // Create a new chat document if one doesn't exist
        const newChatDoc = await addDoc(chatsRef, {
          participants: [currentUser.uid, friend.uid],
          messages: [], // Empty messages array for the new chat
        });
        chatId = newChatDoc.id;
      }

      this.currentChatId = chatId; // Set the current chat ID for sending messages
      this.listenForMessages(chatId); // Listen for message updates
    },

    listenForMessages(chatId) {
      const db = getFirestore();
      const chatDoc = doc(db, "chats", chatId);

      onSnapshot(chatDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const chatData = docSnapshot.data();
          this.chatMessages = chatData.messages || [];
        }
      });
    },

    // Send a message
    async sendMessage() {
      if (!this.newMessage.trim()) return; // Don't send empty messages

      const db = getFirestore();
      const currentUser = auth.currentUser;

      if (!this.currentChatId) {
        console.error("Chat ID is not defined");
        return;
      }

      const chatDoc = doc(db, "chats", this.currentChatId);

      try {
        // Add the new message to the chat messages array (without the timestamp)
        await updateDoc(chatDoc, {
          messages: arrayUnion({
            senderId: currentUser.uid,
            senderName: currentUser.displayName || "User",
            text: this.newMessage,
            createdAt: new Date(), // Temporarily use local timestamp
          }),
        });

        // Then, update the document with server timestamp for the message
        await updateDoc(chatDoc, {
          lastMessageTimestamp: serverTimestamp(), // Can be used to track the latest message in the chat
        });

        this.newMessage = ""; // Clear input after sending
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    // Close the chat modal
    closeChat() {
      this.showChatModal = false;
      this.chatFriend = null;
      this.chatMessages = [];
    },

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
    // Load list of current friends and listen for real-time updates
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

              // Listen for real-time updates to friends' data
              onSnapshot(q, (querySnapshot) => {
                this.friends = querySnapshot.docs.map((doc) => ({
                  uid: doc.id,
                  displayName: doc.data().displayName,
                  isAdmin: doc.data().isAdmin || false, // Add isAdmin field
                }));
              });
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
    // Promote friend to admin
    async promoteToAdmin(friendUid) {
      const db = getFirestore();
      const friendUserDoc = doc(db, "users", friendUid);

      try {
        await updateDoc(friendUserDoc, {
          isAdmin: true, // Set isAdmin to true
        });
        this.showPopup("Success", "Friend has been promoted to admin.");
      } catch (error) {
        console.error("Error promoting friend to admin:", error);
        this.showPopup("Error", "Failed to promote friend to admin.");
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
    async viewProfile(uid) {
      const db = getFirestore();
      const userDoc = doc(db, "users", uid);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        this.selectedProfile = userSnapshot.data();
        this.selectedProfile.displayName =
          userSnapshot.data().displayName || "Unknown";
        this.selectedProfile.bio =
          userSnapshot.data().bio || "No biography provided";
        this.selectedProfile.interests =
          userSnapshot.data().interests || "No interests provided";

        await this.loadProfileWikis(uid); // Load wikis the user is involved in

        this.showProfileModal = true; // Show the modal
      } else {
        this.showPopup("Error", "User profile not found.");
      }
    },

    async loadProfileWikis(uid) {
      const db = getFirestore();
      const currentUser = auth.currentUser.uid;

      // Query for wikis owned by the selected user
      const ownedWikisQuery = query(
        collection(db, "wikis"),
        where("owner", "==", uid) // Wikis owned by the friend (selected user)
      );

      // Fetch the wikis owned by the selected user
      const ownedWikisSnapshot = await getDocs(ownedWikisQuery);

      this.profileWikis = [];

      // Filter and add wikis where the current user has permissions
      ownedWikisSnapshot.forEach((doc) => {
        const wikiData = doc.data();

        // Check if the current user has permissions in this wiki
        const currentUserRole = wikiData.permissions[currentUser];
        if (currentUserRole) {
          // Add the wiki to the list, showing the current user's role (not the friend's role)
          this.profileWikis.push({
            id: doc.id,
            title: wikiData.title,
            role: currentUserRole, // Show the current user's permissions in the wiki
          });
        }
      });
    },

    closeProfileModal() {
      this.showProfileModal = false;
      this.selectedProfile = null;
      this.profileWikis = [];
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
  display: flex;
  flex-direction: column;
}

.message-history {
  flex: 1;
  overflow-y: scroll;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
}

.message-input {
  display: flex;
  justify-content: space-between;
}

.message-input input {
  flex: 1;
  padding: 10px;
  margin-right: 10px;
}

button.close-btn {
  background-color: #ccc;
}
.popup {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  z-index: 1000;
}

.popup.success {
  background-color: #28a745;
}

.popup.error {
  background-color: #dc3545;
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
  display: flex;
  flex-direction: column;
}

.close-btn {
  background-color: #ccc;
  padding: 10px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  margin-top: 20px;
}
</style>
