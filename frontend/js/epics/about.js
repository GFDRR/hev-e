/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


const Rx = require('rxjs');
const axios = require('../../MapStore2/web/client/libs/ajax');
const {LOCAL_CONFIG_LOADED} = require("../../MapStore2/web/client/actions/localConfig");
const ConfigUtils = require("../../MapStore2/web/client/utils/ConfigUtils");
const {addAboutContent} = require('../actions/about');

module.exports = {
    addAboutContentEpic: action$ =>
        action$.ofType(LOCAL_CONFIG_LOADED)
            .switchMap(() => {
                return Rx.Observable.fromPromise(axios.get(ConfigUtils.getConfigProp('heveAboutUrl')).then(response => response.data))
                .switchMap(data => {
                    return Rx.Observable.of(addAboutContent(data));
                })
                .catch(() => {
                    return Rx.Observable.empty();
                });
            })
};
