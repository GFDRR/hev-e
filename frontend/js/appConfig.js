/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    pages: [{
        name: "dataexplorationtool",
        path: "/",
        component: require('./pages/DataExplorationTool')
    }, {
        name: "dataexplorationtool",
        path: "/about",
        component: require('./pages/DataExplorationTool')
    }],
    initialState: {
        defaultState: {
            mousePosition: {enabled: false},
            controls: {
                help: {
                    enabled: false
                },
                details: {
                    enabled: false
                },
                print: {
                    enabled: false
                },
                toolbar: {
                    active: null,
                    expanded: false
                },
                drawer: {
                    enabled: false,
                    menu: "1"
                },
                RefreshLayers: {
                    enabled: false,
                    options: {
                        bbox: true,
                        search: true,
                        title: false,
                        dimensions: false
                    }
                },
                cookie: {
                    enabled: false,
                    seeMore: false
                }
            }
        },
        mobile: {
            mapInfo: {enabled: true, infoFormat: 'application/json' },
            mousePosition: {enabled: true, crs: "EPSG:4326", showCenter: true}
        }
    },
    appEpics: {},
    storeOpts: {
        persist: {
            whitelist: ['security']
        }
    }
};
