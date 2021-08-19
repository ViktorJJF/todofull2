module.exports = {
  buildErrorMsg: (err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('El error: ', err);
    }
    const rawErrors = err.errors;
    const errors = [];
    try {
      for (const key in rawErrors) {
        if (rawErrors.hasOwnProperty(key)) {
          const element = rawErrors[key];
          errors.push(element.message);
        }
      }
      if (errors.length === 0) {
        errors.push('Algo salio mal...');
      }
    } catch (error) {
      console.log(error);
    }
    return errors;
  },
};
