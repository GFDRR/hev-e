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
const {drawFeaturesSelector} = require('../selectors/dataexploration');

class ZoomToSearchComponent extends React.Component {
    static propTypes = {
        bbox: PropTypes.array,
        onClick: PropTypes.func,
        crs: PropTypes.string,
        tooltipId: PropTypes.string
    };

    static defaultProps = {
        bbox: null,
        onClick: () => {},
        crs: 'EPSG:4326'
    };

    render() {
        return this.props.bbox ? (
            <ButtonT
                className="square-button"
                tooltipId={this.props.tooltipId}
                tooltipPosition="left"
                bsStyle="primary"
                onClick={() => {
                    this.props.onClick(this.props.bbox, this.props.crs);
                }}>
                <Glyphicon glyph="zoom-to"/>
            </ButtonT>
        ) : null;
    }
}

const zoomToSearchSelector = createSelector([
    layersSelector,
    drawFeaturesSelector
], (layers, drawFeaures) => ({
    tooltipId: drawFeaures && drawFeaures[0] && drawFeaures[0] ? 'heve.zoomToFilteredArea' : 'heve.zoomToSelectedArea',
    crs: drawFeaures && drawFeaures[0] && drawFeaures[0].projection || 'EPSG:4326',
    bbox: drawFeaures && drawFeaures[0] && drawFeaures[0].extent
    || head(layers.filter(layer => layer.id === 'search_layer').map(layer => layer.features && layer.features[0] && layer.features[0].bbox).filter(val => val))
    || null
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
            position: 3,
            toolStyle: "primary",
            tool: true,
            priority: 2,
            alwaysVisible: true
        }
    }),
    reducers: {}
};
