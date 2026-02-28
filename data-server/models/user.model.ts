import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    ownerKeyHash: {
      type: String,
      required: false,
    },

    usedBytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeFiles: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCount: { type: Number },
    isPassword: { type: Boolean, default: false },
    password: { type: String },
    saveName: { type: String },
    shortCode: { type: String, unique: true },
  },
  { timestamps: true }
)

const User = mongoose.model("User", UserSchema)
export default User