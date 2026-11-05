import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { isLayerKey, type LayerKey } from "./layers";
import { Declarations } from "./notes/Declarations";
import { LayersNotes } from "./notes/LayersNotes";
import { LightDark } from "./notes/LightDark";
import { Shell } from "./Shell";

const rootRoute = createRootRoute({ component: Shell });

const declarationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Declarations,
});

const layersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/layers",
  validateSearch: (search: Record<string, unknown>): { layer: LayerKey } => ({
    layer: isLayerKey(search.layer) ? search.layer : "shadow",
  }),
  component: LayersNotes,
});

const lightDarkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/light-and-dark",
  component: LightDark,
});

export const SECTIONS = [
  { path: "/", label: "00 Declarations" },
  { path: "/layers", label: "01 Layers" },
  { path: "/light-and-dark", label: "02 Light & Dark" },
] as const;

export type SectionPath = (typeof SECTIONS)[number]["path"];

export const router = createRouter({
  routeTree: rootRoute.addChildren([declarationsRoute, layersRoute, lightDarkRoute]),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
