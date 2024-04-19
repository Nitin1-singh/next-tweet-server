import { Tweet } from "@prisma/client";
import { GraphqlContext } from "../interfaces"
import { prismaClient } from "../services/db/db";
import { redisClient } from "../services/redis";

interface payload {
  content: string;
  image_url?: string;
}

const queries = {
  getAllTweets: async () => {
    const cachedTweet = await redisClient.get("all-tweet")
    if (cachedTweet) return JSON.parse(cachedTweet)
    const data = await prismaClient.tweet.findMany({ orderBy: { created_at: "desc" } })
    await redisClient.set("all-tweet", JSON.stringify(data))
    return data
  }
}

const mutations = {
  createTweet: async (parent: any, { payload }: { payload: payload }, ctx: GraphqlContext) => {
    if (!ctx.user) throw new Error("You are not authenticated")
    const rateLimit = await redisClient.get(`rate-tweet-${ctx.user.id}`)
    if (rateLimit) throw new Error("Please Wait...")
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        image_url: payload.image_url,
        author: { connect: { id: ctx.user.id } },
      }
    })
    await redisClient.setex(`rate-tweet-${ctx.user.id}`, 10, 1)
    await redisClient.del("all-tweet")
    return tweet
  }
}

const extraResolvers = {
  Tweet: {
    author: async (parent: Tweet) => {
      const data = await prismaClient.user.findUnique({ where: { id: parent.authorId } })
      return data
    }
  }
}

export const resolvers = { mutations, extraResolvers, queries }