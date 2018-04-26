/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Rx = require('rxjs');
const {compose, mapPropsStream} = require('recompose');
const {isNil, isEqual} = require('lodash');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const LoadingSpinner = require('../../MapStore2/web/client/components/misc/LoadingSpinner');
const withVirtualScroll = require('../../MapStore2/web/client/components/misc/enhancers/infiniteScroll/withInfiniteScroll');
const loadingState = require('../../MapStore2/web/client/components/misc/enhancers/loadingState');
const emptyState = require('../../MapStore2/web/client/components/misc/enhancers/emptyState');
const withControllableState = require('../../MapStore2/web/client/components/misc/enhancers/withControllableState');
const CatalogForm = require('../../MapStore2/web/client/components/catalog/CatalogForm');
const HEVEAPI = require('../api/HEVE');

const SideGrid = compose(
    loadingState(({loading, items = []} ) => items.length === 0 && loading),
    emptyState(
        ({error} ) => error,
        {
            title: <Message msgId="heve.datasetNotFound" />,
            style: { transform: "translateY(50%)"},
            glyph: 'exclamation-mark'
        }),
    emptyState(
        ({loading, items = []} ) => items.length === 0 && !loading,
        {
            title: <Message msgId="catalog.noRecordsMatched" />,
            style: { transform: "translateY(50%)"}
        })

)(require('../../MapStore2/web/client/components/misc/cardgrids/SideGrid'));

const resToProps = require('./catalog/resultsToProps');

const PAGE_SIZE = 10;

const loadPage = ({currentDataset, layerToolbar, ...props}, page = 0) => Rx.Observable
    .fromPromise((HEVEAPI[currentDataset] || HEVEAPI.exposures)({
        page,
        maxRecords: PAGE_SIZE,
        ...props
    }))
    .map((result) => ({result}))
    .map(({result}) => resToProps[currentDataset] && resToProps[currentDataset]({result, LayerToolbar: layerToolbar, currentDataset, ...props}) || resToProps.exposures({result, LayerToolbar: layerToolbar, ...props}));

const scrollSpyOptions = {querySelector: ".ms2-border-layout-body", pageSize: PAGE_SIZE};

module.exports = compose(
    withControllableState('searchText', "setSearchText", ""),
    withVirtualScroll({loadPage, scrollSpyOptions, hasMore: ({total, items}) => items.length < total}),
    mapPropsStream( props$ =>
        props$.merge(props$.take(1).switchMap(({loadFirst = () => {}, ...others}) =>
            props$
                .debounceTime(500)
                .startWith({...others})
                .distinctUntilChanged((previous, next) =>
                    previous.searchText === next.searchText
                    && previous.sortBy === next.sortBy
                    && previous.bboxFilter === next.bboxFilter
                    && isEqual(previous.groupInfo, next.groupInfo))
                .do(({...props} = {}) =>
                    loadFirst({...props})
                )
                .ignoreElements()
    )))

)(({
    loading,
    searchText,
    items = [],
    total,
    filterForm,
    filterList,
    setSearchText = () => {},
    sortOptions,
    searchFilter,
    error
}) => {
    const Form = filterForm || CatalogForm;
    const FilterList = filterList;
    return (
        <div className="et-catalog" style={{display: 'flex', flex: 1, height: '100%'}}>
            <FilterList/>
            <BorderLayout
                className="compat-catalog"
                header={<Form
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    sortOptions={sortOptions}
                    searchFilter={searchFilter}/>}
                footer={
                    <div className="catalog-footer">
                        <span>{loading ? <LoadingSpinner /> : null}</span>
                        {!isNil(total) ? <span className="res-info"><Message msgId="catalog.pageInfoInfinite" msgParams={{loaded: items.length, total}}/></span> : null}
                    </div>
                }>
                <SideGrid
                    error={error}
                    items={items}
                    loading={loading}/>
            </BorderLayout>
        </div>
    );
});
