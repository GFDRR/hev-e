/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {UPDATE_DATA} = require('../actions/dataexploration');
const {set} = require('../../MapStore2/web/client/utils/ImmutableUtils');

function dataexploration(state = {}, action) {
    switch (action.type) {
    case UPDATE_DATA:
        return set("data", {...action.data}, state);
    default:
        return state;
    }
}

module.exports = dataexploration;
