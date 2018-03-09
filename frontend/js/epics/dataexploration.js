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
const {SELECT_AREA, UPDATE_FILTER, selectArea, setFilter, updateDataURL} = require('../actions/dataexploration');
const {filterSelector, currentSectionSelector} = require('../selectors/dataexploration');
const {addLayer, updateNode} = require("../../MapStore2/web/client/actions/layers");
const {SET_CONTROL_PROPERTY, setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const {TEXT_SEARCH_ITEM_SELECTED, TEXT_SEARCH_RESET, searchTextChanged} = require('../../MapStore2/web/client/actions/search');
const {getMainViewStyle, getSearchLayerStyle} = require('../utils/StyleUtils');
const set = require('lodash/fp/set');
const {get} = require('lodash');
/*
const initDataLayerEpic = action$ =>
    action$.ofType(MAP_CONFIG_LOADED)
        .switchMap(() => {
            return Rx.Observable.fromPromise(axios.get('/gfdrr_det/api/v1/relevantcountry/?format=json').then(response => response.data))
            .switchMap(data => {
                const features = data && data.results && data.results.features && [...data.results.features] || [];
                return Rx.Observable.of(
                    addLayer(
                        {
                            type: "vector",
                            id: "datasets_layer",
                            name: "datasets_layer",
                            title: "Datasets",
                            visibility: true,
                            hideLoading: true,
                            features,
                            style: {
                                color: '#db0033',
                                fillColor: 'rgba(240, 240, 240, 0.5)',
                                weight: 2
                            }
                        }
                    )
                );
            })
            .catch(() => {
                return Rx.Observable.empty();
            });
        });
*/

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
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/features.json').then(response => response.data))
            .switchMap(data => {
                return Rx.Observable.of(
                    addLayer(
                        {
                            ...createBaseVectorLayer('datasets_layer'),
                            features: [data.features[0]],
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

const selectAreaEpic = action$ =>
    action$.ofType(SELECT_AREA)
        .switchMap((action) => {
            return Rx.Observable.fromPromise(axios.get('/static/dataexplorationtool/mockdata/filterCategories.json').then(response => response.data))
                .switchMap(data => {
                    return Rx.Observable.of(
                        updateDataURL({}),
                        searchTextChanged(action.area.properties && (action.area.properties.name || action.area.properties.label || action.area.properties.display_name)),
                        setFilter({exposures: {categories: [...data]}}),
                        updateNode('datasets_layer', 'layers', {visibility: false}),
                        updateNode('search_layer', 'layers', {
                            visibility: true,
                            features: action.area.geometry && [{...action.area}] || []
                        }),
                        setControlProperty('dataExplorer', 'enabled', true),
                        zoomToExtent(action.area.bbox, action.area.crs)
                    );
                });
        });

const closeDataExplorerEpic = action$ =>
    action$.ofType(SET_CONTROL_PROPERTY)
        .filter(action => action.control === 'dataExplorer' && action.property === 'enabled' && action.value === false)
        .switchMap(() => {
            return Rx.Observable.of(
                zoomToExtent([
                    -7037508.34, -7037508.34,
                    7037508.34, 14037508.34
                ], 'EPSG:3857'),
                updateNode('datasets_layer', 'layers', {visibility: true})
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
            const template = action.options.filterId ?
            `${currentSection}.categories[${action.options.categoryId}].datasetLayers[${action.options.datasetId}].availableFilters[${action.options.availableFilterId}].filters[${action.options.filterId}]`
            : `${currentSection}.categories[${action.options.categoryId}].datasetLayers[${action.options.datasetId}]`;
            const currentUpdate = get(updatingFilter, template);
            const newFilter = set(template, {...currentUpdate, checked: action.options.checked}, updatingFilter);
            return Rx.Observable.of(
                setFilter(newFilter),
                updateDataURL({
                    ...stringifyCategory(currentSection, newFilter)
                })
            );
        }
        return Rx.Observable.empty();
    });

module.exports = {
    initDataLayerEpic,
    selectAreaEpic,
    closeDataExplorerEpic,
    itemSelectedEpic,
    resetSearchLayerEpic,
    updateFilterEpic
};
