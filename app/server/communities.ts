import {Hono} from "hono";
import { db } from "@/db/index";
import { communities, communityMembers } from "@/db/schema";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm"
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
    const community= await db.select().from(communities).where(eq(communities.id, communityId));
    //check if community exists
    if(!community){
        throw new HTTPException(404, {message: "Community not found"});
    }
    //inserting the user in the community by adding values to communityMembers table
    await db.insert(communityMembers).values({
        userId: userId,
        communityId: communityId,
    })
    return c.json({message: "Joined community successfully"});
})

export {communitiesApp};