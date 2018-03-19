/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Rx = require('rxjs');
const axios = require('../../MapStore2/web/client/libs/ajax');
const {MAP_CONFIG_LOADED} = require('../../MapStore2/web/client/actions/config');
const {SORT_TOC_LAYERS, SELECT_AREA, UPDATE_FILTER, SHOW_DETAILS, TOGGLE_SPATIAL_FILTER, selectArea, setFilter, updateBBOXFilter /*, updateDataURL*/} = require('../actions/dataexploration');
const {filterSelector, currentSectionSelector, drawFeaturesSelector} = require('../selectors/dataexploration');
const {ADD_LAYER, addLayer, updateNode, sortNode} = require("../../MapStore2/web/client/actions/layers");
const {layersSelector} = require("../../MapStore2/web/client/selectors/layers");
const {SET_CONTROL_PROPERTY, setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const {TEXT_SEARCH_ITEM_SELECTED, TEXT_SEARCH_RESET, searchTextChanged} = require('../../MapStore2/web/client/actions/search');
const {getMainViewStyle, getSearchLayerStyle, getBBOXStyle} = require('../utils/StyleUtils');
const set = require('lodash/fp/set');
const {get, head} = require('lodash');
const chroma = require('chroma-js');
const {changeDrawingStatus, drawSupportReset} = require('../../MapStore2/web/client/actions/draw');
const {CHANGE_MAP_VIEW} = require('../../MapStore2/web/client/actions/map');
const CoordinatesUtils = require('../../MapStore2/web/client/utils/CoordinatesUtils');
const {CHANGE_DRAWING_STATUS} = require('../../MapStore2/web/client/actions/draw');
/*
const stringifyCategory = (section, filter) => {
    return filter[section] && Object.keys(filter[section]).reduce((params, key) => {
        if (key === 'categories') {
            const valuesArray = filter[section][key].reduce((arr, cat) => {
                return [...arr, ...cat.datasetLayers];
            }, []);
            return {...params, [key]: valuesArray.filter(cat => cat.checked).map(cat => cat.name.toLowerCase()).join(',')};
        }
        return {...params};
    }, {}) || {};
};
*/

const createBaseVectorLayer = name => ({
    type: 'vector',
    id: name,
    name: name,
    title: name,
    visibility: true,
    hideLoading: true
});

const initDataLayerEpic = action$ =>
    action$.ofType(MAP_CONFIG_LOADED)
        .switchMap(() => {
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/countries_data.json').then(response => response.data))
            .switchMap(data => {
                return Rx.Observable.of(
                    addLayer(
                        {
                            ...createBaseVectorLayer('datasets_layer'),
                            features: [...data.features],
                            style: getMainViewStyle()
                        }
                    ),
                    addLayer(
                        {
                            ...createBaseVectorLayer('search_layer'),
                            features: [],
                            style: getSearchLayerStyle()
                        }
                    ),
                    addLayer(
                        {
                            ...createBaseVectorLayer('bbox_layer'),
                            features: [],
                            style: getSearchLayerStyle()
                        }
                    )
                );
            })
            .catch(() => {
                return Rx.Observable.empty();
            });
        });

const selectAreaEpic = (action$, store) =>
    action$.ofType(SELECT_AREA)
        .switchMap((action) => {
            const filter = filterSelector(store.getState());
            if (filter.exposures) {
                return Rx.Observable.concat(
                    Rx.Observable.of(
                        searchTextChanged(action.area.properties && (action.area.properties.name || action.area.properties.label || action.area.properties.display_name)),
                        updateNode('datasets_layer', 'layers', {visibility: false}),
                        updateNode('search_layer', 'layers', {
                            visibility: true,
                            features: action.area.geometry && [{...action.area}] || []
                        }),
                        setControlProperty('dataExplorer', 'enabled', true)
                    ),
                    // delay needed for bounds fit
                    Rx.Observable.of(
                        zoomToExtent(action.area.bbox, action.area.crs)
                    ).delay(300)
                );
            }
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/filterCategories.json').then(response => response.data))
                .switchMap(responseData => {
                    const data = responseData.map(group => {
                        if (group.colors) {
                            const colors = chroma.scale([...group.colors]).mode('lch').colors(group.datasetLayers.length);
                            return {...group, datasetLayers: group.datasetLayers.map((layer, idx) => {
                                return {...layer, color: colors[idx]};
                            }) };
                        }
                        return {...group};
                    });
                    return Rx.Observable.concat(
                        Rx.Observable.of(
                            searchTextChanged(action.area.properties && (action.area.properties.name || action.area.properties.label || action.area.properties.display_name)),
                            setFilter({exposures: {categories: [...data]}}),
                            updateNode('datasets_layer', 'layers', {visibility: false}),
                            updateNode('search_layer', 'layers', {
                                visibility: true,
                                features: action.area.geometry && [{...action.area}] || []
                            }),
                            setControlProperty('dataExplorer', 'enabled', true)
                        ),
                        // delay needed for bounds fit
                        Rx.Observable.of(
                            zoomToExtent(action.area.bbox, action.area.crs)
                        ).delay(300)
                    );
                });
        });

const closeDataExplorerEpic = action$ =>
    action$.ofType(SET_CONTROL_PROPERTY)
        .filter(action => action.control === 'dataExplorer' && action.property === 'enabled' && action.value === false)
        .switchMap(() => {
            return Rx.Observable.concat(
                Rx.Observable.of(
                    updateNode('datasets_layer', 'layers', {visibility: true})
                ),
                // delay needed for bounds fit
                Rx.Observable.of(
                    zoomToExtent([
                        -7037508.34, -7037508.34,
                        7037508.34, 14037508.34
                    ], 'EPSG:3857')
                ).delay(300)
            );
        });

const itemSelectedEpic = action$ =>
    action$.ofType(TEXT_SEARCH_ITEM_SELECTED)
    .switchMap(action => {
        // nominatim item
        return Rx.Observable.of(selectArea({...action.item, crs: 'EPSG:4326'}));
    });

const resetSearchLayerEpic = action$ =>
    action$.ofType(TEXT_SEARCH_RESET)
    .switchMap(() => {
        return Rx.Observable.of(updateNode('search_layer', 'layers', {
            visibility: false,
            features: []
        }));
    });

const updateFilterEpic = (action$, store) =>
    action$.ofType(UPDATE_FILTER)
    .switchMap(action => {
        const filter = filterSelector(store.getState());
        const currentSection = currentSectionSelector(store.getState());
        const updatingFilter = {...filter} || {};
        if (action.options.type === 'categories') {
            if (action.options.clear) {
                const template = `${currentSection}.categories`;
                const currentUpdate = get(updatingFilter, template);
                const clearedFilter = currentUpdate.map(group => ({...group, datasetLayers: group.datasetLayers.map(layer => ({...layer, checked: false}))}));
                const newFilter = set(template, clearedFilter, updatingFilter);
                return Rx.Observable.of(
                    setFilter(newFilter)
                );
            }
            const template = `${currentSection}.categories[${action.options.categoryId}].datasetLayers[${action.options.datasetId}]`;
            const currentUpdate = get(updatingFilter, template);
            const newFilter = set(template, {...currentUpdate, checked: action.options.checked}, updatingFilter);
            return Rx.Observable.of(
                setFilter(newFilter)
            );
        }
        return Rx.Observable.empty();
    });

const openTOConAddLayerEpic = (action$, store) =>
    action$.ofType(ADD_LAYER)
    .filter(action => action.layer && action.layer.group === 'toc_layers')
    .switchMap(() => {
        const layers = layersSelector(store.getState());
        const tocLayers = layers.filter(layer => layer.group === 'toc_layers');
        return tocLayers.length === 1 ? Rx.Observable.of(setControlProperty('compacttoc', 'enabled', true)) : Rx.Observable.empty();
    });

const showDetailsEpic = action$ =>
    action$.ofType(SHOW_DETAILS)
    .switchMap(() => {
        return Rx.Observable.of(
            updateNode('datasets_layer', 'layers', {visibility: false}),
            setControlProperty('dataExplorer', 'enabled', true)
        );
    });

const sortTocLayersEpic = (action$, store) =>
    action$.ofType(SORT_TOC_LAYERS)
    .switchMap(action => {
        const layers = layersSelector(store.getState());
        const tocLayers = layers.filter(layer => layer.group === 'toc_layers');
        const currentPos = head(tocLayers.map( (layer, idx) => layer.id === action.currentPos.dataId ? idx : null).filter(val => val !== null));
        const previousPos = head(tocLayers.map( (layer, idx) => layer.id === action.previousPos.dataId ? idx : null).filter(val => val !== null));
        const node = 'toc_layers';
        const order = tocLayers.reduce((newOrder, layerId, idx) => {
            if (currentPos === idx) {
                return currentPos < previousPos ? [...newOrder, previousPos, idx] : [...newOrder, idx, previousPos];
            }
            if (previousPos === idx) {
                return [...newOrder];
            }
            return [...newOrder, idx];
        }, []);
        const sortLayers = (newNodes, currentLayers) => {
            const otherLayers = currentLayers.filter(layer => layer.group !== 'toc_layers');
            const tLayers = currentLayers.filter(layer => layer.group === 'toc_layers');
            return [...otherLayers, ...order.map(idx => tLayers[idx])];
        };
        return Rx.Observable.of(
            sortNode(
                node,
                order,
                sortLayers
            )
        );
    });

const spatialFilterEpic = (action$, store) =>
    action$.ofType(TOGGLE_SPATIAL_FILTER)
    .switchMap(() => {
        const features = drawFeaturesSelector(store.getState());
        if (features.length > 0) {
            return Rx.Observable.of(drawSupportReset('heve-spatial-filter'));
        }
        return Rx.Observable.of(
            changeDrawingStatus(
                'start',
                'BBOX',
                'heve-spatial-filter',
                [],
                {
                    stopAfterDrawing: true
                },
                {...getBBOXStyle()}
            )
        );
    });

const updateBBOXFilterUpdateEpic = (action$, store) =>
    action$.ofType(CHANGE_MAP_VIEW, CHANGE_DRAWING_STATUS)
    .throttleTime(500)
    .switchMap((action) => {
        const drawFaetures = drawFeaturesSelector(store.getState());
        const bbox = drawFaetures && drawFaetures[0] && { bounds: drawFaetures[0].extent, crs: drawFaetures[0].projection} || action.bbox || null;
        if (!bbox) {
            return Rx.Observable.empty();
        }
        const reprojectedBbox = CoordinatesUtils.reprojectBbox(bbox.bounds, bbox.crs, 'EPSG:4326');
        return Rx.Observable.of(updateBBOXFilter(reprojectedBbox));
    });

module.exports = {
    initDataLayerEpic,
    selectAreaEpic,
    closeDataExplorerEpic,
    itemSelectedEpic,
    resetSearchLayerEpic,
    updateFilterEpic,
    openTOConAddLayerEpic,
    showDetailsEpic,
    sortTocLayersEpic,
    spatialFilterEpic,
    updateBBOXFilterUpdateEpic
};
