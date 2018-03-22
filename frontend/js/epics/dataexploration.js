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
const {filterSelector, currentSectionSelector, drawFeaturesSelector, currentDetailsSelector, bboxFilterSelector} = require('../selectors/dataexploration');
const {ADD_LAYER, addLayer, updateNode, sortNode, removeLayer} = require("../../MapStore2/web/client/actions/layers");
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

const {mapSelector} = require('../../MapStore2/web/client/selectors/map');

const createBaseVectorLayer = name => ({
    type: 'vector',
    id: name,
    name: name,
    title: name,
    visibility: true,
    hideLoading: true
});

const reprojectBbox = (bbox, state) => {
    const reprojectedBbox = CoordinatesUtils.reprojectBbox(bbox.bounds, bbox.crs, 'EPSG:4326');
    const bboxFilter = bboxFilterSelector(state);
    if (bboxFilter && reprojectedBbox && reprojectedBbox.join(',') === bboxFilter.join(',')) {
        return Rx.Observable.empty();
    }
    return Rx.Observable.of(updateBBOXFilter(reprojectedBbox));
};

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
            // console.log(chroma.scale(['#89ff32', '#ff7132']).mode('lch').colors(7));
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/filters.json').then(response => response.data))
                .switchMap(responseData => {
                    const category = [...responseData.category];
                    const data = category.map(group => {
                        if (group.colors) {
                            const colors = chroma.scale([...group.colors]).mode('lch').colors(group.filters.length);
                            return {...group, filters: group.filters.map((layer, idx) => {
                                return {...layer, color: colors[idx]};
                            }) };
                        }
                        return {...group};
                    });

                    const newTaxonomy = {...responseData.taxonomy, buildings: responseData.taxonomy.buildings.map(tax => ({...tax, styleChecked: responseData.taxonomy.buildings[0].style}))};

                    return Rx.Observable.concat(
                        Rx.Observable.of(
                            searchTextChanged(action.area.properties && (action.area.properties.name || action.area.properties.label || action.area.properties.display_name)),
                            setFilter({exposures: {categories: [...data], taxonomy: {...newTaxonomy}}}),
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
                const clearedFilter = currentUpdate.map(group => ({...group, filters: group.filters.map(layer => ({...layer, checked: false}))}));
                const newFilter = set(template, clearedFilter, updatingFilter);
                return Rx.Observable.of(
                    setFilter(newFilter)
                );
            }
            const template = `${currentSection}.categories[${action.options.categoryId}].filters[${action.options.datasetId}]`;
            const currentUpdate = get(updatingFilter, template);
            const newFilter = set(template, {...currentUpdate, checked: action.options.checked}, updatingFilter);
            return Rx.Observable.of(
                setFilter(newFilter)
            );
        }
        if (action.options.type === 'taxonomy') {

            const layers = layersSelector(store.getState());
            const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
            const tocTmpLayer = head(layers.filter(layer => (tmpLayer && layer.id === '__toc__' + tmpLayer.name)));
            const taxonomy = tmpLayer && tmpLayer.taxonomy ? {...tmpLayer.taxonomy} : {...updatingFilter.exposures.taxonomy};

            let newTaxonomy;
            let styleObj = {};

            if (action.options.style) {
                const styleName = action.options.style;
                newTaxonomy = {...taxonomy, buildings: taxonomy.buildings.map(tax => ({...tax, styleChecked: styleName}))};
                styleObj = {style: styleName};
            } else if (action.options.clear) {
                newTaxonomy = {...taxonomy, buildings: taxonomy.buildings.map(tax => ({...tax, styleChecked: '', filters: tax.filters.map(layer => ({...layer, checked: false}))}))};
                styleObj = {style: ''};
            } else {
                const template = `buildings[${action.options.categoryId}].filters[${action.options.datasetId}]`;
                const currentUpdate = get(taxonomy, template);
                newTaxonomy = set(template, {...currentUpdate, checked: action.options.checked}, taxonomy);
            }

            const updateTocLayer = tocTmpLayer && newTaxonomy ? Rx.Observable.of(updateNode(tocTmpLayer.id, 'layers', {
                taxonomy: newTaxonomy,
                ...(styleObj.style ? {tmpStyle: action.options.clear ? '' : styleObj.style} : {})
            })) : Rx.Observable.empty();

            return newTaxonomy ? Rx.Observable.concat(
                Rx.Observable.of(
                    updateNode('heve_tmp_layer', 'layers', {
                        ...styleObj,
                        taxonomy: newTaxonomy
                    })
                ),
                updateTocLayer
            ) : Rx.Observable.empty();
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

const showDetailsEpic = (action$, store) =>
    action$.ofType(SHOW_DETAILS)
    .switchMap(action => {
        const layers = layersSelector(store.getState());
        const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
        const tocTmpLayer = head(layers.filter(layer => (tmpLayer && layer.id === '__toc__' + tmpLayer.name
        || action.details && action.details.properties && action.details.properties.name && '__toc__' + action.details.properties.name === layer.id)));

        const coordinates = action.details && action.details.geometry && action.details.geometry.coordinates;
        const bbox = coordinates && [...coordinates[0][0], ...coordinates[0][2]];

        const filters = filterSelector(store.getState());
        const taxonomy = action.details && action.details.properties && action.details.properties.category && filters.exposures && filters.exposures.taxonomy[action.details.properties.category];

        const taxonomyObj = tocTmpLayer && tocTmpLayer.taxonomy ? {taxonomy: {...tocTmpLayer.taxonomy}} : {};
        const styleObj = tocTmpLayer && tocTmpLayer.tmpStyle ? {style: tocTmpLayer.tmpStyle} : taxonomy && taxonomy[0] && taxonomy[0].styleChecked && {style: taxonomy[0].styleChecked} || {};

        return action.details ? Rx.Observable.concat(
            Rx.Observable.of(
                updateNode('datasets_layer', 'layers', {visibility: false}),
                setControlProperty('dataExplorer', 'enabled', true),
                setControlProperty('compacttoc', 'hide', true),
                tmpLayer ?
                    updateNode('heve_tmp_layer', 'layers', {
                        url: action.details.properties.wms_url,
                        visibility: !tocTmpLayer,
                        name: action.details.properties.name,
                        title: action.details.properties.title,
                        description: action.details.properties.description,
                        ...taxonomyObj,
                        ...styleObj,
                        bbox: bbox ? {
                            crs: 'EPSG:4326',
                            bounds: {
                                minx: bbox[0],
                                miny: bbox[1],
                                maxx: bbox[2],
                                maxy: bbox[3]
                            }
                        } : {
                            crs: 'EPSG:4326',
                            bounds: {
                                minx: -180,
                                miny: -90,
                                maxx: 180,
                                maxy: 90
                            }
                        }
                    }) :
                    addLayer({
                        type: 'wms',
                        group: 'heve_tmp_group',
                        id: 'heve_tmp_layer',
                        url: action.details.properties.wms_url,
                        visibility: true,
                        name: action.details.properties.name,
                        title: action.details.properties.title,
                        description: action.details.properties.description,
                        ...taxonomyObj,
                        ...styleObj,
                        bbox: bbox ? {
                            crs: 'EPSG:4326',
                            bounds: {
                                minx: bbox[0],
                                miny: bbox[1],
                                maxx: bbox[2],
                                maxy: bbox[3]
                            }
                        } : {
                            crs: 'EPSG:4326',
                            bounds: {
                                minx: -180,
                                miny: -90,
                                maxx: 180,
                                maxy: 90
                            }
                        }
                    })
            ),
            Rx.Observable.of(zoomToExtent([...bbox], 'EPSG:4326')).delay(300)
        ) : Rx.Observable.concat(
            Rx.Observable.of(
                updateNode('datasets_layer', 'layers', {visibility: false}),
                setControlProperty('dataExplorer', 'enabled', true),
                setControlProperty('compacttoc', 'hide', false),
                removeLayer('heve_tmp_layer')
            ),
            Rx.Observable.of(zoomToExtent([...bboxFilterSelector(store.getState())], 'EPSG:4326')).delay(300)
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
        const state = store.getState();
        const features = drawFeaturesSelector(store.getState());
        const drawStatus = state.draw && state.draw.drawStatus || '';
        if (features.length > 0 || drawStatus === 'start') {
            return Rx.Observable.of(drawSupportReset('heve-spatial-filter'));
        }
        return Rx.Observable.of(
            changeDrawingStatus(
                'start',
                'DRAGBOX',
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
    action$.ofType(CHANGE_MAP_VIEW, CHANGE_DRAWING_STATUS, TOGGLE_SPATIAL_FILTER)
    .switchMap((action) => {

        const state = store.getState();

        if (action.status === 'clean') {
            const map = mapSelector(state);
            return reprojectBbox(map.bbox, state);
        }

        const currentDetails = currentDetailsSelector(state);
        const currentDetailsEnabled = state.controls && state.controls.currentDetails && state.controls.currentDetails.enabled;

        if (currentDetails) {
            return Rx.Observable.of(setControlProperty('currentDetails', 'enabled', true));
        }
        if (!currentDetails && currentDetailsEnabled) {
            return Rx.Observable.of(setControlProperty('currentDetails', 'enabled', false));
        }

        const drawFaetures = drawFeaturesSelector(store.getState());
        const bbox = drawFaetures && drawFaetures[0] && { bounds: drawFaetures[0].extent, crs: drawFaetures[0].projection} || action.bbox || null;
        if (!bbox) {
            return Rx.Observable.empty();
        }

        return reprojectBbox(bbox, state);
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
