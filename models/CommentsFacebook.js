const mongoose = require('mongoose');

const { Schema } = mongoose;

const commentsFacebookSchema = new Schema(
  {
    postUrl: { type: String },
    responses: ['', '', ''],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ecommerces' }],
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FacebookLabels' }],
    selectedLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacebookLabels',
    },
    selectedLabelIndex: Number,
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bots' },
    selectedCategories: {
      type: Array,
      default: [],
    },
    selectedUrl: String,
    selectedUrlIndex: Number,
    type: {
      type: String,
      enum: {
        values: ['comment', 'ad', 'template'],
        message: '{VALUE} no es un tipo valido para publicaciones',
      },
      default: 'comment',
    },
    postImgUrl: String,
    ecommerceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ecommerces' },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// auto populate
let autoPopulateLead = function (next) {
  this.populate(['products', 'botId', 'labels', 'selectedLabel']);
  next();
};
let autoPopulateLead2 = function (doc, next) {
  doc
    .populate(['products', 'botId', 'labels', 'selectedLabel'])
    .execPopulate()
    .then(() => {
      next();
    });
};

commentsFacebookSchema
  .pre('findOne', autoPopulateLead)
  .pre('find', autoPopulateLead);
commentsFacebookSchema.post('save', autoPopulateLead2);

mongoose.model('CommentsFacebook', commentsFacebookSchema).syncIndexes();

module.exports = mongoose.model('CommentsFacebook', commentsFacebookSchema);
