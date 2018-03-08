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
const {zoomToExtent} = require('../../MapStore2/web/client/actions/map');
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const {head} = require('lodash');
const assign = require('object-assign');

class ZoomToSearchComponent extends React.Component {
    static propTypes = {
        bbox: PropTypes.array,
        onClick: PropTypes.func
    };

    static defaultProps = {
        bbox: null,
        onClick: () => {}
    };

    render() {
        return this.props.bbox ? (
            <ButtonT
                className="square-button"
                tooltip="Zoom to search area"
                tooltipPosition="left"
                bsStyle="primary"
                onClick={() => {
                    this.props.onClick(this.props.bbox, 'EPSG:4326');
                }}>
                <Glyphicon glyph="zoom-to"/>
            </ButtonT>
        ) : null;
    }
}

const zoomToSearchSelector = createSelector([
    layersSelector
], (layers) => ({
    bbox: head(layers.filter(layer => layer.id === 'search_layer').map(layer => layer.features && layer.features[0] && layer.features[0].bbox).filter(val => val)) || null
}));

const ZoomToSearch = connect(
    zoomToSearchSelector,
    {
        onClick: zoomToExtent
    }
)(ZoomToSearchComponent);

module.exports = {
    ZoomToSearchPlugin: assign(ZoomToSearch, {
        Toolbar: {
            name: 'zoom-to-search',
            position: 1,
            toolStyle: "primary",
            tooltip: "Zoom to serarch area",
            tool: true,
            priority: 1
        }
    }),
    reducers: {}
};
