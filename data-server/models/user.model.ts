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
  },
  { timestamps: true }
)

const User = mongoose.model("User", UserSchema)
export default User