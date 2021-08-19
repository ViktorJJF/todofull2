const axios = require('axios');

axios
  .get('https://todo--full.herokuapp.com/api/facebook-labels')
  .then((res) => {
    let duplicados = [];
    let etiquetas = res.data.payload;
    for (const etiqueta of etiquetas) {
      if (etiquetas.filter((el) => el.idLabel == etiqueta.idLabel).length > 1) {
        if (
          !etiqueta.name.includes('ad_id.') &&
          !duplicados.includes(etiqueta.name)
        )
          duplicados.push(etiqueta.name);
      }
    }
    console.log(duplicados);
  })
  .catch((err) => {
    console.error(err);
  });
