import 'dotenv/config'
import ws from 'ws'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// import PrismaClient the ESM‑safe way:
import pkg from '../generated/prisma/client.js';
const { PrismaClient } = pkg;

// tell the Neon driver how to open WebSocket connections
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL

// create Prisma client using the Neon adapter
const adapter = new PrismaNeon({ connectionString })
export const prisma = new PrismaClient({ adapter })