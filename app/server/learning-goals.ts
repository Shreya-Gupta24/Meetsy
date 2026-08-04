import { db } from "@/db";
import { learningGoals } from "@/db/schema";
import { getOrCreateUserByClerkId } from "@/lib/user-utils";
import { and, eq } from "drizzle-orm";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z, ZodType } from "zod";

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
const createGoalSchema= z.object({
    title: z.string().min(1,"Title is required"),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const learningGoalsApp = new Hono<{ Variables: Variables }>()
    .get("/:communityId/goals", async(c) => {
        const userId= c.get("userId");
        const {communityId}= c.req.param();
        const user= await getOrCreateUserByClerkId(userId);
        if(!user){
            throw new HTTPException(404, {message: "User not found"});
        }
        const goals= await db.select().from(learningGoals).where(and(eq(learningGoals.userId, user.id), eq(learningGoals.communityId, communityId)));
        return c.json(goals);
    })

    .post("/:communityId/goals", async (c) => {
        const clerkId= c.get("userId");
        
        const body= await validateBody(c, createGoalSchema);
        
        const user= await getOrCreateUserByClerkId(clerkId);
        if(!user){
            throw new HTTPException(404, { message: "User not found" });
        }
        const [goal]= await db.insert(learningGoals).values({
            userId: user.id,
            communityId: c.req.param("communityId"),
            title: body.title,
            description: body.description,
            tags: body.tags || [],
        }).returning();
        return c.json(goal);
    });


export { learningGoalsApp };
