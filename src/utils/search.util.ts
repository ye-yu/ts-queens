export type Candidates = number[][];

export const isCandidate = (
  row: number,
  col: number,
  candidates: Candidates
) => {
  return !!candidates.find(([crow, ccol]) => row === crow && col === ccol);
};

export const isForbidden = (
  row: number,
  col: number,
  dim: number,
  candidates: Candidates
) => {
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      const isCellACandidate = isCandidate(
        row + rowOffset,
        col + colOffset,
        candidates
      );
      if (isCellACandidate) return true;
    }
  }

  for (let rowOffset = 0; rowOffset < dim; rowOffset++) {
    const isCellACandidate = isCandidate(rowOffset, col, candidates);
    if (isCellACandidate) return true;
  }

  for (let colOffset = 0; colOffset < dim; colOffset++) {
    const isCellACandidate = isCandidate(row, colOffset, candidates);
    if (isCellACandidate) return true;
  }

  return false;
};

export const getAllValid = (dim: number, candidates: Candidates) => {
  const valids = new Array<number[]>();
  for (let rowOffset = 0; rowOffset < dim; rowOffset++) {
    for (let colOffset = 0; colOffset < dim; colOffset++) {
      if (!isForbidden(rowOffset, colOffset, dim, candidates)) {
        valids.push([rowOffset, colOffset]);
      }
    }
  }
  return valids;
};

// const delay = () => new Promise<void>((res) => setTimeout(res, 500));

export async function search(
  dim: number,
  onCandidatesUpdate: (candidates: number[][]) => void
) {
  const candidates = new Array<number[]>();
  let allValids = getAllValid(dim, candidates);
  // console.log(`Valids:`, allValids.map((e) => e.join("-")).join(", "));
  let validMoveExists = allValids.length > 0;
  while (validMoveExists) {
    allValids.sort(() => Math.random() - 0.5);
    const candidate = allValids[0];
    // console.log(`Choose:`, candidate.join("-"));
    candidates.push(candidate);
    onCandidatesUpdate([...candidates]);
    // await delay();
    allValids = getAllValid(dim, candidates);
    // console.log(`Valids:`, allValids.map((e) => e.join("-")).join(", "));
    validMoveExists = allValids.length > 0;
  }
}
