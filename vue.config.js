const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // Definindo as flags de recursos do Vue
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        // Adicione outras flags conforme necessário
        // __VUE_OPTIONS_API__: JSON.stringify(true),
        // __VUE_PROD_DEVTOOLS__: JSON.stringify(false)
      }),
    ]
  }
});
