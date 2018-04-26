/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const SET_FILTER = 'HEV-E:SET_FILTER';
const UPDATE_FILTER = 'HEV-E:UPDATE_FILTER';
const SELECT_AREA = 'HEV-E:SELECT_AREA';
const SHOW_DETAILS = 'HEV-E:SHOW_DETAILS';
const UPDATE_DETAILS = 'HEV-E:UPDATE_DETAILS';
const SHOW_FILTER = 'HEV-E:SHOW_FILTER';
const SET_SORT_TYPE = 'HEV-E:SET_SORT_TYPE';
const SHOW_RELATED_DATA = 'HEV-E:SHOW_RELATED_DATA';
const SORT_TOC_LAYERS = 'HEV-E:SORT_TOC_LAYERS';
const TOGGLE_SPATIAL_FILTER = 'HEV-E:TOGGLE_SPATIAL_FILTER';
const UPDATE_BBOX_FILTER = 'HEV-E:UPDATE_BBOX_FILTER';
const ADD_DOWNLOAD = 'HEV-E:ADD_DOWNLOAD';
const REMOVE_DOWNLOAD = 'HEV-E:REMOVE_DOWNLOAD';
const DETAILS_LOADING = 'HEV-E:DETAILS_LOADING';
const UPDATE_TMP_DETAILS_BBOX = 'HEV-E:UPDATE_TMP_DETAILS_BBOX';
const UPDATE_DOWNLOAD_EMAIL = 'HEV-E:UPDATE_DOWNLOAD_EMAIL';
const SELECT_DOWNLOAD_FORMAT = 'HEV-E:SELECT_DOWNLOAD_FORMAT';
const SELECT_DOWNLOAD_TAB = 'HEV-E:SELECT_DOWNLOAD_TAB';
const DOWNLOAD_DATA = 'HEV-E:DOWNLOAD_DATA';
const ADD_ORDER = 'HEV-E:ADD_ORDER';
const RELOAD_ORDER = 'HEV-E:RELOAD_ORDER';
const OPEN_DOWNLOADS = 'HEV-E:OPEN_DOWNLOADS';
const CLOSE_DOWNLOADS = 'HEV-E:CLOSE_DOWNLOADS';
const UPDATE_ORDER = 'HEV-E:UPDATE_ORDER';
const ADD_DATASET_KEYS = 'HEV-E:ADD_DATASET_KEYS';
const UPDATE_CURRENT_DATASET = 'HEV-E:UPDATE_CURRENT_DATASET';
const REMOVE_ORDER = 'HEV-E:REMOVE_ORDER';
const ORDER_LOADING = 'HEV-E:ORDER_LOADING';
const SELECT_DOWNLOAD = 'HEV-E:SELECT_DOWNLOAD';

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

function updateDatails(details) {
    return {
        type: UPDATE_DETAILS,
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

function updateBBOXFilter(bboxFilter, bbox) {
    return {
        type: UPDATE_BBOX_FILTER,
        bboxFilter,
        bbox
    };
}

function addDownload(download) {
    return {
        type: ADD_DOWNLOAD,
        download
    };
}

function removeDownload(downloadId) {
    return {
        type: REMOVE_DOWNLOAD,
        downloadId
    };
}

function detailsLoading(loading) {
    return {
        type: DETAILS_LOADING,
        loading
    };
}

function updateTmpDetailsBbox(bbox) {
    return {
        type: UPDATE_TMP_DETAILS_BBOX,
        bbox
    };
}

function updateDownloadEmail(email) {
    return {
        type: UPDATE_DOWNLOAD_EMAIL,
        email
    };
}

function selectDownloadFormat(format) {
    return {
        type: SELECT_DOWNLOAD_FORMAT,
        format
    };
}

function selectDownloadTab(tab) {
    return {
        type: SELECT_DOWNLOAD_TAB,
        tab
    };
}

function downloadData(data) {
    return {
        type: DOWNLOAD_DATA,
        data
    };
}

function addOrder(order) {
    return {
        type: ADD_ORDER,
        order
    };
}

function removeOrder(orderId) {
    return {
        type: REMOVE_ORDER,
        orderId
    };
}

function updateOrder(order) {
    return {
        type: UPDATE_ORDER,
        order
    };
}

function openDownloads() {
    return {
        type: OPEN_DOWNLOADS
    };
}

function closeDownloads() {
    return {
        type: CLOSE_DOWNLOADS
    };
}

function addDatasetKeys(dataset) {
    return {
        type: ADD_DATASET_KEYS,
        dataset
    };
}

function updateCurrentDataset(currentDataset) {
    return {
        type: UPDATE_CURRENT_DATASET,
        currentDataset
    };
}

function orderLoading(loading) {
    return {
        type: ORDER_LOADING,
        loading
    };
}

function reloadOrder(order) {
    return {
        type: RELOAD_ORDER,
        order
    };
}

function selectDownload(download) {
    return {
        type: SELECT_DOWNLOAD,
        download
    };
}

module.exports = {
    UPDATE_FILTER,
    SELECT_AREA,
    SHOW_DETAILS,
    UPDATE_DETAILS,
    SET_FILTER,
    SHOW_FILTER,
    SET_SORT_TYPE,
    SHOW_RELATED_DATA,
    SORT_TOC_LAYERS,
    TOGGLE_SPATIAL_FILTER,
    UPDATE_BBOX_FILTER,
    UPDATE_TMP_DETAILS_BBOX,
    UPDATE_DOWNLOAD_EMAIL,
    ADD_DOWNLOAD,
    REMOVE_DOWNLOAD,
    DETAILS_LOADING,
    SELECT_DOWNLOAD_FORMAT,
    SELECT_DOWNLOAD_TAB,
    DOWNLOAD_DATA,
    ADD_ORDER,
    OPEN_DOWNLOADS,
    CLOSE_DOWNLOADS,
    UPDATE_ORDER,
    ADD_DATASET_KEYS,
    UPDATE_CURRENT_DATASET,
    REMOVE_ORDER,
    ORDER_LOADING,
    RELOAD_ORDER,
    SELECT_DOWNLOAD,
    updateFilter,
    selectArea,
    showDatails,
    updateDatails,
    setFilter,
    showFilter,
    setSortType,
    showRelatedData,
    sortTocLayers,
    toggleSpatialFilter,
    updateBBOXFilter,
    addDownload,
    removeDownload,
    detailsLoading,
    updateTmpDetailsBbox,
    updateDownloadEmail,
    selectDownloadFormat,
    selectDownloadTab,
    downloadData,
    addOrder,
    openDownloads,
    closeDownloads,
    updateOrder,
    addDatasetKeys,
    updateCurrentDataset,
    removeOrder,
    orderLoading,
    reloadOrder,
    selectDownload
};
