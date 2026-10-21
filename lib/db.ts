import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // 1. Create a connection pool using the standard Postgres driver
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  
  // 2. Wrap the pool in Prisma's adapter
  const adapter = new PrismaPg(pool)
  
  // 3. Initialize the Prisma Client with the adapter options
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma