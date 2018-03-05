import { MongoClient, Db } from "mongodb"

export default class MClient {
  /**
   * db returns a MongoClient
   * @param doc The document to insert
   * @param user The username to insert into
   * @returns Response
   */ static async insert(url: string, message: string, user: string) {
    let mclient: MongoClient
    const coll = await MongoClient.connect(url).then(client => {
      mclient = client
      return client.db("sentiment").collection("data")
    })
    try {
      coll
        .updateOne(
          { user },
          { $push: { messages: { message } } },
          { upsert: true }
        )
        .then(res => {})
        .then(() => mclient.close())
        .catch(err => console.error(err))
    } catch (e) {
      console.error(e)
    }
  }
}
