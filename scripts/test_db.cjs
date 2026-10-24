require('dotenv').config({ path: 'd:/Oqulix/Oqulix Projects/GameFaktory/The Gamefaktory Server/server/.env' });
const { PrismaClient } = require('d:/Oqulix/Oqulix Projects/GameFaktory/The Gamefaktory Server/server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'NONE');
  const token = await prisma.qrToken.findFirst();
  console.log('Found token:', token ? token.code : 'NONE');
  process.exit(0);
}

run().catch((err) => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
