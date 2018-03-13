/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {isObject, isEmpty} = require('lodash');

module.exports = {
    selectedAreaSelector: state => state.dataexploration && isObject(state.dataexploration.area) && !isEmpty(state.dataexploration.area) && state.dataexploration.area || null,
    currentDetailsSelector: state => state.dataexploration && isObject(state.dataexploration.currentDetails) && !isEmpty(state.dataexploration.currentDetails) && state.dataexploration.currentDetails || null,
    catalogURLSelector: state => state.dataexploration && state.dataexploration.catalogURL,
    filterSelector: state => state.dataexploration && state.dataexploration.filter || {},
    currentSectionSelector: state => state.dataexploration && state.dataexploration.currentSection || 'exposures',
    sortSelector: state => state.dataexploration && state.dataexploration.sortType || 'alphabeticalAToZ',
    showRelatedDataSelector: state => state.dataexploration && state.dataexploration.showRelatedData
};
