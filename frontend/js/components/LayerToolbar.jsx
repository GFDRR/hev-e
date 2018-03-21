/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {head} = require('lodash');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const {getTOCLayerObject} = require('../utils/LayerUtils');

module.exports = ({
    activeFilter = false,
    showFilter = false,
    showAddLayer = false,
    showRemoveLayer = false,
    showDownload = false,
    onToggleFilter,
    onZoomTo,
    item,
    layers = [],
    onRemoveLayer = () => {},
    onAddLayer = () => {},
    prefix = '__toc__'
}) => (
    <Toolbar
        btnDefaultProps={
            {
                className: 'square-button-md',
                bsStyle: 'primary'
            }
        }
        buttons={[
            {
                glyph: 'filter',
                tooltipId: activeFilter ? 'heve.hideFilters' : 'heve.showFilters',
                visible: showFilter && item.properties && item.properties.category === 'buildings',
                active: activeFilter,
                onClick: () => { onToggleFilter(!activeFilter); }
            },
            {
                glyph: 'zoom-to',
                tooltipId: 'heve.zoomToLayer',
                onClick: (e) => {
                    e.stopPropagation();
                    const coordinates = item.geometry && item.geometry.coordinates;
                    if (coordinates) {
                        const bbox = [...coordinates[0][0], ...coordinates[0][2]];
                        onZoomTo([...bbox], 'EPSG:4326');
                    }
                }
            },
            {
                glyph: 'trash',
                visible: showAddLayer && !!head(layers.filter(layer => layer.id === prefix + item.properties.name)),
                tooltipId: 'heve.removeLayer',
                onClick: (e) => {
                    e.stopPropagation();
                    const id = item.properties && item.properties.name;
                    if (id) {
                        onRemoveLayer(prefix + id);
                    }
                }
            },
            {
                glyph: 'plus',
                visible: showRemoveLayer && !head(layers.filter(layer => layer.id === prefix + item.properties.name)),
                tooltipId: 'heve.addLayer',
                onClick: (e) => {
                    e.stopPropagation();
                    const coordinates = item.geometry && item.geometry.coordinates;
                    const bbox = [...coordinates[0][0], ...coordinates[0][2]];
                    onAddLayer({
                        ...getTOCLayerObject(item, bbox, prefix)
                    });
                }
            },
            {
                glyph: 'download',
                tooltipId: 'heve.addDownload',
                visible: showDownload
            }
        ]
    }/>
);
