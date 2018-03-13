/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {SET_FILTER, SELECT_AREA, SHOW_DETAILS, SHOW_FILTER, UPDATE_DATA_URL, SET_SORT_TYPE, SHOW_RELATED_DATA} = require('../actions/dataexploration');
const url = require('url');

function dataexploration(state = {
    filter: {},
    catalogURL: ''
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
        case SHOW_DETAILS:
            return {...state, showRelatedData: false, currentDetails: action.details ? {...action.details} : null};
        case SET_SORT_TYPE:
            return {...state, sortType: action.sort};
        case SHOW_RELATED_DATA:
            return {...state, showRelatedData: action.show};
        default:
            return state;
    }
}

module.exports = dataexploration;
