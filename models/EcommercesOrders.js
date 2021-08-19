const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesOrders = new Schema(
  {
    idOrder: {
      type: Number,
    },
    parent_id: Number,
    status: String,
    currency: String,
    date_created: Date,
    date_modified: Date,
    discount_total: String,
    shipping_total: String,
    customer_id: Number,
    ecommercesContactId: {
      type: Schema.Types.ObjectId,
      ref: 'EcommercesContacts',
    },
    woocommerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Woocommerces',
    },
    order_key: String,
    payment_method: String,
    customer_ip_address: String,
    customer_user_agent: String,
    rut: String,
    mailchimp: {
      id: Number,
      status: String,
    },
    payment: {
      key: String,
      value: String,
    },
    line_items: [
      {
        parent_name: String,
        idEcommerce: Number,
        ecommerceId: {
          //id del producto
          type: Schema.Types.ObjectId,
          ref: 'Ecommerces',
        },
        variation_id: Number,
        quantity: Number,
        total: String,
        meta_data: [
          {
            id: Number,
            key: String,
            value: String,
            display_key: String,
            display_value: String,
          },
        ],
      },
    ],
    country: {
      type: String,
      enum: {
        values: ['Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de Ecommerce Order válido',
      },
      default: 'Peru',
    },
    url: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//auto populate
var autoPopulateLead = function (next) {
  this.populate(['ecommercesContactId', 'line_items.ecommerceId']);
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate(['ecommercesContactId', 'line_items.ecommerceId'])
    .execPopulate()
    .then(function () {
      next();
    });
};

ecommercesOrders.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
ecommercesOrders.post('save', autoPopulateLead2);

// mongoose.model('EcommercesCategories', ecommercesOrders).syncIndexes();

module.exports = mongoose.model('EcommercesOrders', ecommercesOrders);
