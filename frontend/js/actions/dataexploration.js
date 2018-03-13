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
const UPDATE_DATA_URL = 'DATAEXPLORATION:UPDATE_DATA_URL';
const SET_SORT_TYPE = 'DATAEXPLORATION:SET_SORT_TYPE';
const SHOW_RELATED_DATA = 'DATAEXPLORATION:SHOW_RELATED_DATA';

function setFilter(filter) {
    return {
        type: SET_FILTER,
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

function updateDataURL(params) {
    return {
        type: UPDATE_DATA_URL,
        params
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

function showRelatedData(show) {
    return {
        type: SHOW_RELATED_DATA,
        show
    };
}

function setSortType(sort) {
    return {
        type: SET_SORT_TYPE,
        sort
    };
}

module.exports = {
    UPDATE_FILTER,
    SELECT_AREA,
    SHOW_DETAILS,
    SET_FILTER,
    SHOW_FILTER,
    UPDATE_DATA_URL,
    SET_SORT_TYPE,
    SHOW_RELATED_DATA,
    updateFilter,
    selectArea,
    showDatails,
    setFilter,
    showFilter,
    updateDataURL,
    setSortType,
    showRelatedData
};
