import { mulberry32 } from './rng';
import { GridPos, NpcSnapshot } from './types';

export const ZONE_ID = 'beginner-village';
export const ZONE_W = 40;
export const ZONE_H = 30;

export enum Tile {
  Grass = 0,
  Path = 1,
  Water = 2,
  Tree = 3,
  House = 4,
  Fountain = 5,
  Flowers = 6,
}

const SOLID = new Set([Tile.Water, Tile.Tree, Tile.House, Tile.Fountain]);

export interface ZoneMap {
  tiles: Tile[][]; // [y][x]
  spawn: GridPos;
  npcs: NpcSnapshot[];
  walkable(x: number, y: number): boolean;
}

/**
 * Deterministic Beginner Village generator — the server uses it for collision,
 * the client uses it for rendering, so they can never disagree.
 */
export function generateVillage(): ZoneMap {
  const rng = mulberry32(0xb10c);
  const tiles: Tile[][] = Array.from({ length: ZONE_H }, () =>
    new Array<Tile>(ZONE_W).fill(Tile.Grass),
  );

  // Water border with a tree ring inside it
  for (let y = 0; y < ZONE_H; y++) {
    for (let x = 0; x < ZONE_W; x++) {
      if (x === 0 || y === 0 || x === ZONE_W - 1 || y === ZONE_H - 1) tiles[y][x] = Tile.Water;
      else if (x === 1 || y === 1 || x === ZONE_W - 2 || y === ZONE_H - 2) tiles[y][x] = Tile.Tree;
    }
  }

  // Central plaza
  for (let y = 10; y <= 19; y++) {
    for (let x = 14; x <= 25; x++) tiles[y][x] = Tile.Path;
  }
  // Fountain (2×2) in the middle of the plaza
  for (let y = 14; y <= 15; y++) {
    for (let x = 19; x <= 20; x++) tiles[y][x] = Tile.Fountain;
  }
  // Paths out of the plaza
  for (let x = 2; x < 14; x++) tiles[14][x] = Tile.Path;
  for (let x = 26; x < ZONE_W - 2; x++) tiles[15][x] = Tile.Path;
  for (let y = 20; y < ZONE_H - 2; y++) tiles[y][19] = Tile.Path;
  for (let y = 2; y < 10; y++) tiles[y][20] = Tile.Path;

  // Houses (3×3) with a path tile at the door
  const houses: GridPos[] = [
    { x: 10, y: 8 },  // shop
    { x: 27, y: 8 },
    { x: 10, y: 21 },
  ];
  for (const h of houses) {
    for (let y = h.y; y < h.y + 3; y++) {
      for (let x = h.x; x < h.x + 3; x++) tiles[y][x] = Tile.House;
    }
    tiles[h.y + 3][h.x + 1] = Tile.Path;
  }

  // Scattered trees and flowers on plain grass
  for (let i = 0; i < 140; i++) {
    const x = 2 + rng.int(ZONE_W - 4);
    const y = 2 + rng.int(ZONE_H - 4);
    if (tiles[y][x] !== Tile.Grass) continue;
    tiles[y][x] = rng.next() < 0.35 ? Tile.Tree : Tile.Flowers;
  }

  const npcs: NpcSnapshot[] = [
    { id: 'tobi', name: 'Trainer Tobi', pos: { x: 24, y: 12 }, kind: 'trainer' },
    { id: 'shopkeeper', name: 'Pixel Penny', pos: { x: 11, y: 12 }, kind: 'shopkeeper' },
  ];
  // Keep NPC tiles clear
  for (const npc of npcs) tiles[npc.pos.y][npc.pos.x] = Tile.Path;

  const npcTiles = new Set(npcs.map((n) => `${n.pos.x},${n.pos.y}`));

  return {
    tiles,
    spawn: { x: 19, y: 18 },
    npcs,
    walkable(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= ZONE_W || y >= ZONE_H) return false;
      if (npcTiles.has(`${x},${y}`)) return false;
      return !SOLID.has(tiles[y][x]);
    },
  };
}
