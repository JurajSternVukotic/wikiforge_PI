<template>
  <div class="support-container">
    <h1>Get help and support!</h1>

    <!-- Show this message if the user is not logged in -->
    <div v-if="!isUserLoggedIn">
      <p>Please log in to submit a question or report.</p>
    </div>

    <!-- Show the question submission form only if the user is logged in -->
    <div v-else>
      <h3>Report misconduct, a bug, or ask a question!</h3>
      <form @submit.prevent="submitQuestion">
        <!-- Automatically read the user's email, no need to input -->
        <textarea
          v-model="question"
          placeholder="Your question"
          required
        ></textarea>
        <button type="submit">Submit Question</button>
      </form>

      <!-- Display feedback after question submission -->
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <!-- Admin interface (if the user is an admin) -->
    <div v-if="isAdmin">
      <h2>Unanswered Questions</h2>
      <ul>
        <li v-for="question in unansweredQuestions" :key="question.id">
          <p>{{ question.question }}</p>

          <!-- Answer textarea and submit button -->
          <textarea
            v-model="question.answer"
            placeholder="Answer this question"
          ></textarea>
          <button @click="answerQuestion(question)">Submit Answer</button>

          <!-- Delete button -->
          <button @click="deleteQuestion(question.id)" class="danger">
            Delete Question
          </button>
        </li>
      </ul>
    </div>

    <!-- Publicly viewable answered questions -->
    <div>
      <h2>Answered Questions</h2>
      <ul>
        <li v-for="question in answeredQuestions" :key="question.id">
          <p>{{ question.question }}</p>
          <p><strong>Answer:</strong> {{ question.answer }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { auth } from "../firebase";

export default {
  mounted() {
    this.checkUserStatus();
  },

  name: "SupportPage",
  data() {
    return {
      email: "",
      question: "",
      successMessage: "",
      errorMessage: "",
      isAdmin: false,
      unansweredQuestions: [],
      answeredQuestions: [],
    };
  },
  created() {
    this.checkUserStatus();
    this.checkIfAdmin();
    this.loadAnsweredQuestions();
    if (this.isAdmin) {
      this.loadUnansweredQuestions();
    }
  },
  methods: {
    // Check if the current user is an admin
    checkUserStatus() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.isUserLoggedIn = true;
          this.checkIfAdmin();
        } else {
          this.isUserLoggedIn = false;
        }
      });
    },
    async checkIfAdmin() {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userDoc = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          this.isAdmin = userSnapshot.data().isAdmin || false;
          console.log("Admin status:", this.isAdmin); // Debugging log to check admin status

          // Load admin-specific data if the user is an admin
          if (this.isAdmin) {
            this.loadUnansweredQuestions();
          }
        } else {
          console.log("User document does not exist");
        }
      }
    },

    // Submit a new question
    async submitQuestion() {
      try {
        const db = getFirestore();
        const questionRef = await addDoc(collection(db, "supportQuestions"), {
          email: this.email,
          question: this.question,
          answered: false,
          submittedBy: auth.currentUser.uid,
          submittedAt: new Date(),
        });
        console.log(questionRef);
        this.successMessage = "Your question has been submitted!";
        this.email = "";
        this.question = "";
      } catch (error) {
        this.errorMessage = "Failed to submit your question. Please try again.";
      }
    },
    async deleteQuestion(questionId) {
      try {
        const db = getFirestore();
        const questionDoc = doc(db, "supportQuestions", questionId);
        await deleteDoc(questionDoc); // Delete the document from Firestore
        this.successMessage = "Question deleted successfully!";

        // Refresh unanswered questions after deletion
        this.loadUnansweredQuestions();
      } catch (error) {
        console.log(error);
        this.errorMessage = "Failed to delete the question.";
      }
    },

    // Load unanswered questions for admin
    async loadUnansweredQuestions() {
      try {
        const db = getFirestore();
        const q = query(
          collection(db, "supportQuestions"),
          where("answered", "==", false)
        );

        // Listen for real-time updates
        onSnapshot(q, (querySnapshot) => {
          console.log("GOT HERE");
          this.unansweredQuestions = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
        });
      } catch (error) {
        this.errorMessage = "Failed to load unanswered questions.";
      }
    },
    // Load answered questions for everyone
    async loadAnsweredQuestions() {
      try {
        const db = getFirestore();
        const q = query(
          collection(db, "supportQuestions"),
          where("answered", "==", true)
        );

        // Listen for real-time updates
        onSnapshot(q, (querySnapshot) => {
          this.answeredQuestions = querySnapshot.docs.map((doc) => doc.data());
        });
      } catch (error) {
        this.errorMessage = "Failed to load answered questions.";
      }
    },
    // Admin answers a question
    async answerQuestion(question) {
      try {
        const db = getFirestore();
        const questionDoc = doc(db, "supportQuestions", question.id);
        await updateDoc(questionDoc, {
          answer: question.answer,
          answered: true,
        });
        this.successMessage = "The question has been answered!";
        this.loadUnansweredQuestions(); // Refresh unanswered questions
        this.loadAnsweredQuestions(); // Refresh answered questions
      } catch (error) {
        this.errorMessage = "Failed to submit the answer.";
      }
    },
  },
};
</script>

<style scoped>
.support-container {
  padding: 20px;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
}

button:hover {
  background-color: #555;
}

.success {
  color: green;
}

.error {
  color: red;
}

textarea {
  min-height: 100px;
}
button.danger {
  background-color: red;
}

button.danger:hover {
  background-color: darkred;
}
</style>
