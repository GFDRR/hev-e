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
const {Button, Glyphicon} = require('react-bootstrap');
const tooltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ButtonT = tooltip(Button);
const assign = require('object-assign');
const {toggleSpatialFilter} = require('../actions/dataexploration');
const {drawFeaturesSelector} = require('../selectors/dataexploration');

class SpatialFilterComponent extends React.Component {
    static propTypes = {
        draw: PropTypes.bool,
        drawStatus: PropTypes.string,
        onClick: PropTypes.func
    };

    static defaultProps = {
        draw: null,
        onClick: () => {}
    };

    render() {
        return (
            <ButtonT
                className="square-button"
                tooltipId={this.props.draw ? 'heve.removeSpatialFilter' : this.props.drawStatus === 'start' ? 'heve.drawSpatialFilter' : 'heve.applySpatialFilter'}
                tooltipPosition="left"
                active={this.props.drawStatus === 'start' || this.props.draw}
                bsStyle="primary"
                onClick={() => {
                    this.props.onClick();
                }}>
                <Glyphicon glyph={this.props.draw ? 'remove-square' : 'bbox'}/>
            </ButtonT>
        );
    }
}

const spatialFilterSelector = createSelector([
    drawFeaturesSelector,
    state => state.draw && state.draw.drawStatus
], (features, drawStatus) => ({
    draw: !(features && features.length === 0),
    drawStatus
}));

const SpatialFilter = connect(
    spatialFilterSelector,
    {
        onClick: toggleSpatialFilter
    }
)(SpatialFilterComponent);

module.exports = {
    SpatialFilterPlugin: assign(SpatialFilter, {
        Toolbar: {
            name: 'spatial-filter',
            position: 1,
            toolStyle: "primary",
            tool: true,
            priority: 1,
            alwaysVisible: true
        }
    }),
    reducers: {}
};
