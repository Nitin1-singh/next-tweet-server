import express from "express";
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"

import { User } from "./user";
import { Tweet } from "./tweet/index";

import dotenv from 'dotenv';
import cors from "cors"
import { GraphqlContext } from "./interfaces";
import JWTService from "./services/auth/jwt";
dotenv.config();

async function init() {

  const PORT = 3003
  const app = express()
  const gqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
      ${User.types}
      ${Tweet.types}

      type Query {
        ${User.queries}
        ${Tweet.queries}
      }

      type Mutation {
        ${Tweet.mutations}
        ${User.mutations}
      }
    `,

    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    }
  })


  await gqlServer.start()
  app.use(cors())
  app.use(express.json())
  app.use("/graphql", expressMiddleware(gqlServer, {
    context: async ({ req, res }) => {
      return {
        user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1]) : undefined
      }
    }
  }))

  app.get("/", (req, res) => {
    res.json("hi")
  })

  app.listen(PORT, () => console.log(`port listing at ${PORT}`))
}
init()