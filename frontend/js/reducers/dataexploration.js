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
    UPDATE_DATA_URL,
    SET_SORT_TYPE,
    SHOW_RELATED_DATA,
    UPDATE_BBOX_FILTER,
    ADD_DOWNLOAD,
    REMOVE_DOWNLOAD,
    DETAILS_LOADING,
    UPDATE_TMP_DETAILS_BBOX
} = require('../actions/dataexploration');

const url = require('url');
const{head} = require('lodash');

function dataexploration(state = {
    filter: {},
    catalogURL: '',
    downloads: []
}, action) {
    switch (action.type) {
        case SHOW_FILTER:
            return {...state, filter: {...(state.filter || {}), show: action.show}};
        case SET_FILTER:
            return {...state, filter: {...action.filter}};
        case UPDATE_DATA_URL:
            const catalogURL = url.format({
                pathname: '/test/api',
                query: {...action.params}
            });
            return {...state, catalogURL};
        case SELECT_AREA:
            return action.area || state.area ?
                {...state, area: {...(action.area || state.area)}}
                : {...state};
        case UPDATE_DETAILS:
            return {...state, showRelatedData: false, currentDetails: action.details ? {...action.details} : null};
        case SET_SORT_TYPE:
            return {...state, sortType: action.sort};
        case UPDATE_TMP_DETAILS_BBOX:
            return {...state, tmpDetailsBbox: {...action.bbox}};
        case SHOW_RELATED_DATA:
            return {...state, showRelatedData: action.show};
        case DETAILS_LOADING:
            return {...state, detailsLoading: action.loading};
        case UPDATE_BBOX_FILTER:
            return {...state, bboxFilter: action.bbox};
        case ADD_DOWNLOAD:
            const containsDownload = head((state.downloads || []).filter(download => download.id === action.download.id));
            const downloads = !containsDownload ?
            [...(state.downloads || []), {...action.download}]
            : (state.downloads || []).map(download => {
                return download.id === action.download.id ? {...action.download} : {...download};
            });
            return {...state, downloads};
        case REMOVE_DOWNLOAD:
            if (action.downloadId === 'restore') {
                return {...state, restoreDownloads: null, downloads: [...state.restoreDownloads]};
            }
            return {...state, restoreDownloads: state.downloads ? [...state.downloads] : null, downloads: !state.downloads || action.downloadId === 'all' ? [] : state.downloads.filter(download => download.downloadId !== action.downloadId)};
        default:
            return state;
    }
}

module.exports = dataexploration;
