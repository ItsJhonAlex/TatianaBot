/** Divide un texto en trozos ≤ maxLength (límite de Discord). */
export function chunkMessage(text: string, maxLength = 2000): string[] {
  if (text.length === 0) {
    return [''];
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}
