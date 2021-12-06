module.exports = {
    chainWebpack: config => {
        config
          .plugin('html')
          .tap(args => {
            args[0].title= process.env.VUE_APP_NAME
            return args
          })
    },
    pluginOptions: {
        electronBuilder: {
            preload: './src/preload.js',
            builderOptions: {
              appId: process.env.VUE_APP_ID,
              productName: process.env.VUE_APP_NAME,
              mac: {
                icon: './public/logo.icns'
              },
              win: {
                icon: './public/logo.ico',
                target: [
                  {
                    target: 'nsis'
                  }
                ]
              }
            }
        }
    }
}