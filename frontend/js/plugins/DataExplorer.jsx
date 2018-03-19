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
const {showDatails, updateFilter, showFilter, setSortType, showRelatedData} = require('../actions/dataexploration');
const {currentDetailsSelector/*, catalogURLSelector*/, sortSelector, showRelatedDataSelector, bboxFilterStringSelector} = require('../selectors/dataexploration');
const DockPanel = require('../../MapStore2/web/client/components/misc/panels/DockPanel');
const DataCatalog = require('../components/DataCatalog');
const DataDetails = require('../components/DataDetails');
const ContainerDimensions = require('react-container-dimensions').default;
const {updateNode} = require("../../MapStore2/web/client/actions/layers");
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {addLayer, removeLayer} = require("../../MapStore2/web/client/actions/layers");
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');

const filterListSelector = createSelector([
    state => state.dataexploration && state.dataexploration.filter,
    state => state.dataexploration && state.dataexploration.currentSection || 'exposures',
    state => state.dataexploration && state.dataexploration.filter && state.dataexploration.filter.show || false
], (filter, currentSection, enabled) => ({
    filter: filter[currentSection] || {},
    enabled
}));

const FilterList = connect(
    filterListSelector,
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
        onRemove: PropTypes.func
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
        onRemove: () => {}
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
                                    <Nav bsStyle="tabs" activeKey="exposures" justified>
                                        <NavItem eventKey="hazards" ><Message msgId="heve.hazards"/></NavItem>
                                        <NavItem eventKey="exposures" ><Message msgId="heve.exposures"/></NavItem>
                                        <NavItem eventKey="vulnerabilities" ><Message msgId="heve.vulnerabilities"/></NavItem>
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
                    <DataDetails
                        layers={this.props.layers}
                        onClose={() => this.props.onShowDetails(null)}
                        groupInfo={this.props.groupInfo}
                        currentDetails={this.props.currentDetails}
                        onZoomTo={this.props.onZoomTo}
                        onShowDetails={this.props.onShowDetails}
                        onAddLayer={this.props.onAddLayer}
                        onRemoveLayer={this.props.onRemoveLayer}
                        onShowRelatedData={this.props.onShowRelatedData}
                        showRelatedData={this.props.showRelatedData}/>
                </div>
                )}
            </ContainerDimensions>
        );
    }
}

const dataExplorerSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled,
    currentDetailsSelector,
    // catalogURLSelector,
    sortSelector,
    showRelatedDataSelector,
    state => state.dataexploration && state.dataexploration.filter,
    state => state.dataexploration && state.dataexploration.currentSection || 'exposures',
    layersSelector,
    bboxFilterStringSelector
], (open, currentDetails, /*catalogURL,*/ sortBy, showData, filters, currentSection, layers, bboxFilter) => ({
    open,
    currentDetails,
    // catalogURL,
    sortBy,
    showRelatedData: showData,
    layers: layers.filter(layer => layer.group === 'toc_layers'),
    bboxFilter,
    groupInfo: filters[currentSection] && filters[currentSection].categories
        && filters[currentSection].categories.reduce((info, group) => ({...info, ...group.datasetLayers.reduce((sub, filt) => ({...sub, [filt.code.toLowerCase()]: {...filt, group: group.name}}), {})}), {}) || {}
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
        onRemove: removeLayer
    }
)(DataExplorerComponent);

module.exports = {
    DataExplorerPlugin: DataExplorer,
    reducers: {
        dataexploration: require('../reducers/dataexploration')
    },
    epics: require('../epics/dataexploration')
};
