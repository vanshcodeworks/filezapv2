// metadata.ts
// ----------------------------------
// File metadata protocol
// ----------------------------------

export type FileMetadata = {
  type: "meta";
  name: string;
  size: number;
};

export type TransferComplete = {
  type: "done";
};

export function encodeMeta(meta: FileMetadata): string {
  return JSON.stringify(meta);
}

export function decodeMeta(data: string): FileMetadata {
  return JSON.parse(data);
}
