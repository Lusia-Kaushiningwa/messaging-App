import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { prisma } from "../db.js";

const router = Router();

const signToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  displayName: u.displayName,
  bio: u.bio,
  avatarUrl: u.avatarUrl,
});

router.post(
  "/signup",
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),
  body("email").trim().isEmail().withMessage("Enter a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .custom((v, { req }) => v === req.body.password)
    .withMessage("Passwords do not match"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { username, email, password } = req.body;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: email.toLowerCase() }] },
      });
      if (existing) {
        return res.status(409).json({ error: "Username or email already in use" });
      }

      const user = await prisma.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          password: await bcrypt.hash(password, 10),
          displayName: username,
        },
      });
      res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username.toLowerCase() }] },
    });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: "Incorrect username or password" });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
