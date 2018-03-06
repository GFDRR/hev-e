/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const SET_FILTER = 'DATAEXPLORATION:SET_FILTER';
const UPDATE_FILTER = 'DATAEXPLORATION:UPDATE_FILTER';
const SELECT_AREA = 'DATAEXPLORATION:SELECT_AREA';
const SHOW_DETAILS = 'DATAEXPLORATION:SHOW_DETAILS';
const SHOW_FILTER = 'DATAEXPLORATION:SHOW_FILTER';

function setFilter(name, filter) {
    return {
        type: SET_FILTER,
        name,
        filter
    };
}

function showFilter(show) {
    return {
        type: SHOW_FILTER,
        show
    };
}

function updateFilter(options) {
    return {
        type: UPDATE_FILTER,
        options
    };
}

function selectArea(area) {
    return {
        type: SELECT_AREA,
        area
    };
}

function showDatails(details) {
    return {
        type: SHOW_DETAILS,
        details
    };
}

module.exports = {
    UPDATE_FILTER,
    SELECT_AREA,
    SHOW_DETAILS,
    SET_FILTER,
    SHOW_FILTER,
    updateFilter,
    selectArea,
    showDatails,
    setFilter,
    showFilter
};
