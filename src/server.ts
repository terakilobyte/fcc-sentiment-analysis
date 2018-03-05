import https from "https"
import dotenv from "dotenv"
import AYLIENTTextAPI from "aylien_textapi"
import MClient from "./client"
import { MongoClient, Collection } from "mongodb"
dotenv.config()
const heartbeat = " \n"

const options = {
  hostname: "stream.gitter.im",
  port: 443,
  path: "/v1/rooms/" + process.env.GITTER_ROOM_ID + "/chatMessages",
  method: "GET",
  headers: { Authorization: "Bearer " + process.env.GITTER_API_TOKEN }
}

const textapi = new AYLIENTTextAPI({
  application_id: process.env.AYLIEN_APP_ID,
  application_key: process.env.AYLIEN_APP_KEY
})

type FromUser = {
  username: string
}

type MsgJSON = {
  text: string
  fromUser: FromUser
}

type DataPoint = {
  user: string
  text: string
}

const blacklistedUsers = ["terakilobyte"]

const req = https.request(options, function(res) {
  res.on("data", function(chunk) {
    const msg = chunk.toString()
    if (msg !== heartbeat) {
      const msgJson: MsgJSON = JSON.parse(msg)
      console.log(msgJson)
      const text = msgJson.text.replace(/`{1,3}[\s\S.]*`{1,3}/g, "")
      if (text.length > 5) {
        const chatterer: DataPoint = {
          user: msgJson.fromUser.username,
          text
        }
        if (blacklistedUsers.indexOf(chatterer.user) === -1) {
          textapi.sentiment(
            {
              text: msgJson.text
            },
            (err: Error, response: string) => {
              if (err) {
                console.error(err)
              } else {
                MClient.insert(
                  process.env.MONGODB_URI,
                  response,
                  chatterer.user
                )
              }
            }
          )
        }
      }
    }
  })
})

req.on("error", function(e) {
  console.log("Something went wrong: " + e.message)
})

req.end()
