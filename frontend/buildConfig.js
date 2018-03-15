const assign = require('object-assign');
const LoaderOptionsPlugin = require("webpack/lib/LoaderOptionsPlugin");
const DefinePlugin = require("webpack/lib/DefinePlugin");
const NormalModuleReplacementPlugin = require("webpack/lib/NormalModuleReplacementPlugin");
const NoEmitOnErrorsPlugin = require("webpack/lib/NoEmitOnErrorsPlugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const ParallelUglifyPlugin = require("webpack-parallel-uglify-plugin");

module.exports = (bundles, themeEntries, paths, extractThemesPlugin, prod, publicPath, cssPrefix, plugins = []) => ({
    entry: assign({
        'webpack-dev-server': 'webpack-dev-server/client?http://0.0.0.0:8081', // WebpackDevServer host and port
        'webpack': 'webpack/hot/only-dev-server' // "only" prevents reload on syntax errors
    }, bundles, themeEntries),
    output: {
        path: paths.dist,
        publicPath,
        filename: "[name].js",
        chunkFilename: prod ? "[name].[hash].chunk.js" : "[name].js"
    },
    plugins: [
        ...plugins,
        new CopyWebpackPlugin([
            { from: path.join(paths.base, 'node_modules', 'bootstrap', 'less'), to: path.join(paths.dist, "bootstrap", "less") }
        ]),
		new CopyWebpackPlugin([
            { from: path.join(paths.base, 'node_modules', 'react-nouislider', 'example'), to: path.join(paths.dist, "react-nouislider", "example") }
        ]),
        new LoaderOptionsPlugin({
            debug: !prod,
            options: {
                postcss: {
                    plugins: [
                      require('postcss-prefix-selector')({prefix: cssPrefix || '.ms2', exclude: ['.ms2', '[data-ms2-container]'].concat(cssPrefix ? [cssPrefix] : [])})
                    ]
                },
                context: paths.base
            }
        }),
        new DefinePlugin({
            "__DEVTOOLS__": !prod
        }),
        new DefinePlugin({
          'process.env': {
            'NODE_ENV': prod ? '"production"' : '""'
          }
        }),
        new NormalModuleReplacementPlugin(/leaflet$/, path.join(paths.framework, "libs", "leaflet")),
        // new NormalModuleReplacementPlugin(/openlayers$/, path.join(paths.framework, "libs", "openlayers")),
        new NormalModuleReplacementPlugin(/CompactCatalog.jsx/, path.join(__dirname, "js", "ms2override", "components", "CompactCatalog.jsx")),
        new NormalModuleReplacementPlugin(/map\/openlayers\/Map/, path.join(__dirname, "js", "ms2override", "components", "OlMap.jsx")),
        new NormalModuleReplacementPlugin(/PanelHeader.jsx/, path.join(__dirname, "js", "ms2override", "components", "PanelHeader.jsx")),
        new NormalModuleReplacementPlugin(/DockPanel.jsx/, path.join(__dirname, "js", "ms2override", "components", "DockPanel.jsx")),
        new NormalModuleReplacementPlugin(/PanelHeader.jsx/, path.join(__dirname, "js", "ms2override", "components", "PanelHeader.jsx")),
        new NormalModuleReplacementPlugin(/selectors\/layers/, path.join(__dirname, "js", "ms2override", "selectors", "layers.js")),
        new NormalModuleReplacementPlugin(/VectorStyle.js/, path.join(__dirname, "js", "ms2override", "components", "VectorStyle.js")),
        new NormalModuleReplacementPlugin(/withScrollSpy.js/, path.join(__dirname, "js", "ms2override", "components", "withScrollSpy.js")),
        new NormalModuleReplacementPlugin(/withInfiniteScroll.js/, path.join(__dirname, "js", "ms2override", "components", "withInfiniteScroll.js")),
        new NormalModuleReplacementPlugin(/SideCard.jsx/, path.join(__dirname, "js", "ms2override", "components", "SideCard.jsx")),
        new NormalModuleReplacementPlugin(/SideGrid.jsx/, path.join(__dirname, "js", "ms2override", "components", "SideGrid.jsx")),
        // new NormalModuleReplacementPlugin(/proj4$/, path.join(paths.framework, "libs", "proj4")),
        new NoEmitOnErrorsPlugin(),
        extractThemesPlugin
    ].concat(prod ? [new ParallelUglifyPlugin({
        uglifyJS: {
            sourceMap: false,
            compress: {warnings: false},
            mangle: true
        }
    })] : []),
    resolve: {
      extensions: [".js", ".jsx"]
    },
    module: {
        noParse: [/html2canvas/],
        rules: [
            {
                test: /\.css$/,
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader'
                }, {
                  loader: 'postcss-loader'
                }]
            },
            {
                test: /\.less$/,
                exclude: /themes[\\\/]?.+\.less$/,
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader'
                }, {
                    loader: 'less-loader'
                }]
            },
            {
                test: /themes[\\\/]?.+\.less$/,
                use: extractThemesPlugin.extract({
                        fallback: 'style-loader',
                        use: ['css-loader', 'postcss-loader', 'less-loader']
                    })
            },
            {
                test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        mimetype: "application/font-woff"
                    }
                }]
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: "[name].[ext]"
                    }
                }]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        name: "[path][name].[ext]",
                        limit: 8192
                    }
                }] // inline base64 URLs for <=8k images, direct URLs for the rest
            },
            {
                test: /\.jsx$/,
                exclude: /(ol\.js)$|(Cesium\.js)$/,
                use: [{
                    loader: "react-hot-loader"
                }],
                include: paths.code
            }, {
                test: /\.jsx?$/,
                exclude: /(ol\.js)$|(Cesium\.js)$/,
                use: [{
                    loader: "babel-loader"
                }],
                include: paths.code
            }
        ].concat(prod ? [{
                test: /\.html$/,
                loader: 'html-loader'
        }] : [])
    },
    devServer: {
        proxy: {
            '/proxy': {
                target: "https://dev.mapstore2.geo-solutions.it/mapstore",
                secure: false
            },
            "/static/dataexplorationtool/MapStore2": {
                target: "http://localhost:8081",
                pathRewrite: {'/static/dataexplorationtool/MapStore2': '/MapStore2'}
            },
            // mock data
            "/dataexplorationtool/data_extraction": {
                target: "http://localhost:8081",
                pathRewrite: {'/dataexplorationtool/data_extraction': '/mockdata'}
            },
            "/gfdrr_det/api": {
                target: "http://det-dev.geo-solutions.it"
            }
        }
    },

    devtool: !prod ? 'eval' : undefined
});
