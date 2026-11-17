import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { upload, uploadImage } from "../upload.js";

const router = Router();
router.use(requireAuth);

const memberUser = {
  select: { id: true, username: true, displayName: true, avatarUrl: true, lastSeen: true },
};

const messageInclude = {
  sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
};

// Returns the chat if the user is a member, otherwise null.
async function getMemberChat(chatId, userId) {
  return prisma.chat.findFirst({
    where: { id: chatId, members: { some: { userId } } },
  });
}

// All of my chats, newest activity first, with the latest message
router.get("/", async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: memberUser } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: messageInclude },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(
      chats.map(({ members, messages, ...chat }) => ({
        ...chat,
        members: members.map((m) => m.user),
        lastMessage: messages[0] || null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Start a DM (one userId) or create a group (several userIds + name)
router.post("/", async (req, res, next) => {
  try {
    const userIds = [...new Set((req.body.userIds || []).map(Number))].filter(
      (id) => Number.isInteger(id) && id !== req.user.id
    );
    if (userIds.length === 0) {
      return res.status(400).json({ error: "Choose at least one user" });
    }

    const found = await prisma.user.count({ where: { id: { in: userIds } } });
    if (found !== userIds.length) {
      return res.status(400).json({ error: "One or more users do not exist" });
    }

    const isGroup = userIds.length > 1;
    const include = {
      members: { include: { user: memberUser } },
    };
    const shape = ({ members, ...chat }) => ({
      ...chat,
      members: members.map((m) => m.user),
      lastMessage: null,
    });

    if (!isGroup) {
      // Reuse the existing DM if there is one
      const existing = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: req.user.id } } },
            { members: { some: { userId: userIds[0] } } },
          ],
        },
        include,
      });
      if (existing) return res.json(shape(existing));
    }

    const name = (req.body.name || "").toString().trim();
    if (isGroup && !name) {
      return res.status(400).json({ error: "Group chats need a name" });
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup,
        name: isGroup ? name : null,
        members: {
          create: [req.user.id, ...userIds].map((userId) => ({ userId })),
        },
      },
      include,
    });
    res.status(201).json(shape(chat));
  } catch (err) {
    next(err);
  }
});

// Messages in a chat. Pass ?after=<messageId> to fetch only newer ones (for polling).
router.get("/:id/messages", async (req, res, next) => {
  try {
    const chatId = Number(req.params.id);
    if (!(await getMemberChat(chatId, req.user.id))) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const after = Number(req.query.after) || 0;
    const messages = await prisma.message.findMany({
      where: { chatId, ...(after && { id: { gt: after } }) },
      orderBy: { createdAt: "asc" },
      include: messageInclude,
      take: 200,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Send a text message and/or an image
router.post("/:id/messages", upload.single("image"), async (req, res, next) => {
  try {
    const chatId = Number(req.params.id);
    if (!(await getMemberChat(chatId, req.user.id))) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const content = (req.body.content || "").toString().trim();
    if (!content && !req.file) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: "Message is too long (max 2000 characters)" });
    }

    const imageUrl = req.file ? await uploadImage(req.file.buffer, "messaging-app/messages") : null;

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { content: content || null, imageUrl, chatId, senderId: req.user.id },
        include: messageInclude,
      }),
      prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
    ]);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

export default router;
