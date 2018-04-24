/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {Nav, NavItem, Col, Row} = require('react-bootstrap');
const {setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {showDatails, updateFilter, showFilter, setSortType, showRelatedData, addDownload, updateCurrentDataset} = require('../actions/dataexploration');
const {datasetSelector, currentDatasetSelector, currentDetailsSelector, sortSelector, showRelatedDataSelector, bboxFilterStringSelector, tmpDetailsBboxSelector, explorerBBOXSelector} = require('../selectors/dataexploration');
const DockPanel = require('../../MapStore2/web/client/components/misc/panels/DockPanel');
const ContainerDimensions = require('react-container-dimensions').default;
const {updateNode} = require("../../MapStore2/web/client/actions/layers");
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {addLayer, removeLayer} = require("../../MapStore2/web/client/actions/layers");
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const {head} = require('lodash');

const getGroupInfo = filters => {
    return filters && filters.category
    && filters.category.reduce((info, group) => ({...info, ...group.filters.reduce((sub, filt) => ({...sub, [filt.code.toLowerCase()]: {...filt, param: group.code, group: group.name, icon: filt.icon || group.icon}}), {})}), {}) || {};
};

const getCategoryParams = filters => {
    return filters && filters.category
    && filters.category.reduce((params, group) => [...params, group.code], []) || [];
};

const filterListSelector = createSelector([
    state => state.dataexploration && state.dataexploration.filter,
    state => state.dataexploration && state.dataexploration.currentDataset || 'exposures',
    state => state.dataexploration && state.dataexploration.filter && state.dataexploration.filter.show || false
], (filter, dataset, enabled) => ({
    filter: filter[dataset] || {},
    enabled
}));

const FilterList = connect(
    filterListSelector,
    {
        onChange: updateFilter
    }
)(require('../components/FilterList'));


const filterTaxonomyListSelector = createSelector([
    state => state.dataexploration && state.dataexploration.filter,
    currentDatasetSelector,
    layersSelector,
    currentDetailsSelector
], (filter, dataset, layers, details) => {
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
    return {
        filter: tmpLayer && tmpLayer.taxonomy || details.dataset && filter[details.dataset] && filter[details.dataset].taxonomy || filter[dataset] && filter[dataset].taxonomy || {}
    };
});

const FilterTaxonomyList = connect(
    filterTaxonomyListSelector,
    {
        onChange: updateFilter
    }
)(require('../components/FilterList'));

const filterFormSelector = createSelector([
    state => state.dataexploration && state.dataexploration.filter && state.dataexploration.filter.show,
    sortSelector
], (show, sortType) => ({
    showFilter: show,
    sortType
}));

const FilterForm = connect(
    filterFormSelector,
    {
        onShowFilter: showFilter,
        onChangeSortType: setSortType
    }
)(require('../components/FilterForm'));

const dataDetailsSelector = createSelector([
    currentDetailsSelector,
    sortSelector,
    showRelatedDataSelector,
    state => state.dataexploration && state.dataexploration.filter,
    currentDatasetSelector,
    layersSelector,
    state => state.dataexploration && state.dataexploration.downloads,
    tmpDetailsBboxSelector,
    state => state.dataexploration && state.dataexploration.detailsLoading
], (currentDetails, sortBy, showData, filters, dataset, layers, downloads, bbox, loading) => {
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
    const currentDataset = currentDetails && currentDetails.dataset || dataset;
    return {
        currentDetails,
        showRelatedData: showData,
        layers: layers.filter(layer => layer.group === 'toc_layers'),
        currentTaxonomy: tmpLayer && tmpLayer.taxonomy || filters[currentDataset] && filters[currentDataset].taxonomy || {},
        groupInfo: getGroupInfo(filters[currentDataset]),
        downloads,
        bbox: bbox || {},
        loading,
        currentDataset,
        availableFormats: filters[currentDataset] && filters[currentDataset].format || {},
        layout: filters[currentDataset] && filters[currentDataset].layout || {}
    };
});

const DataDetails = connect(
    dataDetailsSelector,
    {
        onClose: showDatails.bind(null, null),
        onShowRelatedData: showRelatedData
    }
)(require('../components/DataDetails'));

const layerToolbarSelector = createSelector([
    layersSelector,
    state => state.dataexploration && state.dataexploration.downloads,
    currentDetailsSelector,
    state => state.dataexploration && state.dataexploration.filter,
    currentDatasetSelector,
    tmpDetailsBboxSelector,
    explorerBBOXSelector
], (layers, downloads, details, filter, dataset, detailsBBOX, explorerBBOX) => {
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
    return {
        layers: layers.filter(layer => layer.group === 'toc_layers'),
        downloads,
        filterBBOX: details && detailsBBOX && detailsBBOX.type === 'filter' && detailsBBOX || explorerBBOX && explorerBBOX.type === 'filter' && explorerBBOX,
        taxonomy: tmpLayer && tmpLayer.taxonomy || details && details.dataset && filter[details.dataset] && filter[details.dataset].taxonomy || filter[dataset] && filter[dataset].taxonomy || {}
    };
});
/*
const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
return {
    filter: tmpLayer && tmpLayer.taxonomy || details.dataset && filter[details.dataset] && filter[details.dataset].taxonomy || filter[dataset] && filter[dataset].taxonomy || {}
};
*/
const LayerToolbar = connect(
    layerToolbarSelector,
    {
        onShowDetails: showDatails,
        onShowBbox: updateNode,
        onZoomTo: zoomToExtent,
        onAddLayer: addLayer,
        onRemoveLayer: removeLayer,
        onAddDownload: addDownload
    }
)(require('../components/LayerToolbar'));

const dataCatalogSelector = createSelector([
    sortSelector,
    state => state.dataexploration && state.dataexploration.filter,
    currentDatasetSelector,
    bboxFilterStringSelector,
    datasetSelector
], (sortBy, filters, currentDataset, bboxFilter) => ({
    sortBy,
    bboxFilter,
    groupInfo: getGroupInfo(filters[currentDataset]),
    currentDataset,
    catalogURL: '/gfdrr_det/api/v1/' + currentDataset + '/',
    sortOptions: filters[currentDataset].ordering,
    searchFilter: filters[currentDataset].search,
    categoryParams: getCategoryParams(filters[currentDataset]),
    availableFormats: filters[currentDataset] && filters[currentDataset].format || {}
}));

const DataCatalog = connect(
    dataCatalogSelector,
    {
        onShowDetails: showDatails,
        onShowBbox: updateNode
    }
)(require('../components/DataCatalog'));

class DataExplorerComponent extends React.Component {
    static propTypes = {
        open: PropTypes.bool,
        onClose: PropTypes.func,
        dataset: PropTypes.array,
        onSelectDataset: PropTypes.func,
        currentDataset: PropTypes.string,
        getWidth: PropTypes.func
    };

    static defaultProps = {
        open: true,
        onClose: () => {},
        dataset: [],
        onSelectDataset: () => {},
        currentDataset: '',
        getWidth: width => width * 2 / 5 > 687 && width * 2 / 5 || width / 2
    };

    render() {

        return (
            <ContainerDimensions>
                {({width}) => (
                <div
                    id="et-data-explorer"
                    className="et-data-explorer"
                    style={{position: 'relative', order: -1, width: this.props.open ? this.props.getWidth(width) : 0, overflow: 'hidden' }}>
                    <DockPanel
                        icon={<span></span>}
                        onClose={() => this.props.onClose()}
                        open={this.props.open}
                        fixed={false}
                        position="left"
                        zIndex={400}
                        fluid
                        size={1.0}
                        header={
                            <Row>
                                <Col xs={12}>
                                    <Nav bsStyle="tabs" activeKey={this.props.currentDataset} justified>
                                        {this.props.dataset.map(item => (
                                        <NavItem
                                            eventKey={item}
                                            onClick={() => item === 'hazards' ? () => {} : this.props.onSelectDataset(item)}>
                                            <Message msgId={'heve.' + item}/>
                                        </NavItem>))}
                                    </Nav>
                                </Col>
                            </Row>
                        }>
                        {this.props.open && <DataCatalog
                            filterList={FilterList}
                            filterForm={FilterForm}
                            layerToolbar={LayerToolbar}/>}
                    </DockPanel>
                    <DataDetails
                        filterList={FilterTaxonomyList}
                        layerToolbar={LayerToolbar}/>
                </div>
                )}
            </ContainerDimensions>
        );
    }
}

const dataExplorerSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled,
    currentDatasetSelector,
    datasetSelector
], (open, currentDataset, dataset) => ({
        open,
        dataset,
        currentDataset
}));

const DataExplorer = connect(
    dataExplorerSelector,
    {
        onClose: setControlProperty.bind(null, 'dataExplorer', 'enabled', false),
        onSelectDataset: updateCurrentDataset
    }
)(DataExplorerComponent);

module.exports = {
    DataExplorerPlugin: DataExplorer,
    reducers: {
        dataexploration: require('../reducers/dataexploration')
    },
    epics: require('../epics/dataexploration')
};
