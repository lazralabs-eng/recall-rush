// Wordle-style share grid generator

export type Tile = "G" | "R" | "T";

export type AnswerEvent = {
  correct: boolean;
  responseMs: number;
  timeout?: boolean;
};

/**
 * Convert answer event to tile color
 * - Timeout → Gray (T)
 * - Wrong → Red (R)
 * - Correct → Green (G)
 */
export function tileForEvent(event: AnswerEvent): Tile {
  if (event.timeout) {
    return "T";
  }
  if (!event.correct) {
    return "R";
  }
  return "G";
}

/**
 * Convert tiles to emoji string
 */
export function tilesToEmoji(tiles: Tile[]): string {
  return tiles
    .map((t) => {
      switch (t) {
        case "G":
          return "🟩";
        case "R":
          return "🟥";
        case "T":
          return "⬜";
      }
    })
    .join("");
}

/**
 * Split tiles into grid rows with specified row size
 * Example: 25 tiles, rowSize=10 → rows of [10, 10, 5]
 */
export function gridRows(tiles: Tile[], rowSize: number): Tile[][] {
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += rowSize) {
    rows.push(tiles.slice(i, i + rowSize));
  }
  return rows;
}

/**
 * Generate emoji grid string (newline-delimited rows)
 * Default row size: 10 (desktop), use 8 for mobile
 */
export function emojiGrid(tiles: Tile[], rowSize = 10): string {
  const rows = gridRows(tiles, rowSize);
  return rows.map(tilesToEmoji).join("\n");
}
