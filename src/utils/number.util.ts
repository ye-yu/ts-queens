export function randomN(min = 5, max = 9) {
  return min + Math.floor(Math.random() * (max - min));
}
