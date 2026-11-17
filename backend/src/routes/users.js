import { Router } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { upload, uploadImage } from "../upload.js";

const router = Router();
router.use(requireAuth);

const profileSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  lastSeen: true,
};

// Current user's full profile
router.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { ...profileSelect, email: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile: displayName, bio, and optional avatar image
router.patch(
  "/me",
  upload.single("avatar"),
  body("displayName").optional().trim().isLength({ min: 1, max: 40 }).withMessage("Display name must be 1-40 characters"),
  body("bio").optional().trim().isLength({ max: 200 }).withMessage("Bio must be 200 characters or fewer"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const data = {};
      if (req.body.displayName !== undefined) data.displayName = req.body.displayName;
      if (req.body.bio !== undefined) data.bio = req.body.bio;
      if (req.file) data.avatarUrl = await uploadImage(req.file.buffer, "messaging-app/avatars");

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data,
        select: { ...profileSelect, email: true },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// List / search users (everyone except me). Includes lastSeen for online status.
router.get("/users", async (req, res, next) => {
  try {
    const search = (req.query.search || "").toString().trim();
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        ...(search && {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: profileSelect,
      orderBy: { username: "asc" },
      take: 50,
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: profileSelect,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
