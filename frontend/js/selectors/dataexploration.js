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
    filterSelector: state => state.dataexploration && state.dataexploration.filter || {},
    currentDatasetSelector: state => state.dataexploration && state.dataexploration.currentDataset || 'exposures',
    sortSelector: state => state.dataexploration && state.dataexploration.sortType || 'name',
    showRelatedDataSelector: state => state.dataexploration && state.dataexploration.showRelatedData,
    drawFeaturesSelector: state => state.draw && state.draw.features || null,
    bboxFilterStringSelector: state => state.dataexploration && state.dataexploration.bboxFilter && state.dataexploration.bboxFilter.join(',') || null,
    bboxFilterSelector: state => state.dataexploration && state.dataexploration.bboxFilter || [],
    tmpDetailsBboxSelector: state => state.dataexploration && state.dataexploration.tmpDetailsBbox,
    downloadEmailSelector: state => state.dataexploration && state.dataexploration.downloadEmail || '',
    downloadFormatSelector: state => state.dataexploration && state.dataexploration.downloadFormat || 'single',
    selectedDownloadTabSelector: state => state.dataexploration && state.dataexploration.selectedDownloadTab || 'download',
    ordersSelector: state => state.dataexploration && state.dataexploration.orders,
    showDownloadsSelector: state => state.dataexploration && state.dataexploration.showDownloads,
    datasetSelector: state => state.dataexploration && state.dataexploration.dataset || [],
    orderLoadingSelector: state => state.dataexploration && state.dataexploration.orderLoading,
    downloadSelector: state => state.dataexploration && state.dataexploration.download || null,
    explorerBBOXSelector: state => state.dataexploration && state.dataexploration.explorerBBOX,
    downloadsSelector: state => state.dataexploration && state.dataexploration.downloads,
    hazardsFilterSelector: state => state.dataexploration && state.dataexploration.hazardsFilter
};
