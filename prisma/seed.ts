// Seed: settings row, one starter admin, two categories, two products with
// a tiny preview STL written to ./storage/public/ so the viewer renders
// immediately on a fresh checkout.
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// 1cm cube STL (ASCII) — tiny, valid, just enough for the viewer.
const CUBE_STL = `solid cube
  facet normal 0 0 -1
    outer loop
      vertex 0 0 0
      vertex 1 1 0
      vertex 1 0 0
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 0
      vertex 0 1 0
      vertex 1 1 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 1
      vertex 1 0 1
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 1
      vertex 1 1 1
      vertex 0 1 1
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 1 0 1
      vertex 0 0 1
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1 0 0
      vertex 1 1 0
      vertex 1 1 1
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1 0 0
      vertex 1 1 1
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 1 1 0
      vertex 0 1 0
      vertex 0 1 1
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 1 1 0
      vertex 0 1 1
      vertex 1 1 1
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 1 0
      vertex 0 0 0
      vertex 0 0 1
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 1 0
      vertex 0 0 1
      vertex 0 1 1
    endloop
  endfacet
endsolid cube
`;

async function writePublic(key: string, body: string | Buffer) {
  const dir = path.resolve(process.cwd(), "storage", "public");
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return `/api/storage/public/${key}`;
}

async function writePrivate(key: string, body: string | Buffer) {
  const dir = path.resolve(process.cwd(), "storage", "private");
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return key;
}

// 1x1 transparent PNG placeholder for product images.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function main() {
  // Settings singleton.
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // Default admin.
  const username = "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-now";
  const hash = await argon2.hash(password);
  await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash: hash },
  });
  console.log(
    `\nSeed admin: username "${username}" / password "${password}"\n`,
  );

  // Categories.
  const keychains = await prisma.category.upsert({
    where: { slug: "keychains" },
    update: {},
    create: {
      slug: "keychains",
      name: "Keychains",
      description: "Tiny things to clip on your bag.",
      sortOrder: 10,
    },
  });
  const desktoys = await prisma.category.upsert({
    where: { slug: "desk-toys" },
    update: {},
    create: {
      slug: "desk-toys",
      name: "Desk toys",
      description: "Stuff to fiddle with while you think.",
      sortOrder: 20,
    },
  });

  // Products + tiny STLs + placeholder images.
  const previewUrl = await writePublic("seed/cube-preview.stl", CUBE_STL);
  const productionKey = await writePrivate("seed/cube-production.stl", CUBE_STL);
  const imgUrl = await writePublic("seed/cube-image.png", PLACEHOLDER_PNG);

  const dino = await prisma.product.upsert({
    where: { slug: "dino-keychain" },
    update: {},
    create: {
      slug: "dino-keychain",
      title: "Dino keychain",
      description:
        "A little stegosaurus you can clip on your bag. Roars not included (sorry).",
      priceCents: 600,
      categoryId: keychains.id,
      previewStlUrl: previewUrl,
      productionStlKey: productionKey,
      available: true,
    },
  });
  await prisma.productImage.deleteMany({ where: { productId: dino.id } });
  await prisma.productImage.create({
    data: { productId: dino.id, url: imgUrl, alt: "Dino keychain", sortOrder: 0 },
  });

  const fidget = await prisma.product.upsert({
    where: { slug: "fidget-cube" },
    update: {},
    create: {
      slug: "fidget-cube",
      title: "Fidget cube",
      description:
        "Spinny, clicky, click-spinny. Made for hands that need to do something.",
      priceCents: 1200,
      categoryId: desktoys.id,
      previewStlUrl: previewUrl,
      productionStlKey: productionKey,
      available: true,
    },
  });
  await prisma.productImage.deleteMany({ where: { productId: fidget.id } });
  await prisma.productImage.create({
    data: { productId: fidget.id, url: imgUrl, alt: "Fidget cube", sortOrder: 0 },
  });

  // Shared colour palette (idempotent by unique name).
  const palette = [
    { name: "Galaxy Purple", hex: "#5b2a86" },
    { name: "Lava Red", hex: "#e23b2e" },
    { name: "Ocean Blue", hex: "#1f6feb" },
    { name: "Slime Green", hex: "#3fb950" },
    { name: "Sunshine Yellow", hex: "#f2c200" },
    { name: "Bubblegum Pink", hex: "#ff5da2" },
    { name: "Midnight Black", hex: "#101012" },
    { name: "Cloud White", hex: "#f5f5f3" },
  ];
  for (const [i, c] of palette.entries()) {
    await prisma.colorOption.upsert({
      where: { name: c.name },
      update: { hex: c.hex },
      create: { name: c.name, hex: c.hex, sortOrder: i * 10 },
    });
  }

  // Give the fidget cube two example options if it has none yet.
  const fidgetOptions = await prisma.productOption.count({
    where: { productId: fidget.id },
  });
  if (fidgetOptions === 0) {
    await prisma.productOption.createMany({
      data: [
        { productId: fidget.id, label: "Base colour", slots: 1, sortOrder: 0 },
        {
          productId: fidget.id,
          label: "Keystone colours",
          slots: 9,
          sortOrder: 10,
        },
      ],
    });
  }

  console.log("Seeded categories, products, colours, options, and starter admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
