import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Material } from "./notes/Material";
import { Shell } from "./Shell";

const rootRoute = createRootRoute({ component: Shell });

const materialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Material,
});

// Layers and Light & dark used to be pages of their own. Layers is the toggle in the
// stage's corner now, and Light & dark is part of the material page.
const formerPages = ["/layers", "/light-and-dark"].map((path) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: () => {
      throw redirect({ to: "/" });
    },
  }),
);

export const router = createRouter({
  routeTree: rootRoute.addChildren([materialRoute, ...formerPages]),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
