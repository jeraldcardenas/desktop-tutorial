import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Shop catalog. `slot` + `value` map straight onto AvatarConfig — equipping
 * an item sets profile.avatar[slot] = value. Values 0–2 are free defaults
 * in the creator; shop items unlock the higher indices.
 */
const ITEMS = [
  { id: 'hair_spiky', slot: 'hair', value: 2, name: 'Spiky Hair', rarity: 'COMMON', costCoins: 50 },
  { id: 'hair_long', slot: 'hair', value: 3, name: 'Long Hair', rarity: 'COMMON', costCoins: 50 },
  { id: 'haircolor_pink', slot: 'hairColor', value: 4, name: 'Pixel Pink Dye', rarity: 'RARE', costCoins: 120 },
  { id: 'haircolor_green', slot: 'hairColor', value: 5, name: 'Glitch Green Dye', rarity: 'RARE', costCoins: 120 },
  { id: 'top_knight', slot: 'top', value: 3, name: 'Knight Tunic', rarity: 'RARE', costCoins: 150 },
  { id: 'top_mage', slot: 'top', value: 4, name: 'Mage Robe', rarity: 'RARE', costCoins: 150 },
  { id: 'top_champion', slot: 'top', value: 5, name: 'Champion Jersey', rarity: 'EPIC', costCoins: 400 },
  { id: 'bottom_ranger', slot: 'bottom', value: 3, name: 'Ranger Pants', rarity: 'COMMON', costCoins: 80 },
];

async function main() {
  for (const item of ITEMS) {
    await prisma.cosmeticItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${ITEMS.length} cosmetic items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
