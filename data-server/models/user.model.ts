import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    uniqueId:{
        type : String,
        required  : true,
        unique : true
    },
    isPassword:{
        type : Boolean,
        default: false
    },

}, {
    timestamps : true
})

const User = mongoose.model("User" , UserSchema );
export default User;