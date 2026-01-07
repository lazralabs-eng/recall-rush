import { type Tile } from "../features/play/shareGrid";

type RunGridProps = {
  pattern: Tile[] | string;
  size?: "sm" | "lg";
};

export function RunGrid({ pattern, size = "lg" }: RunGridProps) {
  // Convert string pattern to Tile array if needed
  const tiles: Tile[] =
    typeof pattern === "string"
      ? (pattern.split("") as Tile[])
      : pattern;

  // Size variants
  const blockSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const gap = size === "sm" ? "gap-1" : "gap-1.5";

  return (
    <div className={`flex flex-wrap ${gap} justify-center`}>
      {tiles.map((tile, i) => {
        let bgColor = "";
        switch (tile) {
          case "G":
            bgColor = "bg-green-500";
            break;
          case "R":
            bgColor = "bg-red-500";
            break;
          case "T":
            bgColor = "bg-gray-300";
            break;
        }
        return (
          <div
            key={i}
            className={`${blockSize} ${bgColor} rounded-sm`}
          />
        );
      })}
    </div>
  );
}
