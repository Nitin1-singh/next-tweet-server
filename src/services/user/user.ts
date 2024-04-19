import axios from "axios"
import { GoogleUserInfo } from "../../user/resolvers"
import JWTService from "../auth/jwt"
import { prismaClient } from "../db/db"

class UserServices {
  public static async verifyGoogleAuthToken(token: string) {
    const googleToken = token
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo")
    googleOauthURL.searchParams.set("id_token", googleToken)
    const { data } = await axios.get<GoogleUserInfo>(googleOauthURL.toString(), {
      responseType: "json"
    })

    const user = await prismaClient.user.findUnique({ where: { email: data.email } })

    if (!user) {
      await prismaClient.user.create({
        data: {
          first_name: data.given_name,
          last_name: data.family_name,
          profile_img_url: data.picture,
          email: data.email
        }
      })!
    }
    const userInDB = await prismaClient.user.findUnique({ where: { email: data.email } })
    if (!userInDB) throw new Error("User not found by this Email")
    const generatedToken = JWTService.generateTokenForUser(userInDB)
    return generatedToken
  }
  public static followUser(from: string, to: string) {
    return (
      prismaClient.follows.create({
        data: {
          follower: { connect: { id: from } },
          following: { connect: { id: to } }
        }
      })
    )
  }
  public static unfollowUser(from: string, to: string) {
    return (
      prismaClient.follows.delete({
        where: {
          followerId_followingId: { followerId: from, followingId: to }
        }
      })
    )

  }
}

export default UserServices