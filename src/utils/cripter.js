// Replicates the backend Cripter.encript: base64 → reverse → strip padding
export function encript(str) {
  return btoa(str).split('').reverse().join('').replace(/=/g, '');
}
