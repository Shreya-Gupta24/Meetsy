import { db } from "@/db";
import { conversations, matches, messages } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./middleware/auth-middleware";
import { generateAISummaries, getLatestConversationSummary } from "@/lib/ai";

type Variables = {
  userId: string;
};

const conversationsApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .get("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    return c.json(conversationMessages);
  })
  .post("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");
    const user = c.get("user");

    const { content } = await c.req.json();

    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        content,
        senderId: user.id,
      })
      .returning();

    //update the conversation last message time

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return c.json(message);
  })
  .post("/:conversationId/summarize", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    if (!conversationMessages || conversationMessages.length === 0) {
      return c.json(
        { error: "Cannot generate summary for an empty conversation." },
        400
      );
    }

    const summary = await generateAISummaries(
      conversationId,
      conversationMessages
    );

    return c.json(summary);
  } catch (error: any) {
    console.error("AI Summarize Route Error:", error);
    return c.json({ error: error.message || "Failed to generate summary" }, 500);
  }
})
  .get("/:conversationId/summary", async (c) => {
    const conversationId = c.req.param("conversationId");
    const summary = await getLatestConversationSummary(conversationId);
    return c.json(summary);
  })
  // DELETE /:conversationId/messages — clear ALL messages in a conversation
  .delete("/:conversationId/messages", async (c) => {
    const user = c.get("user");
    const conversationId = c.req.param("conversationId");

    // Verify caller is a participant
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    if (!conv) throw new HTTPException(404, { message: "Conversation not found" });

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, conv.matchId));
    if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
      throw new HTTPException(403, { message: "Not authorized" });
    }

    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    return c.json({ message: "Chat cleared" });
  })
  // DELETE /:conversationId/messages/:messageId — delete a single message (sender only)
  .delete("/:conversationId/messages/:messageId", async (c) => {
    const user = c.get("user");
    const { conversationId, messageId } = c.req.param();

    const [msg] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (!msg) throw new HTTPException(404, { message: "Message not found" });
    if (msg.senderId !== user.id) throw new HTTPException(403, { message: "Not your message" });

    await db.delete(messages).where(eq(messages.id, messageId));
    return c.json({ message: "Message deleted" });
  });

export { conversationsApp };