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

const {
    CLOSE_DOWNLOADS,
    OPEN_DOWNLOADS,
    DOWNLOAD_DATA,
    SORT_TOC_LAYERS,
    SELECT_AREA,
    UPDATE_FILTER,
    SHOW_DETAILS,
    TOGGLE_SPATIAL_FILTER,
    RELOAD_ORDER,
    updateOrder,
    addOrder,
    selectArea,
    setFilter,
    updateBBOXFilter,
    updateDatails,
    updateTmpDetailsBbox,
    detailsLoading,
    addDatasetKeys,
    updateCurrentDataset,
    removeDownload,
    selectDownloadTab,
    orderLoading
} = require('../actions/dataexploration');

const {downloadFormatSelector, filterSelector, currentDatasetSelector, drawFeaturesSelector, currentDetailsSelector, bboxFilterSelector, tmpDetailsBboxSelector, downloadEmailSelector, ordersSelector} = require('../selectors/dataexploration');
const {ADD_LAYER, addLayer, updateNode, sortNode, removeLayer} = require("../../MapStore2/web/client/actions/layers");
const {layersSelector} = require("../../MapStore2/web/client/selectors/layers");
const {SET_CONTROL_PROPERTY, setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const {TEXT_SEARCH_ITEM_SELECTED, TEXT_SEARCH_RESET, searchTextChanged} = require('../../MapStore2/web/client/actions/search');
const {getMainViewStyle, getSearchLayerStyle, getBBOXStyle} = require('../utils/StyleUtils');
const set = require('lodash/fp/set');
const {get, head, isEmpty, join} = require('lodash');
const chroma = require('chroma-js');
const {changeDrawingStatus, drawSupportReset} = require('../../MapStore2/web/client/actions/draw');
const {CHANGE_MAP_VIEW} = require('../../MapStore2/web/client/actions/map');
const CoordinatesUtils = require('../../MapStore2/web/client/utils/CoordinatesUtils');
const {CHANGE_DRAWING_STATUS} = require('../../MapStore2/web/client/actions/draw');
const FilterUtils = require('../../MapStore2/web/client/utils/FilterUtils');
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
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/filters.json').then(response => response.data))
                .switchMap(responseData => {

                    const datasetKeys = responseData.dataset;

                    const list = datasetKeys.reduce((newList, key) => {
                        return {
                            ...newList,
                            [key]: responseData.list[key].category && {
                                category: responseData.list[key].category.map(group => {
                                    if (group.colors_range) {
                                        const colors = chroma.scale([...group.colors_range]).mode('lch').colors(group.filters.length);
                                        return {...group, filters: group.filters.map((layer, idx) => {
                                            return {...layer, color: colors[idx]};
                                        }) };
                                    }
                                    return {...group};
                                }),
                                ...(responseData.list[key].format ? {format: {...responseData.list[key].format}} : {})
                            } || {}
                        };
                    }, {});

                    const detail = datasetKeys.reduce((newDetail, key) => {
                        return {
                            ...newDetail,
                            [key]: {
                                taxonomy: Object.keys(responseData.detail[key]).reduce((nowTaxonomy, type) => {
                                    return {
                                        ...nowTaxonomy,
                                        [type]: responseData.detail[key][type].map(taxonomy => ({...taxonomy, styleChecked: responseData.detail[key][type][0] && responseData.detail[key][type][0].style || ''}))
                                    };
                                }, {})
                            }
                        };
                    }, {});

                    const filters = datasetKeys.reduce((newFilters, key) => {
                        const newList = {...list[key]};
                        const newDetail = {...detail[key]};
                        return {
                            ...newFilters,
                            [key]: {
                                ...newList,
                                ...newDetail
                            }
                        };
                    }, {});

                    return Rx.Observable.concat(
                        Rx.Observable.of(
                            searchTextChanged(action.area.properties && (action.area.properties.name || action.area.properties.label || action.area.properties.display_name)),
                            setFilter({...filters, show: true}),
                            updateNode('datasets_layer', 'layers', {visibility: false}),
                            updateNode('search_layer', 'layers', {
                                visibility: true,
                                features: action.area.geometry && [{...action.area}] || []
                            }),
                            setControlProperty('dataExplorer', 'enabled', true),
                            addDatasetKeys([...datasetKeys]),
                            updateCurrentDataset(datasetKeys[1])
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
        const currentDataset = currentDatasetSelector(store.getState());
        const updatingFilter = {...filter} || {};
        if (action.options.type === 'category') {
            if (action.options.clear) {
                const template = `${currentDataset}.category`;
                const currentUpdate = get(updatingFilter, template);
                const clearedFilter = currentUpdate.map(group => ({...group, filters: group.filters.map(layer => ({...layer, checked: false}))}));
                const newFilter = set(template, clearedFilter, updatingFilter);
                return Rx.Observable.of(
                    setFilter(newFilter)
                );
            }
            const template = `${currentDataset}.category[${action.options.categoryId}].filters[${action.options.datasetId}]`;
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
                newTaxonomy = {...taxonomy, buildings: taxonomy.buildings.map(tax => ({...tax, filters: tax.filters.map(layer => ({...layer, checked: false}))}))};
            } else {
                const template = `buildings[${action.options.categoryId}].filters[${action.options.datasetId}]`;
                const currentUpdate = get(taxonomy, template);
                newTaxonomy = set(template, {...currentUpdate, checked: action.options.checked}, taxonomy);
            }

            const updateTocLayer = tocTmpLayer && newTaxonomy ? Rx.Observable.of(updateNode(tocTmpLayer.id, 'layers', {
                taxonomy: newTaxonomy,
                ...(styleObj.style ? {tmpStyle: action.options.clear ? '' : styleObj.style} : {})
            })) : Rx.Observable.empty();

            // update type buildings based on selection
            const filterFields = newTaxonomy.buildings.reduce((plainGroup, group) => {
                return [...plainGroup, ...group.filters.filter(filt => filt.checked).map(filt => ({
                    groupId: 1,
                    attribute: 'parsed_taxonomy',
                    operator: 'LIKE',
                    type: 'string',
                    value: group.code + ':' + filt.code
                }))];
            }, []);

            const filterObj = {
                filterFields,
                groupFields: [
                    {
                        id: 1,
                        index: 0,
                        logic: 'OR'
                    }
                ]
            };

            const CQL_FILTER = FilterUtils.isFilterValid(filterObj) && FilterUtils.toCQLFilter(filterObj);
            const cqlFilterObj = CQL_FILTER ? {CQL_FILTER} : {};

            return newTaxonomy ? Rx.Observable.concat(
                Rx.Observable.of(
                    updateNode('heve_tmp_layer', 'layers', {
                        ...styleObj,
                        taxonomy: newTaxonomy,
                        params: {
                            ...cqlFilterObj
                        }
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


const defaultDetailsLayerParams = ({
    details,
    taxonomyObj,
    styleObj,
    bbox = [-180, -90, 180, 90]
}) => ({
    url: details.properties.wms_url,
    name: details.properties.name,
    title: details.properties.title,
    description: details.properties.description,
    ...taxonomyObj,
    ...styleObj,
    bbox: {
        crs: 'EPSG:4326',
        bounds: {
            minx: bbox[0],
            miny: bbox[1],
            maxx: bbox[2],
            maxy: bbox[3]
        }
    }
});

const closeDetailsStream = (state, details) => {

    const layers = layersSelector(state);
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
    const tocTmpLayer = head(layers.filter(layer => (tmpLayer && layer.id === '__toc__' + tmpLayer.name
    || details && details.properties && details.properties.name && '__toc__' + details.properties.name === layer.id)));

    return Rx.Observable.concat(
        // restore last visibility of toc layer
        tocTmpLayer ? Rx.Observable.of(updateNode(tocTmpLayer.id, 'layers', {
            visibility: tocTmpLayer.lastVisibility,
            lastVisibility: undefined
        })) : Rx.Observable.empty(),

        Rx.Observable.of(
            updateNode('datasets_layer', 'layers', {visibility: false}),
            setControlProperty('dataExplorer', 'enabled', true),
            setControlProperty('compacttoc', 'hide', false),
            removeLayer('heve_tmp_layer'),
            updateDatails(),
            detailsLoading(false)
        ),
        Rx.Observable.of(zoomToExtent([...bboxFilterSelector(state)], 'EPSG:4326')).delay(300)
    );
};


const updateDetailsStream = (state, item, actionBbox) =>
    Rx.Observable.concat(
        Rx.Observable.of(updateDatails(item), detailsLoading(true)),
        Rx.Observable.fromPromise(axios.get(`/gfdrr_det/api/v1/exposures/${item.id}/?format=json${actionBbox ? '&bbox=' + actionBbox : ''}`).then(response => response.data))
        .switchMap(details => {
            const layers = layersSelector(state);
            const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
            const tocTmpLayer = head(layers.filter(layer => (tmpLayer && layer.id === '__toc__' + tmpLayer.name
            || details && details.properties && details.properties.name && '__toc__' + details.properties.name === layer.id)));

            const coordinates = details && details.geometry && details.geometry.coordinates;
            const bbox = coordinates && [...coordinates[0][0], ...coordinates[0][2]];

            const filters = filterSelector(state);
            const taxonomy = details && details.properties && details.properties.category && filters.exposures && filters.exposures.taxonomy[details.properties.category];

            const taxonomyObj = tocTmpLayer && tocTmpLayer.taxonomy ? {taxonomy: {...tocTmpLayer.taxonomy}} : {};
            const styleObj = tmpLayer && tmpLayer.style && {style: tmpLayer.style} || tocTmpLayer && tocTmpLayer.tmpStyle && {style: tocTmpLayer.tmpStyle} || taxonomy && taxonomy[0] && taxonomy[0].styleChecked && {style: taxonomy[0].styleChecked} || {};

            return Rx.Observable.concat(
                // hide toc layer
                tocTmpLayer && tocTmpLayer.lastVisibility === undefined ? Rx.Observable.of(updateNode(tocTmpLayer.id, 'layers', {
                    lastVisibility: tocTmpLayer.visibility,
                    visibility: false
                })) : Rx.Observable.empty(),

                Rx.Observable.of(
                    updateNode('datasets_layer', 'layers', {visibility: false}),
                    setControlProperty('dataExplorer', 'enabled', true),
                    setControlProperty('compacttoc', 'hide', true),
                    updateDatails(details),
                    detailsLoading(false),
                    tmpLayer ?
                        updateNode('heve_tmp_layer', 'layers', {
                            visibility: true,
                            ...defaultDetailsLayerParams({
                                details,
                                taxonomyObj,
                                styleObj,
                                bbox
                            })
                        })
                        :
                        addLayer({
                            type: 'wms',
                            group: 'heve_tmp_group',
                            id: 'heve_tmp_layer',
                            visibility: true,
                            ...defaultDetailsLayerParams({
                                details,
                                taxonomyObj,
                                styleObj,
                                bbox
                            })
                        })
                ),
                actionBbox ? Rx.Observable.empty() : Rx.Observable.of(zoomToExtent([...bbox], 'EPSG:4326')).delay(300)
            );
        })
        .catch(() => closeDetailsStream(state))
    );

const showDetailsEpic = (action$, store) =>
    action$.ofType(SHOW_DETAILS)
    .switchMap(action => {
        const state = store.getState();
        return action.details ? updateDetailsStream(state, action.details) : closeDetailsStream(state);
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
        const tmpDetailsBbox = tmpDetailsBboxSelector(state);

        if (currentDetails) {

            const drawFaetures = drawFeaturesSelector(store.getState());
            const faeturesBbox = drawFaetures && drawFaetures[0] && {
                type: 'filter',
                bounds: {
                    minx: drawFaetures[0].extent[0],
                    miny: drawFaetures[0].extent[1],
                    maxx: drawFaetures[0].extent[2],
                    maxy: drawFaetures[0].extent[3]
                },
                crs: drawFaetures[0].projection
            } || {...action.bbox, type: 'view'} || null;

            const bbox = faeturesBbox && faeturesBbox.bounds && CoordinatesUtils.reprojectBbox(faeturesBbox.bounds, faeturesBbox.crs, 'EPSG:4326');
            const tmpDetailsBboxStr = tmpDetailsBbox && tmpDetailsBbox.extent && tmpDetailsBbox.extent.join(',') || '';

            return bbox && tmpDetailsBboxStr !== bbox.join(',') ? Rx.Observable.concat(
                !isEmpty(tmpDetailsBbox) ? updateDetailsStream(state, currentDetails, bbox.join(',')) : Rx.Observable.empty(),
                Rx.Observable.of(updateTmpDetailsBbox({extent: bbox, ...faeturesBbox}))
            ) : Rx.Observable.of(updateTmpDetailsBbox(tmpDetailsBbox));

        }
        if (!currentDetails && tmpDetailsBbox && !isEmpty(tmpDetailsBbox)) {
            return Rx.Observable.of(updateTmpDetailsBbox(null));
        }

        const drawFaetures = drawFeaturesSelector(store.getState());
        const bbox = drawFaetures && drawFaetures[0] && { bounds: drawFaetures[0].extent, crs: drawFaetures[0].projection} || action.bbox || null;
        if (!bbox) {
            return Rx.Observable.empty();
        }

        return reprojectBbox(bbox, state);
    });

/*
- Submitted
- Accepted
- InProduction
- Suspended
- Cancelled
- Completed
- Failed
- Terminated
- Downloaded
*/

const updateOrdersEpic = (action$, store) =>
    action$.ofType(OPEN_DOWNLOADS)
    .switchMap(() =>
        Rx.Observable.timer(0, 1000)
        .switchMap(() => {
            const orders = ordersSelector(store.getState()).filter(order => !(order.status === 'Completed' || order.status === 'Failed'));
            return orders.length === 0 ? Rx.Observable.empty()
            : Rx.Observable.from(orders)
            .switchMap(order => {
                return Rx.Observable.fromPromise(axios.get(order.id).then(response => response.data))
                .switchMap(updatedOrder => {
                    return Rx.Observable.of(updateOrder({...updatedOrder}));
                })
                .catch(() => {
                    return Rx.Observable.empty();
                });
            });
        })
        .takeUntil(action$.ofType(CLOSE_DOWNLOADS))
    );

const reloadOrderEpic = action$ =>
    action$.ofType(RELOAD_ORDER)
    .switchMap(() => {
        return Rx.Observable.empty();
    });

const getBBOXFromDownload = download => {
    const bbox = download.bbox && download.bbox.type === 'filter' && download.bbox.extent && join(download.bbox.extent, ',');
    return bbox ? {bbox} : {};
};

const getTaxonomicCategoriesFromDownload = download => {
    const taxonomicCategories = download.taxonomy && download.taxonomy.reduce((txnm, group) => {
        const checked = group.filters.filter(filt => filt.checked).map(filt => group.code + ':' + filt.code);
        return [...txnm, ...checked];
    }, []);
    return taxonomicCategories && taxonomicCategories.length > 0 ? {taxonomic_categories: join(taxonomicCategories, ',')} : {};
};

/* convert dataset name for request */
const datasetName = {
    exposures: 'exposure'
};

const downloadDataEpic = (action$, store) =>
    action$.ofType(DOWNLOAD_DATA)
    .switchMap(action => {
        const state = store.getState();
        const notificationEmail = downloadEmailSelector(state);
        const downloadFormat = downloadFormatSelector(state);

        const orderItems = action.data.map((download) => {
            const taxonomicCategoriesObj = getTaxonomicCategoriesFromDownload(download);
            const bboxObj = getBBOXFromDownload(download);
            return {
                layer: datasetName[download.dataset] + ':' + download.properties.name,
                format: download.availableFormats[downloadFormat][download.formatId].code,
                ...bboxObj,
                ...taxonomicCategoriesObj
            };
        });

        return Rx.Observable.concat(
            Rx.Observable.of(orderLoading(true)),
            Rx.Observable.fromPromise(
                axios.post('/gfdrr_det/api/v1/order/', {
                    notification_email: notificationEmail,
                    order_items: [...orderItems]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': null
                    }
                }).then(response => response.data)
            )
            .switchMap(order => {
                return Rx.Observable.of(
                    addOrder({...order, email: notificationEmail}),
                    removeDownload('clear'),
                    selectDownloadTab('order'),
                    orderLoading(false)
                );
            })
            .catch(() => {
                return Rx.Observable.of(orderLoading(false));
            })
        );
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
    updateBBOXFilterUpdateEpic,
    downloadDataEpic,
    updateOrdersEpic,
    reloadOrderEpic
};
