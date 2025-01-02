import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/games",
    name: "Consoles",
    component: () => import("../views/Consoles.vue"),
  },
  {
    path: "/games/:console_id",
    name: "Games",
    component: () => import("../views/Games.vue"),
    props: true,
  },
  {
    path: "/games/:console_id/:game_id",
    name: "Game",
    component: () => import("../views/Games.vue"),
    props: true,
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
