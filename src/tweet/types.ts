export const types = `#graphql
  input CreateTweetData {
    content:String!
    image_url: String
  }
  type Tweet {
    id:ID!
    content: String!
    image_url: String
    author: User
    authorId:String
    tweet:[Tweet]
  }
`