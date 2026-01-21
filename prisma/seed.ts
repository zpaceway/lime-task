import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const patients = [
    {
      name: "John Smith",
      dob: new Date("1985-03-15"),
      gender: "Male",
      phone: "(555) 123-4567",
      address: "123 Oak Street, Springfield, IL 62701",
    },
    {
      name: "Maria Garcia",
      dob: new Date("1972-08-22"),
      gender: "Female",
      phone: "(555) 234-5678",
      address: "456 Maple Avenue, Chicago, IL 60601",
    },
    {
      name: "Robert Johnson",
      dob: new Date("1990-11-30"),
      gender: "Male",
      phone: "(555) 345-6789",
      address: "789 Pine Road, Peoria, IL 61602",
    },
  ];

  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { id: patient.name.toLowerCase().replace(/\s/g, "-") },
      update: patient,
      create: {
        ...patient,
        id: patient.name.toLowerCase().replace(/\s/g, "-"),
      },
    });
  }

  console.log("Seed completed: 3 patients created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
