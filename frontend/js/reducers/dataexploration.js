/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
    SET_FILTER,
    SELECT_AREA,
    UPDATE_DETAILS,
    SHOW_FILTER,
    SET_SORT_TYPE,
    SHOW_RELATED_DATA,
    UPDATE_BBOX_FILTER,
    ADD_DOWNLOAD,
    REMOVE_DOWNLOAD,
    DETAILS_LOADING,
    UPDATE_TMP_DETAILS_BBOX,
    UPDATE_DOWNLOAD_EMAIL,
    SELECT_DOWNLOAD_FORMAT,
    SELECT_DOWNLOAD_TAB,
    ADD_ORDER,
    OPEN_DOWNLOADS,
    CLOSE_DOWNLOADS,
    UPDATE_ORDER,
    ADD_DATASET_KEYS,
    UPDATE_CURRENT_DATASET,
    REMOVE_ORDER,
    ORDER_LOADING,
    SELECT_DOWNLOAD,
    SET_HAZARDS_FILTER
} = require('../actions/dataexploration');

const{head} = require('lodash');

function dataexploration(state = {
    filter: {},
    downloads: [],
    orders: [],
    downloadFormat: 'single',
    hazardsFilter: {}
}, action) {
    switch (action.type) {
        case SHOW_FILTER:
            return {...state, filter: {...(state.filter || {}), show: action.show}};
        case SET_FILTER:
            return {...state, filter: {...action.filter}};
        case SELECT_AREA:
            return action.area || state.area ?
                {...state, area: {...(action.area || state.area)}}
                : {...state};
        case UPDATE_DETAILS:
            const currentDetails = state.currentDetails || {};
            return {...state, showRelatedData: false, currentDetails: action.details ? {...currentDetails, ...action.details} : null};
        case SET_SORT_TYPE:
            return {...state, sortType: action.sort};
        case UPDATE_TMP_DETAILS_BBOX:
            return {...state, tmpDetailsBbox: {...action.bbox}};
        case SHOW_RELATED_DATA:
            return {...state, showRelatedData: action.show};
        case DETAILS_LOADING:
            return {...state, detailsLoading: action.loading};
        case UPDATE_BBOX_FILTER:
            return {...state, bboxFilter: action.bboxFilter, explorerBBOX: action.bbox};
        case ADD_DOWNLOAD:
            const containsDownload = head((state.downloads || []).filter(download => download.id === action.download.id));
            const downloads = !containsDownload ?
            [...(state.downloads || []), {...action.download}]
            : (state.downloads || []).map(download => {
                return download.id === action.download.id ? {...action.download} : {...download};
            });
            return {...state, downloads, selectedDownloadTab: 'download'};
        case REMOVE_DOWNLOAD:
            if (action.downloadId === 'restore') {
                return {...state, restoreDownloads: null, downloads: [...state.restoreDownloads]};
            }
            if (action.downloadId === 'clear') {
                return {...state, restoreDownloads: null, downloads: [], download: null};
            }
            const vulnerabilities = state.download && state.download.vulnerabilities && state.download.vulnerabilities.filter(dwnld => dwnld.downloadId !== action.downloadId);
            const download = vulnerabilities && {...state.download, vulnerabilities} || {...state.download};
            return {...state, download, restoreDownloads: state.downloads ? [...state.downloads] : null, downloads: !state.downloads || action.downloadId === 'all' ? [] : state.downloads.filter(dwnld => dwnld.downloadId !== action.downloadId)};
        case UPDATE_DOWNLOAD_EMAIL:
            return {...state, downloadEmail: action.email};
        case SELECT_DOWNLOAD_FORMAT:
            return {...state, downloadFormat: action.format};
        case SELECT_DOWNLOAD_TAB:
            return {...state, selectedDownloadTab: action.tab};
        case ADD_ORDER:
            return {...state, orders: [{...action.order}, ...state.orders]};
        case REMOVE_ORDER:
            return {...state, orders: state.orders.filter(order => order.id !== action.orderId)};
        case OPEN_DOWNLOADS:
            return {...state, showDownloads: true};
        case CLOSE_DOWNLOADS:
            return {...state, showDownloads: false};
        case UPDATE_ORDER:
            return {...state, orders: state.orders.map(order => order.id === action.order.id ? {...action.order, email: order.email} : {...order})};
        case ADD_DATASET_KEYS:
            return {...state, dataset: [... action.dataset]};
        case UPDATE_CURRENT_DATASET:
            return {...state, currentDataset: action.currentDataset};
        case ORDER_LOADING:
            return {...state, orderLoading: action.loading};
        case SELECT_DOWNLOAD:
            return {...state, download: action.download};
        case SET_HAZARDS_FILTER:
            return {...state, hazardsFilter: {...action.filter}};
        default:
            return state;
    }
}

module.exports = dataexploration;
