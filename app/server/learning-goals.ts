import { db } from "@/db";
import { learningGoals } from "@/db/schema";
import { getOrCreateUserByClerkId } from "@/lib/user-utils";
import { and, eq } from "drizzle-orm";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z, ZodType } from "zod";
import { authMiddleware } from "./middleware/auth-middleware";

type Variables = {
  userId: string;
};

const validateBody= async <T>(c: Context, schema: ZodType<T>): Promise<T> => {
    const body= await c.req.json();
    const result= schema.safeParse(body);
    if(!result.success){
        const errors=result.error.issues.map((err)=> ({
            field: err.path.join("."),
            message: err.message,
        }))
        throw new HTTPException(400, {message: errors.length===1 ? errors[0].message : `Validation failed: ${errors.map((e)=> e.message).join(",")}`});
    }
    return result.data;
};
const createGoalSchema = z.object({
    communityId: z.string().min(1, "Community ID is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()])
            .optional()
            .nullable()
            .transform((val) => {
              if (!val) return [];
              if (Array.isArray(val)) return val;
              return val.split(",").map((t) => t.trim()).filter(Boolean);
          }),
});

const learningGoalsApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .get("/:communityId/goals", async (c) => {
    const user = c.get("user");
    const {communityId} = c.req.param();

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
  .post("/goals", async (c) => {
    const user = c.get("user");
    const body = await validateBody(c, createGoalSchema);

    const [goal] = await db
      .insert(learningGoals)
      .values({
        userId: user.id,
        communityId: body.communityId,
        title: body.title,
        description: body.description,
        tags: body.tags || [],
      })
      .returning();
    return c.json(goal);
  })
  .get("/goals", async (c) => {
    const user = c.get("user");
    const goals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, user.id));
    return c.json(goals);
  })
  // DELETE /goals/:goalId — delete a specific learning goal (owner only)
  .delete("/goals/:goalId", async (c) => {
    const user = c.get("user");
    const goalId = c.req.param("goalId");

    const [goal] = await db
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.id, goalId), eq(learningGoals.userId, user.id)));

    if (!goal) {
      throw new HTTPException(404, { message: "Goal not found or not yours" });
    }

    await db.delete(learningGoals).where(eq(learningGoals.id, goalId));
    return c.json({ message: "Goal deleted" });
  });

export { learningGoalsApp };
