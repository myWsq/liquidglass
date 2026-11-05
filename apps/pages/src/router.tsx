import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { isLayerKey, type LayerKey } from "./layers";
import { LayersNotes } from "./notes/LayersNotes";
import { Material } from "./notes/Material";
import { Shell } from "./Shell";

const rootRoute = createRootRoute({ component: Shell });

const materialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Material,
});

const layersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/layers",
  validateSearch: (search: Record<string, unknown>): { layer: LayerKey } => ({
    layer: isLayerKey(search.layer) ? search.layer : "shadow",
  }),
  component: LayersNotes,
});

// Light & dark used to be its own page; it is part of the material page now.
const lightDarkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/light-and-dark",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

export const SECTIONS = [
  { path: "/", label: "00 Material" },
  { path: "/layers", label: "01 Layers" },
] as const;

export type SectionPath = (typeof SECTIONS)[number]["path"];

export const router = createRouter({
  routeTree: rootRoute.addChildren([materialRoute, layersRoute, lightDarkRoute]),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
