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
const {showDatails, updateFilter, showFilter} = require('../actions/dataexploration');
const {currentDetailsSelector, catalogURLSelector} = require('../selectors/dataexploration');
const DockPanel = require('../../MapStore2/web/client/components/misc/panels/DockPanel');
const DataCatalog = require('../components/DataCatalog');
const DataDetails = require('../components/DataDetails');
const ContainerDimensions = require('react-container-dimensions').default;
const {updateNode} = require("../../MapStore2/web/client/actions/layers");
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');

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
    state => state.dataexploration && state.dataexploration.filter && state.dataexploration.filter.show
], (show) => ({
    showFilter: show
}));

const FilterForm = connect(
    filterFormSelector,
    {
        onShowFilter: showFilter
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
        onZoomTo: PropTypes.func
    };

    static defaultProps = {
        open: true,
        currentDetails: null,
        onClose: () => {},
        onShowDetails: () => {},
        catalogURL: '',
        onShowBbox: () => {},
        onZoomTo: () => {}
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
                        icon={<i className="fa fa-database fa-2x"/>}
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
                                        <NavItem eventKey="hazards" >Hazards</NavItem>
                                        <NavItem eventKey="exposures" >Exposures</NavItem>
                                        <NavItem eventKey="vulnerability" >Vulnerabilities</NavItem>
                                    </Nav>
                                </Col>
                            </Row>
                        }>
                        <DataCatalog
                            filterList={FilterList}
                            filterForm={FilterForm}
                            catalogURL={this.props.catalogURL}
                            onShowDetails={this.props.onShowDetails}
                            onShowBbox={this.props.onShowBbox}
                            onZoomTo={this.props.onZoomTo}/>
                    </DockPanel>
                    <DataDetails
                        onClose={() => this.props.onShowDetails(null)}
                        currentDetails={this.props.currentDetails}
                        onZoomTo={this.props.onZoomTo}/>
                </div>
                )}
            </ContainerDimensions>
        );
    }
}

const dataExplorerSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled,
    currentDetailsSelector,
    catalogURLSelector
], (open, currentDetails, catalogURL) => ({
    open,
    currentDetails,
    catalogURL
}));

const DataExplorer = connect(
    dataExplorerSelector,
    {
        onClose: setControlProperty.bind(null, 'dataExplorer', 'enabled', false),
        onShowDetails: showDatails,
        onShowBbox: updateNode,
        onZoomTo: zoomToExtent
    }
)(DataExplorerComponent);

module.exports = {
    DataExplorerPlugin: DataExplorer,
    reducers: {
        dataexploration: require('../reducers/dataexploration')
    },
    epics: require('../epics/dataexploration')
};
