import { zValidator } from "@hono/zod-validator";
import { resolveLocationParamsSchema } from "@patty/contracts";
import { Hono } from "hono";

import { listLocations, listPetTypes, resolveLocation } from "./service";

export const metadataRoutes = new Hono()
  .get(
    "/locations/resolve",
    zValidator("query", resolveLocationParamsSchema),
    async (c) => {
      const query = c.req.valid("query");
      const location = await resolveLocation(
        Number(query.latitude),
        Number(query.longitude),
      );
      return c.json(location);
    },
  )
  .get("/locations", async (c) => {
    const data = await listLocations();
    return c.json(data);
  })
  .get("/pet-types", async (c) => {
    const data = await listPetTypes();
    return c.json(data);
  });
