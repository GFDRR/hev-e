
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
const DockPanel = require('../../MapStore2/web/client/components/misc/panels/DockPanel');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');

const DataCatalog = require('../components/DataCatalog');

class DataExplorerComponent extends React.Component {
    static propTypes = {
        open: PropTypes.bool,
        onClose: PropTypes.func
    };

    static defaultProps = {
        open: true,
        onClose: () => {}
    };

    render() {

        return this.props.open ? (
            <div
                className="et-data-explorer"
                style={{position: 'relative', order: -1, flex: 1}}>
                <DockPanel
                    glyph="hdd"
                    onClose={() => this.props.onClose()}
                    open={this.props.open}
                    fixed={false}
                    position="left"
                    zIndex={400}
                    title={
                        <Toolbar
                            btnDefaultProps={
                                {
                                    className: 'square-button-md',
                                    bsStyle: 'primary'
                                }
                            }
                            buttons={
                                [
                                    {
                                        glyph: '1-pdf',
                                        tooltip: 'Download pdf'
                                    },
                                    {
                                        glyph: 'share',
                                        tooltip: 'Share page'
                                    }
                                ]
                            }/>
                    }
                    header={
                        <Row>
                            <Col xs={12}>
                                <Nav bsStyle="tabs" activeKey="exposures" justified>
                                    <NavItem eventKey="hazards" >Hazards</NavItem>
                                    <NavItem eventKey="exposures" >Exposures</NavItem>
                                    <NavItem eventKey="vulnerability" >Vulnerability</NavItem>
                                </Nav>
                            </Col>
                        </Row>
                    }
                    fluid
                    size={1.0}>
                    <DataCatalog />
                </DockPanel>
            </div>
        ) : null;
    }
}


const dataExplorerSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled
], (open) => ({
    open
}));

const DataExplorer = connect(
    dataExplorerSelector,
    {
        onClose: setControlProperty.bind(null, 'dataExplorer', 'enabled', false)
    }
)(DataExplorerComponent);

module.exports = {
    DataExplorerPlugin: DataExplorer,
    reducers: {}
};
