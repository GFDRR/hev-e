/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const UPDATE_DATA = 'DATAEXPLORATION:UPDATE_DATA';

function updateExplorationData(data) {
    return {
        type: UPDATE_DATA,
        data
    };
}

module.exports = {
    UPDATE_DATA,
    updateExplorationData
};
