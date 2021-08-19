const mongoose = require('mongoose');

const { Schema } = mongoose;

const botsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    webhookUrl: String,
    fanpageName: { type: String, unique: false },
    fanpageUrl: { type: String, unique: false },
    fanpageId: { type: String, unique: false },
    fbPageToken: { type: String, unique: false },
    fbVerifyToken: { type: String, unique: false },
    fbAppSecret: { type: String, unique: false },
    googleProjectId: String,
    dialogflowLanguageCode: String,
    googleClientEmail: String,
    googlePrivateKey: String,
    country: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

mongoose.model('Bots', botsSchema).syncIndexes();

module.exports = mongoose.model('Bots', botsSchema);
