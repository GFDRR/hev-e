/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {head, isEqual} = require('lodash');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const {getTOCLayerObject} = require('../utils/LayerUtils');
const uuid = require('uuid');

const extractParams = (obj, params = ['id', 'taxonomy', 'bbox']) => {
    return params.reduce((newObj, param) => {
        return {...newObj, [param]: obj[param]};
    }, {});
};

const isDownloadEqual = (downloads, item) => {
    return head(downloads.filter(download =>
        isEqual(extractParams(download), extractParams(item))
    ));
};

const getTaxonomyFromLayers = (layers, item) => head(layers.filter(layer => layer && layer.record && layer.record.id === item.id).map(layer => layer && layer.taxonomy));

module.exports = ({
    activeFilter = false,
    showFilter = false,
    showZoomTo = false,
    showAddLayer = false,
    showRemoveLayer = false,
    showDownload = false,
    onToggleFilter,
    onZoomTo = () => {},
    item,
    layers = [],
    onRemoveLayer = () => {},
    onAddLayer = () => {},
    prefix = '__toc__',
    onAddDownload = () => {},
    downloads = [],
    mapBbox,
    dataset,
    availableFormats,
    taxonomy,
    filterBBOX,
    hideOnAdd
}) => {
    const layerTaxonomy = getTaxonomyFromLayers(layers, item);
    const taxonomyObj = layerTaxonomy && layerTaxonomy[item.type] && {taxonomy: layerTaxonomy[item.type]} || taxonomy && taxonomy[item.type] && {taxonomy: taxonomy[item.type]} || {};
    const bboxObj = dataset !== 'vulnerabilities' && filterBBOX && filterBBOX.extent && {bbox: filterBBOX} || {};
    const checkDownload = isDownloadEqual(downloads, {...item, mapBbox, availableFormats, dataset, ...taxonomyObj, ...bboxObj});
    return (
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
                    visible: showZoomTo,
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
                        if (coordinates) {
                            const bbox = [...coordinates[0][0], ...coordinates[0][2]];
                            onAddLayer({
                                ...getTOCLayerObject({...item, dataset}, bbox, prefix, !hideOnAdd)
                            });
                        }
                    }
                },
                {
                    glyph: 'download',
                    tooltipId: head(downloads.filter(({id}) => item.id === id)) ? 'heve.updateDownload' : 'heve.addDownload',
                    visible: showDownload,
                    style: checkDownload ? {pointerEvents: 'none'} : {},
                    bsStyle: head(downloads.filter(({id}) => item.id === id)) ? checkDownload ? 'success' : 'warning' : 'primary',
                    onClick: (e) => {
                        e.stopPropagation();
                        const downloadId = uuid.v1();
                        onAddDownload({
                            ...item,
                            formatId: 0,
                            dataset,
                            downloadId,
                            availableFormats,
                            ...bboxObj,
                            ...taxonomyObj
                        });
                    }
                }
            ]
        }/>
    );
};
