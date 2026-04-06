import { PrismaClient } from "../src/generated/prisma/index.js"; 
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log(" Starting seeding...");

  // ------------------------------------------------------------------
  // 1. SEED USERS
  // ------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@booknet.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@booknet.com",
      username: "admin",
      passwordHash,
      role: "ADMIN",
      Profile: {
        create: {
          designation: "System Administrator",
          mobile: "0771234567",
        },
      },
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@booknet.com" },
    update: {},
    create: {
      firstName: "John",
      lastName: "Doe",
      email: "customer@booknet.com",
      username: "johndoe",
      passwordHash,
      role: "CUSTOMER",
      Profile: {
        create: {
          mobile: "0779876543",
          address: "123 Main Street, Colombo",
        },
      },
    },
  });

  const deliveryUser = await prisma.user.upsert({
    where: { email: "delivery@booknet.com" },
    update: {},
    create: {
      firstName: "Dilan",
      lastName: "Perera",
      email: "delivery@booknet.com",
      username: "delivery",
      passwordHash,
      role: "DELIVERY",
      Profile: {
        create: {
          designation: "Delivery Staff",
          mobile: "0712223344",
        },
      },
    },
  });

  console.log(" Users seeded");

  // ------------------------------------------------------------------
  // 2. SEED CATEGORIES
  // ------------------------------------------------------------------
  const categories = [
    { name: "Books", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80" },
    { name: "eBooks", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80" },
    { name: "Stationery", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80" },
    { name: "Notebooks", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80" },
    { name: "Pens & Pencils", image: "https://images.unsplash.com/photo-1588776814546-56f49f40d7b8?w=800&q=80" },
    { name: "Art Supplies", image: "https://images.unsplash.com/photo-1580894908361-967195033215?w=800&q=80" },
    { name: "Magazines", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80" },
    { name: "Educational eBooks", image: "https://images.unsplash.com/photo-1553729784-e91953dec042?w=800&q=80" },
    { name: "Children’s Books", image: "https://images.unsplash.com/photo-1526318472351-bc6c2ebd2a88?w=800&q=80" },
    { name: "Office Supplies", image: "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=800&q=80" },
    { name: "Fiction", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80" },
    { name: "Non-Fiction", image: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800&q=80" },
    { name: "Science & Technology", image: "https://images.unsplash.com/photo-1581090700227-4c4e6c3bcd5c?w=800&q=80" },
    { name: "History", image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80" },
    { name: "Comics & Graphic Novels", image: "https://images.unsplash.com/photo-1587735243615-c89cae4dc85b?w=800&q=80" },
    { name: "Romance", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80" },
    { name: "Thrillers & Mystery", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80" },
    { name: "Fantasy", image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80" },
    { name: "Health & Fitness", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80" },
    { name: "Cookbooks", image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80" },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories[cat.name] = category;
  }

  console.log(" Categories seeded");

  // ------------------------------------------------------------------
  // 3. SEED PRODUCTS 
  // ------------------------------------------------------------------
  const productsData = [
    // 25 Fiction Books
    ...Array.from({ length: 25 }).map((_, i) => ({
      sku: `BOOK${String(i + 1).padStart(3, "0")}`,
      title: `Fictional Story ${i + 1}`,
      description: `An engaging fictional tale number ${i + 1}.`,
      price: (20 + i).toFixed(2),
      salePrice: i % 3 === 0 ? (18 + i).toFixed(2) : null,
      type: "BOOK",
      stock: 100 - i,
      isDigital: false,
      categoryId: createdCategories["Fiction"].id,
      primaryImageText: `Fiction Book ${i + 1}`,
    })),
    // 20 Non-Fiction Books
    ...Array.from({ length: 20 }).map((_, i) => ({
      sku: `NFBOOK${String(i + 1).padStart(3, "0")}`,
      title: `Non-Fiction Title ${i + 1}`,
      description: `A detailed non-fictional reference book number ${i + 1}.`,
      price: (30 + i).toFixed(2),
      salePrice: i % 2 === 0 ? (28 + i).toFixed(2) : null,
      type: "BOOK",
      stock: 80,
      isDigital: false,
      categoryId: createdCategories["Non-Fiction"].id,
      primaryImageText: `Non-Fiction Book ${i + 1}`,
    })),
    // 15 E-Books
    ...Array.from({ length: 15 }).map((_, i) => ({
      sku: `EBOOK${String(i + 1).padStart(3, "0")}`,
      title: `E-Book Title ${i + 1}`,
      description: `Digital edition of e-book ${i + 1}.`,
      price: (15 + i).toFixed(2),
      salePrice: i % 4 === 0 ? (12 + i).toFixed(2) : null,
      type: "EBOOK",
      stock: 999,
      isDigital: true,
      categoryId: createdCategories["eBooks"].id,
      primaryImageText: `E-Book ${i + 1}`,
    })),
    // 10 Stationery Items
    ...Array.from({ length: 10 }).map((_, i) => ({
      sku: `STAT${String(i + 1).padStart(3, "0")}`,
      title: `Stationery Item ${i + 1}`,
      description: `High-quality stationery product number ${i + 1}.`,
      price: (5 + i).toFixed(2),
      salePrice: i % 2 === 0 ? (4 + i).toFixed(2) : null,
      type: "STATIONERY",
      stock: 200,
      isDigital: false,
      categoryId: createdCategories["Stationery"].id,
      primaryImageText: `Stationery ${i + 1}`,
    })),
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        title: p.title,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice,
        type: p.type,
        stock: p.stock,
        sku: p.sku,
        isDigital: p.isDigital,
        categoryId: p.categoryId,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/${p.sku}-1/600/400`,
              altText: `${p.primaryImageText} Cover`,
              isPrimary: true,
            },
            {
              url: `https://picsum.photos/seed/${p.sku}-2/400/300`,
              altText: `${p.primaryImageText} Sample`,
            },
          ],
        },
      },
    });
  }

  console.log(" Products seeded");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seeding completed successfully!");
  })
  .catch(async (e) => {
    console.error(" Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
