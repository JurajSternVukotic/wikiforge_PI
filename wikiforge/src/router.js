import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import LoginPage from "./components/LoginPage.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage, // Maps the home route to the HomePage component
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage, // Maps the login route to a login component
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
