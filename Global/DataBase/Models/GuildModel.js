const mongoose = require("mongoose");

const SetupModel = mongoose.model('SetupModel', new mongoose.Schema({
    guildID: String,
    Setup: Object
}));

module.exports = { SetupModel };