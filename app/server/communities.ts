import {Hono} from "hono";
import { db } from "@/db/index";
import { communities, communityMembers, learningGoals } from "@/db/schema";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm"
import { getOrCreateUserByClerkId } from "@/lib/user-utils";

type Variables = {
    userId: string
}

const communitiesApp= new Hono<{Variables : Variables}>()
    
//listing all communities
    .get("/all", async(c) => {
        const allCommunities= await db.select().from(communities)
        return c.json(allCommunities);
    })
//lisit=ng the communities in which the user has joined
    .get("/", async(c) => {
        try {
            const clerkId = c.get("userId");
            if (!clerkId) {
                return c.json([], 401); // 👈 Always return an empty array on auth failures!
            }

            const user = await getOrCreateUserByClerkId(clerkId);
            if (!user) {
                return c.json([], 404); // 👈 Always return an empty array with error status!
            }

            const userCommunities = await db
                .select({
                    id: communityMembers.id,
                    userId: communityMembers.userId,
                    communityId: communityMembers.communityId,
                    joinedAt: communityMembers.joinedAt,
                    community: communities,
                })
                .from(communityMembers)
                .innerJoin(communities, eq(communityMembers.communityId, communities.id))
                .where(eq(communityMembers.userId, user.id)); // ✅ FIX: Use user.id (the database UUID)

            return c.json(userCommunities);
        } catch (err) {
            console.error("❌ Hono Database Route Crashed:", err);
            return c.json([], 500); // 👈 Fallback array prevents frontend breakdown
        }
    })
//joining a community
    .post("/:communityId/join", async(c)=> {
    const {communityId}= c.req.param();
    const userId= c.get("userId");
    const user= await getOrCreateUserByClerkId(userId);
    if(!user){
        throw new HTTPException(404, {message: "User not found"});
    }
    const [existing]= await db.select().from(communityMembers).where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, communityId)));
    if(existing){
        throw new HTTPException(400, {message: "User already joined the community"});
    }
    //inserting the user in the community by adding values to communityMembers table
    await db.insert(communityMembers).values({
        userId: user.id,
        communityId: communityId,
    })
    return c.json({message: "Joined community successfully",
        communityId: communityId
    });
})
//get the learning goals of the communitis of the user
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

export {communitiesApp};