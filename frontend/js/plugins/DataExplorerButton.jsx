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
const {Button} = require('react-bootstrap');
const tooltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ButtonT = tooltip(Button);
const {selectedAreaSelector} = require('../selectors/dataexploration');
const {selectArea} = require('../actions/dataexploration');

class DataExplorerButtonComponent extends React.Component {
    static propTypes = {
        currentArea: PropTypes.object,
        onClick: PropTypes.func
    };

    static defaultProps = {
        currentArea: null,
        onClick: () => {}
    };

    render() {
        return this.props.currentArea ? (
            <ButtonT
                className="et-dataset-button square-button"
                tooltip="Latest selected area"
                tooltipPosition="right"
                bsStyle="primary"
                onClick={() => this.props.onClick(this.props.currentArea)}>
                <span className="fa fa-database"></span>
            </ButtonT>
        ) : null;
    }
}

const dataExplorerSelector = createSelector([
    selectedAreaSelector,
    state => state.controls && state.controls.dataExplorer.enabled
], (currentArea, open) => ({
    currentArea: open ? null : currentArea
}));

const DataExplorerButton = connect(
    dataExplorerSelector,
    {
        onClick: selectArea
    }
)(DataExplorerButtonComponent);

module.exports = {
    DataExplorerButtonPlugin: DataExplorerButton,
    reducers: {}
};
