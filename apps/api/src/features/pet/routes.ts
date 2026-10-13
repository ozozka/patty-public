import { zValidator } from "@hono/zod-validator";
import {
  addPetPhotoRequestSchema,
  petIdParamSchema,
  petRequestSchema,
  photoIdParamSchema,
  reorderPetPhotosRequestSchema,
} from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { verifiedMiddleware } from "../../middleware/verified";
import * as service from "./service";

export const petRoutes = new Hono<{ Variables: AuthVariables }>()
  .get("/deleted", authMiddleware, verifiedMiddleware, async (c) => {
    const userId = c.var.userId;
    const deletedPets = await service.getDeletedPets(userId);
    return c.json(deletedPets);
  })
  .post(
    "/",
    zValidator("json", petRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      const pet = await service.createPet(userId, data);
      return c.json(pet, 201);
    },
  )
  .put(
    "/:id",
    zValidator("param", petIdParamSchema),
    zValidator("json", petRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      await service.updatePet(id, userId, data);
      return c.json(null, 200);
    },
  )
  .delete(
    "/:id",
    zValidator("param", petIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id } = c.req.valid("param");
      await service.deletePet(userId, id);
      return c.body(null, 204);
    },
  )
  .post(
    "/:id/restore",
    zValidator("param", petIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id } = c.req.valid("param");
      await service.restorePet(userId, id);
      return c.json(null, 200);
    },
  )
  .post(
    "/:id/photos",
    zValidator("param", petIdParamSchema),
    zValidator("json", addPetPhotoRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const photo = await service.addPhoto(id, userId, data.image_url);
      return c.json(photo, 201);
    },
  )
  .delete(
    "/:id/photos/:photo_id",
    zValidator("param", photoIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id, photo_id } = c.req.valid("param");
      await service.removePhoto(id, userId, photo_id);
      return c.body(null, 204);
    },
  )
  .put(
    "/:id/photos/order",
    zValidator("param", petIdParamSchema),
    zValidator("json", reorderPetPhotosRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      await service.reorderPhotos(id, userId, data.ordered_photo_ids);
      return c.json(null, 200);
    },
  );
