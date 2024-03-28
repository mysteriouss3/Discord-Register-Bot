const mongoose = require("mongoose");

const RegisterModel = mongoose.model('RegisterModel', new mongoose.Schema({
    guildID: String,
    userID: String,
    Nick: String,
    Names: Array,
    Roles: Array,
    Staff: String,
    TopReg: Number,
    Date: {type: Date, default: Date.now()},
}));

module.exports = { RegisterModel };