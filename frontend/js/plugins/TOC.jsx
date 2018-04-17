/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {updateNode, removeLayer} = require('../../MapStore2/web/client/actions/layers');
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const {head} = require('lodash');
const {showDatails, sortTocLayers} = require('../actions/dataexploration');
const {currentDetailsSelector} = require('../selectors/dataexploration');

const tocSelector = createSelector([
    state => state.controls && state.controls.compacttoc && state.controls.compacttoc.enabled,
    state => state.controls && state.controls.compacttoc && state.controls.compacttoc.hide,
    layersSelector,
    currentDetailsSelector
], (enabled, hide, layers, currentDetails) => {
    const tocLayers = layers.filter(layer => layer.group === 'toc_layers');
    return {
        enabled: enabled && head(tocLayers) && !hide,
        layers: [...tocLayers.reverse()],
        currentDetails
    };
});

const TOCPlugin = connect(
    tocSelector,
    {
        onClose: setControlProperty.bind(null, 'compacttoc', 'enabled', false),
        onUpdateNode: updateNode,
        onRemove: removeLayer,
        onShowDetails: showDatails,
        onSort: sortTocLayers
    }
)(require('../components/CompactTOC'));

module.exports = {
    TOCPlugin,
    reducers: {}
};
