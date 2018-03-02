/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Rx = require('rxjs');
const axios = require('../../MapStore2/web/client/libs/ajax');
const {MAP_CONFIG_LOADED} = require('../../MapStore2/web/client/actions/config');
const {addLayer} = require("../../MapStore2/web/client/actions/layers");
// const {updateExplorationData} = require('../actions/dataexploration');
/*
return Rx.Observable.of(addLayer({
    type: 'vector',
    visibility: true,
    id: 'annotations',
    name: "Annotations",
    rowViewer: viewer,
    hideLoading: true,
    style: annotationsStyle,
    features: externalFeatures,
    handleClickOnLayer: true
}));
*/
const initDataLayerEpic = action$ =>
    action$.ofType(MAP_CONFIG_LOADED)
        .switchMap(() => {
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/features.json').then(response => response.data))
            .switchMap(data => {
                return Rx.Observable.of(addLayer(
                    {
                        type: "vector",
                        id: "datasets_layer",
                        name: "datasets_layer",
                        title: "Datasets",
                        visibility: true,
                        hideLoading: true,
                        features: [data.features[0]],
                        style: {
                            color: '#ff489e', // 0071bc blue
                            fillColor: '#edf1f2AA',
                            weight: 2
                        }
                    }
                ));
            })
            .catch(() => {
                return Rx.Observable.empty();
            });
        });

module.exports = {
    initDataLayerEpic
};
