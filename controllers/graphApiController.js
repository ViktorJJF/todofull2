const axios = require('axios');
const utils = require('../helpers/utils');
const Bot = require('../models/Bots');

const createLabel = async (req, res) => {
  try {
    let fanpageId = req.body.fanpageId;
    let name = req.body.name;
    //obteniendo token de acceso a fanpage
    let token = (await Bot.findOne({ fanpageId: fanpageId }).lean())
      .fbPageToken;
    console.log(token);
    let response = await axios({
      method: 'post',
      url:
        'https://graph.facebook.com/v9.0/me/custom_labels?access_token=' +
        token,
      data: {
        name,
      },
    });
    console.log('la respuesta: ', response.data);
    res.status(200).json({
      ok: true,
      payload: { label: response.data },
    });
  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};

const deleteLabel = async (req, res) => {
  try {
    let fanpageId = req.query.fanpageId;
    let labelId = req.params.labelId;
    //obteniendo token de acceso a fanpage
    let token = (await Bot.findOne({ fanpageId: fanpageId }).lean())
      .fbPageToken;
    let response = await axios({
      method: 'delete',
      url:
        'https://graph.facebook.com/v9.0/' + labelId + '?access_token=' + token,
    });
    res.status(200).json({
      ok: true,
      payload: { label: response.data },
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const getLabels = async (req, res) => {
  try {
    let botId = req.params.botId;
    let fbId = req.params.fbId;
    //obteniendo token de acceso a fanpage
    let token = (await Bot.findOne({ _id: botId }).lean()).fbPageToken;
    console.log(token);
    let response = await axios({
      method: 'get',
      url:
        'https://graph.facebook.com/v9.0/' +
        fbId +
        '/custom_labels?pretty=0&fields=name&limit=200&access_token=' +
        token,
    });
    console.log('la respuesta: ', response.data);
    res.status(200).json({
      ok: true,
      payload: { labels: response.data },
    });
  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};

const getPostPicture = async (req, res) => {
  try {
    let botId = req.params.botId;
    let postId = req.params.postId;
    //obteniendo token de acceso a fanpage
    let token = (await Bot.findOne({ _id: botId }).lean()).fbPageToken;
    console.log(token);
    let response = await axios({
      method: 'get',
      url:
        'https://graph.facebook.com/v9.0/' +
        postId +
        '/?access_token=' +
        token +
        '&fields=full_picture',
    });
    res.status(200).json({
      ok: true,
      payload: { full_picture: response.data.full_picture },
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

module.exports = {
  getLabels,
  getPostPicture,
  createLabel,
  deleteLabel,
};
