import axios from "axios"
import { prismaClient } from "../services/db/db";
import JWTService from "../services/auth/jwt";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";
import UserServices from "../services/user/user";

export interface GoogleUserInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  nbf: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string;
  exp: string;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}

const queries = {

  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resToken = await UserServices.verifyGoogleAuthToken(token)
    return resToken
  },

  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id
    if (!id)
      return null
    const user = await prismaClient.user.findUnique({ where: { id } })
    return user
  },

  getUserById: async (parent: any, { id }: { id: string }, ctx: GraphqlContext) => {
    return await prismaClient.user.findUnique({ where: { id: id } })
  }

}


const mutations = {
  followUser: async (parent: any, { to }: { to: string }, ctx: GraphqlContext) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthencated")
    await UserServices.followUser(ctx.user.id, to)
    return true
  },
  unFollowUser: async (parent: any, { to }: { to: string }, ctx: GraphqlContext) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthencated")
    await UserServices.unfollowUser(ctx.user.id, to)
    return true
  }
}

const extraResolvers = {
  User: {
    tweets: (parent: User) => {
      return prismaClient.tweet.findMany({ where: { authorId: parent.id } })
    },
    follower: async (parent: User) => {
      const res = await prismaClient.follows.findMany({ where: { following: { id: parent.id } }, include: { follower: true } })
      return res.map((el) => el.follower)
    },
    following: async (parent: User) => {
      const res = await prismaClient.follows.findMany({ where: { follower: { id: parent.id } }, include: { following: true } })
      return res.map((el) => el.following)
    }
  }
}

export const resolvers = { queries, extraResolvers, mutations }