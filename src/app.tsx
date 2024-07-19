import { Dispatch, StateUpdater, useState } from "preact/hooks";
import "./app.css";
import { randomN } from "./utils/number.util";
import { isCandidate, isForbidden, search } from "./utils/search.util";

const regionColors = [
  "hsl(18, 100%, 50%)",
  "hsl(45, 100%, 50%)",
  "hsl(110, 100%, 50%)",
  "hsl(165, 100%, 50%)",
  "hsl(200, 100%, 50%)",
  "hsl(240, 100%, 50%)",
  "hsl(310, 100%, 50%)",
  "hsl(340, 100%, 50%)",
];

const hslRegex = /hsl\((.+), (.+), (.+)\)/g;
const toSelectedHsl = (hsl: string) => {
  const result = hslRegex.exec(hsl);
  if (!result) return hsl;
  const h = result[1];
  const s = result[1];
  return `hsl(${h}, ${s}, 80%)`;
};
const rowColStr = (row: number, col: number) => `${row}-${col}`;

export function App() {
  const [dim, setDims] = useState(randomN());
  const [highlighted, setHighlighted] = useState(new Set<string>());
  const [marked, setMarked] = useState(new Set<string>());
  const [candidates, setCandidates] = useState(new Array<number[]>());

  const [regions, setRegions] = useState({} as Record<string, string>);

  const isHighlighted = (row: number, col: number) =>
    highlighted.has(rowColStr(row, col));

  const isMarked = (row: number, col: number) =>
    marked.has(rowColStr(row, col));

  const isCandidateLocal = (row: number, col: number) =>
    isCandidate(row, col, candidates);

  const isForbiddenLocal = (row: number, col: number) =>
    isForbidden(row, col, dim, candidates);

  const onClickCell = (row: number, col: number) => {
    const rcs = rowColStr(row, col);
    if (isHighlighted(row, col)) {
      setHighlighted((e) => {
        e.delete(rcs);
        return new Set(e);
      });
      setMarked((e) => {
        e.add(rcs);
        return new Set(e);
      });
      setCandidates((v) => [...v, [row, col]]);
    } else if (isMarked(row, col)) {
      setMarked((e) => {
        e.delete(rcs);
        return new Set(e);
      });
      setCandidates((v) =>
        v.filter(([crow, ccol]) => row !== crow && col !== ccol)
      );
    } else {
      setHighlighted((e) => {
        e.add(rcs);
        return new Set(e);
      });
    }
  };

  const newGame = () => {
    const newDim = 7;
    setDims(() => newDim);
    setHighlighted(new Set());
    setMarked(new Set());
    setCandidates(new Array());
    Promise.resolve().then(async () => {
      let candidates = new Array<number[]>();
      while (candidates.length !== newDim) {
        await search(newDim, (c) => (candidates = c));
      }

      const regions = createRegions(candidates, dim, setRegions);

      // setCandidates(candidates);
      setRegions(regions);
    });
  };

  return (
    <>
      <div className="flex flex-col" style="gap: 24px">
        <div className="flex flex-col">
          {Array.from({ length: dim }).map((_, row) => (
            <div key={row} className="flex">
              {Array.from({ length: dim }).map((_, col) => (
                <div
                  key={rowColStr(row, col)}
                  className="tile"
                  style={{
                    background: isMarked(row, col)
                      ? toSelectedHsl(regions[rowColStr(row, col)])
                      : regions[rowColStr(row, col)],
                    cursor: "pointer",
                    textAlign: "center",
                    alignContent: "center",
                  }}
                  onClick={() => onClickCell(row, col)}
                >
                  {isCandidateLocal(row, col) ? (
                    <span>Q</span>
                  ) : isHighlighted(row, col) || isForbiddenLocal(row, col) ? (
                    <span>&times;</span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <span>Size: </span>
          <span>
            {dim} &times; {dim}
          </span>
        </div>
        <div className="flex" style="gap: 12px; justify-content: center">
          <button type="button" onClick={newGame}>
            New
          </button>
        </div>
      </div>
    </>
  );
}
function createRegions(
  candidates: number[][],
  dim: number,
  setRegions?: Dispatch<StateUpdater<Record<string, string>>>
) {
  const regions = createRegionCandidate(candidates, dim, setRegions);

  return regions;
}
function createRegionCandidate(
  candidates: number[][],
  dim: number,
  setRegions?: Dispatch<StateUpdater<Record<string, string>>>
) {
  const regions = {} as Record<string, string>;
  for (let index = 0; index < candidates.length; index++) {
    const [row, col] = candidates[index];

    const color = regionColors[index];
    regions[rowColStr(row, col)] = color;

    const nearestNeighbour = candidates.reduce(
      (a, [r, c]) => {
        if (row === r && col === c) {
          return a;
        }

        const sqrdDistance = (row - r) * (row - r) + (col - c) * (col - c);
        if (a.lastDistance === null) {
          a.lastDistance = sqrdDistance;
          a.neighbour = [r, c];
        } else if (a.lastDistance > sqrdDistance) {
          a.lastDistance = sqrdDistance;
          a.neighbour = [r, c];
        }
        return a;
      },
      {
        neighbour: [row, col],
        lastDistance: null as null | number,
      }
    );
    if (nearestNeighbour.lastDistance === null) {
      continue;
    }
    const smallestRadius = Math.floor(Math.sqrt(nearestNeighbour.lastDistance));
    const radius = randomN(1, smallestRadius);
    if (radius === 0) {
      continue;
    }

    const coordsIsInRange = (n: readonly [number, number]) =>
      n.every((e) => e >= 0 && e < dim);

    for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
      for (let colOffset = -radius; colOffset <= radius; colOffset++) {
        const rcs = rowColStr(row + rowOffset, col + colOffset);
        if (
          isCandidate(row + rowOffset, col + colOffset, candidates) &&
          rowOffset !== 0 &&
          colOffset !== 0
        ) {
          continue;
        }
        if (!coordsIsInRange([row + rowOffset, col + colOffset])) {
          continue;
        }
        regions[rcs] = color;
      }
    }
  }

  const getUnregionedCell = () => {
    for (let row = 0; row < dim; row++) {
      for (let col = 0; col < dim; col++) {
        if (!regions[rowColStr(row, col)]) return [row, col];
      }
    }

    return null;
  };

  function getCluster(
    row: number,
    col: number,
    dim: number,
    regions: Record<string, string>,
    visited: string[] = []
  ): { cluster: number[][]; colors: Set<string> } {
    const cluster = new Array<number[]>();
    const colors = new Set<string>();
    if (!regions[rowColStr(row, col)]) {
      cluster.push([row, col]);
    } else {
      colors.add(regions[rowColStr(row, col)]);
    }

    const coordsIsInRange = (n: readonly [number, number]) =>
      n.every((e) => e >= 0 && e < dim);
    const up = [row - 1, col] as const;
    const down = [row + 1, col] as const;
    const left = [row, col - 1] as const;
    const right = [row, col + 1] as const;

    const visit = (item: readonly [number, number]) => {
      if (coordsIsInRange(item)) {
        const rcs = rowColStr(...item);
        const hasVisited = visited.find((e) => e === rcs);
        if (!hasVisited) {
          visited.push(rcs);
          if (!regions[rcs]) {
            const walked = getCluster(item[0], item[1], dim, regions, visited);
            cluster.push(...walked.cluster);
            walked.colors.forEach((c) => colors.add(c));
          } else {
            colors.add(regions[rcs]);
          }
        }
      }
    };

    visit(up);
    visit(down);
    visit(left);
    visit(right);

    return { cluster, colors };
  }

  let unregionedCell = getUnregionedCell();
  while (unregionedCell) {
    const [row, col] = unregionedCell;

    const cluster = getCluster(row, col, dim, regions, [rowColStr(row, col)]);
    const color: string = cluster.colors.values().next().value;
    for (const [row, col] of cluster.cluster) {
      regions[rowColStr(row, col)] = color;
    }

    setRegions?.(regions);
    unregionedCell = getUnregionedCell();
  }

  return regions;
}
