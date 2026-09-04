import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";
import { env } from "./env";
 // your prisma client instance

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql", // or "mysql", "sqlite", ...etc
    }),

    socialProviders:{
        github : {
            clientId:env.GITHUB_CLIENT_ID,
            clientSecret:env.GITHUB_CLIENT_SECRET
        },
        google :{
            clientId:env.GOOGLE_CLIENT_ID,
            clientSecret:env.GOOGLE_CLIENT_SECRET
        }
    }
});