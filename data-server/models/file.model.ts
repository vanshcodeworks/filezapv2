import mongoose from "mongoose";

export type FileStatus = "uploading" | "ready" | "deleted";

const FileSchema = new mongoose.Schema(
  {
    ownerUniqueId: { type: String, required: true, index: true },
    shortCode:     { type: String, required: true, unique: true, index: true },

    s3Key:     { type: String, required: true, unique: true },
    fileName:  { type: String, required: true },
    mimeType:  { type: String, default: "application/octet-stream" },
    sizeBytes: { type: Number, required: true, min: 1 },
    passwordEnabled: { type: Boolean, default: false },
    passwordHash: { type: String, default: null , select : false },

    status: {
      type: String,
      enum: ["uploading", "ready", "deleted"],
      default: "uploading",
      index: true,
    },

    expiresAt: { type: Date, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);


FileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const File = mongoose.model("File", FileSchema);
export default File;