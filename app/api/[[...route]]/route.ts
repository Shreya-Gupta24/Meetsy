import {Hono} from "hono";
import {HTTPException} from "hono/http-exception";
import { db } from "@/db/index";
import { communities, communityMembers } from "@/db/schema";
import {handle} from "hono/vercel";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import {communitiesApp} from "@/app/server/communities";
import {learningGoalsApp} from "@/app/server/learning-goals";
import {matchesApp} from "@/app/server/matches";
import {conversationsApp} from "@/app/server/conversations";
import {userApp} from "@/app/server/users";

type Variables= {
    userId: string;
}

const app= new Hono<{Variables: Variables}>().basePath("/api")

//error handler
app.onError((err, c) => {
    console.log("API Error: ", err)
    //error that a route threw
    if(err instanceof HTTPException){
        return err.getResponse();
    } 
    //database error   
    if(err instanceof Error){
        if(
            err.message.includes("violates") ||
            err.message.includes("constraint")
        ){
            return c.json({error: "Invalid data provided"}, 400)
        }
    }
    //route not found error
    if(
        err.message.includes("not found") ||
        err.message.includes("Not Found")
    ){
        return c.json({error: err.message}, 404)
    }
    return c.json({error: "Internal Server Error"}, 500)
})

//middleware
app.use("/*", async(c, next)=> {
    const publicRoutes= ["/api/communities/all"]
    if(publicRoutes.includes(c.req.path)){
        return await next();
    }
    const session= await auth();
    if(!session.userId){
        throw new HTTPException(401, {message: "Unauthorized"});
    }
    c.set("userId", session.userId);
        return await next();
    }
)



const routes= app
    .route("/communities", communitiesApp)
    .route("/communities",learningGoalsApp)
    .route("/matches", matchesApp)
    .route("/conversations", conversationsApp)
    .route("/user", userApp)

export type AppType= typeof routes;

export const GET= handle(app);
export const POST= handle(app);
export const PUT= handle(app);
export const DELETE= handle(app);