const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    mailchimp_id: {
      // clave foranea
      type: Schema.Types.ObjectId,
      ref: 'Mailchimps',
    },
    idMailchimpMember: {
      // id de conacto de mailchimp
      type: String,
      unique: true,
    },
    email_address: {
      type: String,
    },
    full_name: {
      type: String,
    },
    web_id: {
      type: Number,
    },
    email_type: {
      type: String,
    },
    status: {
      type: String,
    },
    merge_fields: {},
    interests: {},
    stats: {},
    ip_signup: {
      type: String,
    },
    timestamp_signup: {
      type: String,
    },
    ip_opt: {
      type: String,
    },
    timestamp_opt: {
      type: String,
    },
    member_rating: {
      type: Number,
    },
    last_changed: {
      type: String,
    },
    language: {
      type: String,
    },
    vip: {
      type: Boolean,
    },
    email_client: {
      type: String,
    },
    location: {},
    source: {
      type: String,
    },
    tags_count: Number,
    tags: [],
    list_id: {
      type: String,
    },
    _links: [],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// mongoose.model('Products', schema).syncIndexes();

module.exports = mongoose.model('MailchimpContacts', schema);
