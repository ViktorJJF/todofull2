module.exports = {
  BASE_URL_CHATBOT:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://todo-full.digital',
  BASE_URL_DASHBOARD:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : process.env.NODE_ENV === 'qa'
      ? 'https://staging-todofull.herokuapp.com'
      : 'https://todo--full.herokuapp.com',
};
