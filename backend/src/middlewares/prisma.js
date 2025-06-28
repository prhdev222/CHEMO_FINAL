const { PrismaClient } = require('@prisma/client');

// สร้าง PrismaClient instance เดียว (singleton)
const prisma = new PrismaClient();

module.exports = prisma; 