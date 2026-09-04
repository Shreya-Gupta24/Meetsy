import { db } from "@/db";
import { communities, communityMembers, learningGoals } from "@/db/schema";
import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./middleware/auth-middleware";
import { z } from "zod";

type Variables = {
  userId: string;
};

const communitiesApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  // GET /all — browse all communities with ranked search (name first, then tag matches)
  .get("/all", async (c) => {
    const search = c.req.query("search")?.trim();

    if (!search) {
      const all = await db.select().from(communities);
      return c.json(all.map((c) => ({ ...c, matchType: "name" as const })));
    }

    // 1. Communities whose name matches the search
    const nameMatches = await db
      .select()
      .from(communities)
      .where(ilike(communities.name, `%${search}%`));

    const nameMatchIds = new Set(nameMatches.map((c) => c.id));

    // 2. Community IDs whose learning-goal tags contain the search term
    //    Cast jsonb tags column to text for ilike matching
    const tagGoals = await db
      .selectDistinct({ communityId: learningGoals.communityId })
      .from(learningGoals)
      .where(sql`${learningGoals.tags}::text ilike ${'%' + search + '%'}`);

    const tagOnlyCommunityIds = tagGoals
      .map((g) => g.communityId)
      .filter((id) => !nameMatchIds.has(id));

    let tagMatches: (typeof communities.$inferSelect)[] = [];
    if (tagOnlyCommunityIds.length > 0) {
      tagMatches = await db
        .select()
        .from(communities)
        .where(inArray(communities.id, tagOnlyCommunityIds));
    }

    return c.json([
      ...nameMatches.map((c) => ({ ...c, matchType: "name" as const })),
      ...tagMatches.map((c) => ({ ...c, matchType: "tag" as const })),
    ]);
  })
  // GET / — fetch communities the signed-in user has joined (with optional ranked search)
  .get("/", async (c) => {
    const user = c.get("user");
    const search = c.req.query("search")?.trim();

    // Base query: all user memberships with community data
    const allUserCommunities = await db
      .select({
        id: communityMembers.id,
        userId: communityMembers.userId,
        communityId: communityMembers.communityId,
        joinedAt: communityMembers.joinedAt,
        community: communities,
      })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, user.id));

    if (!search) {
      return c.json(
        allUserCommunities.map((c) => ({ ...c, matchType: "name" as const }))
      );
    }

    const lowerSearch = search.toLowerCase();

    // 1. Name matches — community name contains search
    const nameMatches = allUserCommunities.filter((c) =>
      c.community.name.toLowerCase().includes(lowerSearch)
    );
    const nameMatchIds = new Set(nameMatches.map((c) => c.communityId));

    // 2. Tag matches — user's goals in remaining communities have matching tags
    const remainingIds = allUserCommunities
      .map((c) => c.communityId)
      .filter((id) => !nameMatchIds.has(id));

    let tagMatchIds = new Set<string>();
    if (remainingIds.length > 0) {
      const tagGoals = await db
        .selectDistinct({ communityId: learningGoals.communityId })
        .from(learningGoals)
        .where(
          and(
            eq(learningGoals.userId, user.id),
            inArray(learningGoals.communityId, remainingIds),
            sql`${learningGoals.tags}::text ilike ${"%" + search + "%"}`
          )
        );
      tagMatchIds = new Set(tagGoals.map((g) => g.communityId));
    }

    const tagMatches = allUserCommunities.filter((c) =>
      tagMatchIds.has(c.communityId)
    );

    return c.json([
      ...nameMatches.map((c) => ({ ...c, matchType: "name" as const })),
      ...tagMatches.map((c) => ({ ...c, matchType: "tag" as const })),
    ]);
  })

  // POST / — create a new community (creator is auto-joined)
  .post("/", async (c) => {
    const user = c.get("user");

    const createCommunitySchema = z.object({
      name: z.string().min(1, "Name is required").max(100),
      description: z.string().max(500).optional(),
    });

    const body = await c.req.json();
    const result = createCommunitySchema.safeParse(body);
    if (!result.success) {
      throw new HTTPException(400, {
        message: result.error.issues[0]?.message ?? "Invalid input",
      });
    }
    const { name, description } = result.data;

    const [newCommunity] = await db
      .insert(communities)
      .values({
        name,
        description: description ?? null,
        createdById: user.id,
      })
      .returning();

    // Auto-join the creator
    await db.insert(communityMembers).values({
      userId: user.id,
      communityId: newCommunity.id,
    });

    return c.json(newCommunity, 201);
  })
  // POST /:communityId/join
  .post("/:communityId/join", async (c) => {
    const user = c.get("user");
    const communityId = c.req.param("communityId");

    const [existing] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (existing) {
      throw new HTTPException(400, {
        message: "User already joined community",
      });
    }

    await db.insert(communityMembers).values({
      userId: user.id,
      communityId: communityId,
    });
    return c.json({
      message: "Joined community successfully",
      communityId: communityId,
    });
  })
  // POST /:communityId/leave — always just removes membership (works for creators too)
  .post("/:communityId/leave", async (c) => {
    const user = c.get("user");
    const communityId = c.req.param("communityId");

    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (!membership) {
      throw new HTTPException(400, { message: "You are not a member of this community" });
    }

    await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    return c.json({ message: "Left community successfully" });
  })
  // GET /:communityId/goals
  .get("/:communityId/goals", async (c) => {
    const user = c.get("user");
    const communityId = c.req.param("communityId");

    const goals = await db
      .select()
      .from(learningGoals)
      .where(
        and(
          eq(learningGoals.userId, user.id),
          eq(learningGoals.communityId, communityId)
        )
      );

    return c.json(goals);
  })
  // DELETE /:communityId — delete (creator) or leave (member)
  .delete("/:communityId", async (c) => {
    const user = c.get("user");
    const communityId = c.req.param("communityId");

    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId));

    if (!community) {
      throw new HTTPException(404, { message: "Community not found" });
    }

    if (community.createdById === user.id) {
      // Creator: delete the entire community (cascade members + goals)
      await db
        .delete(communityMembers)
        .where(eq(communityMembers.communityId, communityId));
      await db
        .delete(learningGoals)
        .where(eq(learningGoals.communityId, communityId));
      await db
        .delete(communities)
        .where(eq(communities.id, communityId));
      return c.json({ message: "Community deleted" });
    }

    // Non-creator: just remove their membership (leave)
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (!membership) {
      throw new HTTPException(400, { message: "You are not a member of this community" });
    }

    await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    return c.json({ message: "Left community successfully" });
  });

export { communitiesApp };
