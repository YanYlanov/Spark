const webpack = require('webpack');
const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

const entry = {
    main: path.resolve(__dirname, 'src', 'index.js'),
    styles: path.resolve(__dirname, 'styles', 'main.scss'),
};

const htmlPages = glob.sync('./src/app/pages/**/*.html').reduce((entries, file) => {
    const relativePath = path.relative('./src/app/pages', file);
    const parsed = path.parse(relativePath);
    const key = path.join(parsed.dir, parsed.name).replace(/\\/g, '/'); // for Windows support

    entries[key] = path.resolve(__dirname, file);
    return entries;
}, {});

const jsFiles = glob.sync('./src/app/pages/**/*.js');
const scssFiles = glob.sync('./src/app/pages/**/!(_)*.scss');
const stylesScssFiles = glob.sync('./styles/**/*.scss');

jsFiles.forEach(jsFile => {
    const { name } = path.parse(jsFile);
    entry[name] = path.resolve(__dirname, jsFile);
});

scssFiles.forEach(scssFile => {
    const { name, base } = path.parse(scssFile);

    if (base.startsWith('_')) return;

    if (!entry[name]) entry[name] = [];
    const currentEntry = entry[name];
    entry[name] = Array.isArray(currentEntry)
        ? [...currentEntry, path.resolve(__dirname, scssFile)]
        : [currentEntry, path.resolve(__dirname, scssFile)];
});

stylesScssFiles.forEach(file => {
    const { name, base } = path.parse(file);

    if (base.startsWith('_')) return;

    const key = `css/${name}`;
    if (!entry[key]) {
        entry[key] = path.resolve(__dirname, file);
    }
});

const htmlPlugins = Object.keys(htmlPages).map((pageKey) => {
    const pageName = path.basename(pageKey);
    const chunksToInclude = ['styles'];
    const chunksToExclude = ['main'];

    if (Object.keys(entry).includes(pageName)) {
        chunksToInclude.push(pageName);
        const index = chunksToExclude.indexOf('main');
        if (index > -1) {
            chunksToExclude.splice(index, 1);
        }
    }

    return new HtmlWebpackPlugin({
        template: htmlPages[pageKey],
        filename: `pages/${pageKey}.html`,
        chunks: chunksToInclude.filter(chunk => !chunksToExclude.includes(chunk)),
        inject: true,
        scriptLoading: 'defer',
    });
});

module.exports = (env) => {
    const isDev = env.mode === 'development';

    return {
        mode: env.mode ?? 'development',
        entry,
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: (pathData) => {
                const name = pathData.chunk.name;
                if (name === 'main') {
                    return '[name].[contenthash].js';
                }
                return `pages/${name}/${name}.[contenthash].js`;
            },
            publicPath: '/',
            clean: true,
            assetModuleFilename: 'assets/[path][name][ext]',
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'public', 'index.html'),
                filename: 'index.html',
                chunks: ['main', 'styles'],
                inject: true,
                scriptLoading: 'defer',
            }),
            ...htmlPlugins,
            new RemoveEmptyScriptsPlugin(),
            new webpack.ProgressPlugin(),
            new MiniCssExtractPlugin({
                filename: (pathData) => {
                    const name = pathData.chunk.name;

                    if (name === 'main' || name === 'styles') {
                        return 'css/main.[contenthash:8].css';
                    }

                    if (name.startsWith('css/')) {
                        const filename = name.replace('css/', '');
                        return `css/${filename}.[contenthash:8].css`;
                    }

                    return `pages/${name}/${name}.[contenthash:8].css`;
                },
                chunkFilename: 'css/[name].[contenthash:8].css',
            }),
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        plugins: [
                            ["gifsicle", { interlaced: true }],
                            ["mozjpeg", { quality: 75 }],
                            ["optipng", { optimizationLevel: 5 }],
                            [
                                "svgo",
                                {
                                    plugins: [
                                        {
                                            name: "preset-default",
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                    addAttributesToSVGElement: {
                                                        params: {
                                                            attributes: [
                                                                { xmlns: "http://www.w3.org/2000/svg" },
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: false,
                                url: true,
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: false,
                                sassOptions: {
                                    includePaths: [path.resolve(__dirname, 'src')],
                                }
                            },
                        },
                    ],
                },
                {
                    test: /\.html$/i,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                esModule: false,
                                sources: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.(png|jpe?g|gif)$/i,
                    type: 'asset/resource',
                    include: path.resolve(__dirname, 'src/app/assets/images'),
                    generator: {
                        filename: 'assets/images/[name].[hash:8][ext]'
                    }
                },
                {
                    test: /\.svg$/i,
                    type: "asset/resource",
                    include: path.resolve(__dirname, 'src/app/assets/icons'),
                    generator: {
                        filename: 'assets/icons/[name].[hash:8][ext]'
                    }
                },
                {
                    test: /\.(ttf|otf|eot|woff|woff2)$/i,
                    type: 'asset/resource',
                    include: path.resolve(__dirname, 'src/app/assets/fonts'),
                    generator: {
                        filename: 'assets/fonts/[name].[hash:8][ext]'
                    }
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
            }
        },
        devServer: isDev
            ? {
                port: env.port ?? 3000,
                open: true,
                hot: true,
                liveReload: true,
                watchFiles: {
                    paths: [
                        path.resolve(__dirname, 'src/app/**/*'),
                        path.resolve(__dirname, 'styles/**/*'),
                        path.resolve(__dirname, 'public/**/*'),
                    ],
                    options: {
                      usePolling: true,
                    },
                },
                historyApiFallback: false,
                static: [
                    {
                        directory: path.resolve(__dirname, 'public'),
                        publicPath: '/',
                        watch: true,
                    },
                    {
                        directory: path.resolve(__dirname, 'build'),
                        publicPath: '/',
                        watch: true,
                    },
                ],

            }
            : undefined,
        stats: {
            children: true,
            errorDetails: true,
        },
    }
}