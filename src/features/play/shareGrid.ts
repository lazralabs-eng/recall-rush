// Wordle-style share grid generator

export type Tile = "G" | "Y" | "R";

export type AnswerEvent = {
  correct: boolean;
  responseMs: number;
  timeout?: boolean;
};

/**
 * Convert answer event to tile color
 * - Timeout or wrong → Red
 * - Correct and fast → Green
 * - Correct but slow → Yellow
 */
export function tileForEvent(
  event: AnswerEvent,
  fastThresholdMs = 900
): Tile {
  if (event.timeout || !event.correct) {
    return "R";
  }
  return event.responseMs <= fastThresholdMs ? "G" : "Y";
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
        case "Y":
          return "🟨";
        case "R":
          return "🟥";
      }
    })
    .join("");
}

/**
 * Split tiles into pyramid rows: 1, 2, 3, 4, 5...
 * Example: 15 tiles → rows of [1, 2, 3, 4, 5]
 */
export function pyramidRows(tiles: Tile[]): Tile[][] {
  const rows: Tile[][] = [];
  let idx = 0;
  let rowSize = 1;

  while (idx < tiles.length) {
    const row = tiles.slice(idx, idx + rowSize);
    rows.push(row);
    idx += rowSize;
    rowSize++;
  }

  return rows;
}

/**
 * Generate emoji pyramid string (newline-delimited rows)
 */
export function emojiPyramid(tiles: Tile[]): string {
  const rows = pyramidRows(tiles);
  return rows.map(tilesToEmoji).join("\n");
}
