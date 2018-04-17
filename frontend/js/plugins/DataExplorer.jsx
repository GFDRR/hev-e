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
const {datasetSelector, currentDatasetSelector, currentDetailsSelector, sortSelector, showRelatedDataSelector, bboxFilterStringSelector, tmpDetailsBboxSelector} = require('../selectors/dataexploration');
const DockPanel = require('../../MapStore2/web/client/components/misc/panels/DockPanel');
const DataCatalog = require('../components/DataCatalog');
const ContainerDimensions = require('react-container-dimensions').default;
const {updateNode} = require("../../MapStore2/web/client/actions/layers");
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {addLayer, removeLayer} = require("../../MapStore2/web/client/actions/layers");
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const {head} = require('lodash');

const getGroupInfo = filters => {
    return filters && filters.category
    && filters.category.reduce((info, group) => ({...info, ...group.filters.reduce((sub, filt) => ({...sub, [filt.code.toLowerCase()]: {...filt, group: group.name, icon: group.icon}}), {})}), {}) || {};
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
    state => state.dataexploration && state.dataexploration.currentDataset || 'exposures',
    layersSelector
], (filter, dataset, layers) => {
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
    return {
        filter: tmpLayer && tmpLayer.taxonomy || filter[dataset] && filter[dataset].taxonomy || {}
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
], (currentDetails, sortBy, showData, filters, currentDataset, layers, downloads, bbox, loading) => {
    const tmpLayer = head(layers.filter(layer => layer.id === 'heve_tmp_layer'));
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
        availableFormats: filters[currentDataset] && filters[currentDataset].format || {}
    };
});

const DataDetails = connect(
    dataDetailsSelector,
    {
        onClose: showDatails.bind(null, null),
        onShowDetails: showDatails,
        onZoomTo: zoomToExtent,
        onShowRelatedData: showRelatedData,
        onAddLayer: addLayer,
        onRemove: removeLayer,
        onAddDownload: addDownload
    }
)(require('../components/DataDetails'));


class DataExplorerComponent extends React.Component {
    static propTypes = {
        open: PropTypes.bool,
        currentDetails: PropTypes.object,
        onClose: PropTypes.func,
        onShowDetails: PropTypes.func,
        catalogURL: PropTypes.string,
        onShowBbox: PropTypes.func,
        onZoomTo: PropTypes.func,
        sortBy: PropTypes.string,
        onShowRelatedData: PropTypes.func,
        showRelatedData: PropTypes.bool,
        groupInfo: PropTypes.object,
        onAddLayer: PropTypes.func,
        layers: PropTypes.array,
        bboxFilter: PropTypes.string,
        onRemove: PropTypes.func,
        dataset: PropTypes.array,
        onSelectDataset: PropTypes.func,
        currentDataset: PropTypes.string
    };

    static defaultProps = {
        open: true,
        currentDetails: null,
        onClose: () => {},
        onShowDetails: () => {},
        catalogURL: '/gfdrr_det/api/v1/exposures/',
        onShowBbox: () => {},
        onZoomTo: () => {},
        sortBy: '',
        onShowRelatedData: () => {},
        showRelatedData: false,
        groupInfo: {},
        onAddLayer: () => {},
        layers: [],
        onRemove: () => {},
        dataset: [],
        onSelectDataset: () => {},
        currentDataset: ''
    };

    render() {

        return (
            <ContainerDimensions>
                {({width}) => (
                <div
                    id="et-data-explorer"
                    className="et-data-explorer"
                    style={{position: 'relative', order: -1, width: this.props.open ? width / 2 : 0, overflow: 'hidden' }}>
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
                                            onClick={() => this.props.onSelectDataset('exposures' /*item*/)}>
                                            <Message msgId={'heve.' + item}/>
                                        </NavItem>))}
                                    </Nav>
                                </Col>
                            </Row>
                        }>
                        {this.props.open && <DataCatalog
                            filterList={FilterList}
                            filterForm={FilterForm}
                            bboxFilter={this.props.bboxFilter}
                            sortBy={this.props.sortBy}
                            catalogURL={this.props.catalogURL}
                            onShowDetails={this.props.onShowDetails}
                            onShowBbox={this.props.onShowBbox}
                            onZoomTo={this.props.onZoomTo}
                            groupInfo={this.props.groupInfo}
                            onAddLayer={this.props.onAddLayer}
                            layers={this.props.layers}
                            onRemove={this.props.onRemove}/>}
                    </DockPanel>
                    <DataDetails filterList={FilterTaxonomyList}/>
                </div>
                )}
            </ContainerDimensions>
        );
    }
}

const dataExplorerSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled,
    currentDetailsSelector,
    sortSelector,
    showRelatedDataSelector,
    state => state.dataexploration && state.dataexploration.filter,
    currentDatasetSelector,
    layersSelector,
    bboxFilterStringSelector,
    datasetSelector
], (open, currentDetails, sortBy, showData, filters, currentDataset, layers, bboxFilter, dataset) => ({
        open,
        currentDetails,
        sortBy,
        showRelatedData: showData,
        layers: layers.filter(layer => layer.group === 'toc_layers'),
        bboxFilter,
        groupInfo: getGroupInfo(filters[currentDataset]),
        dataset,
        currentDataset
}));

const DataExplorer = connect(
    dataExplorerSelector,
    {
        onClose: setControlProperty.bind(null, 'dataExplorer', 'enabled', false),
        onShowDetails: showDatails,
        onShowBbox: updateNode,
        onZoomTo: zoomToExtent,
        onShowRelatedData: showRelatedData,
        onAddLayer: addLayer,
        onRemove: removeLayer,
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
