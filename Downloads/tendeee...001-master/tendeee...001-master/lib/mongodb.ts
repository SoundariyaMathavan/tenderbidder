import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI!
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri)
  globalWithMongo._mongoClientPromise = client.connect()
}

clientPromise = globalWithMongo._mongoClientPromise!

export default clientPromise

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db("tenderchain") // Change name if your DB is named differently
}
