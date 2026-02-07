export function generatePeerId(): string {
  return crypto.randomUUID();
}

export function generateRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
