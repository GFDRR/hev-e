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
const SORT_TOC_LAYERS = 'DATAEXPLORATION:SORT_TOC_LAYERS';
const TOGGLE_SPATIAL_FILTER = 'DATAEXPLORATION:TOGGLE_SPATIAL_FILTER';
const UPDATE_BBOX_FILTER = 'DATAEXPLORATION:UPDATE_BBOX_FILTER';

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

function sortTocLayers(currentPos, previousPos) {
    return {
        type: SORT_TOC_LAYERS,
        currentPos,
        previousPos
    };
}

function toggleSpatialFilter(method) {
    return {
        type: TOGGLE_SPATIAL_FILTER,
        method
    };
}

function updateBBOXFilter(bbox) {
    return {
        type: UPDATE_BBOX_FILTER,
        bbox
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
    SORT_TOC_LAYERS,
    TOGGLE_SPATIAL_FILTER,
    UPDATE_BBOX_FILTER,
    updateFilter,
    selectArea,
    showDatails,
    setFilter,
    showFilter,
    updateDataURL,
    setSortType,
    showRelatedData,
    sortTocLayers,
    toggleSpatialFilter,
    updateBBOXFilter
};
