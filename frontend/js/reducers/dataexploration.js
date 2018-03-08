/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {SET_FILTER, UPDATE_FILTER, SELECT_AREA, SHOW_DETAILS, SHOW_FILTER} = require('../actions/dataexploration');
const set = require('lodash/fp/set');
const {get} = require('lodash');

function dataexploration(state = {
    filter: {}
}, action) {
    switch (action.type) {
        case SHOW_FILTER:
            return {...state, filter: {...(state.filter || {}), show: action.show}};
        case SET_FILTER:
            return {...state, filter: {...(state.filter || {}), [action.name]: action.filter}};
        case UPDATE_FILTER:
            const updatingFilter = {...state.filter} || {};
            const currentSection = state.currentSection || 'exposures';

            if (action.options.type === 'categories') {
                const template = action.options.filterId ?
                `${currentSection}.categories[${action.options.categoryId}].datasetLayers[${action.options.datasetId}].availableFilters[${action.options.availableFilterId}].filters[${action.options.filterId}]`
                : `${currentSection}.categories[${action.options.categoryId}].datasetLayers[${action.options.datasetId}]`;
                const currentUpdate = get(updatingFilter, template);
                const newFilter = set(template, {...currentUpdate, checked: action.options.checked}, updatingFilter);
                return {...state, filter: {...newFilter}};
            }

            return {...state};
        case SELECT_AREA:
            return action.area || state.area ?
                {...state, area: {...(action.area || state.area)}}
                : {...state};
        case SHOW_DETAILS:
            return {...state, currentDetails: action.details ? {...action.details} : null};
        default:
            return state;
    }
}

module.exports = dataexploration;
