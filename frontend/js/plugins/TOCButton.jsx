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
const {toggleControl} = require('../../MapStore2/web/client/actions/controls');
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const {head} = require('lodash');

class TOCButtonComponent extends React.Component {
    static propTypes = {
        enabled: PropTypes.bool,
        onClick: PropTypes.func
    };

    static defaultProps = {
        enabled: false,
        onClick: () => {}
    };

    render() {
        return this.props.enabled ? (
            <ButtonT
                className="et-layer-button square-button"
                tooltipId="heve.compactTOC"
                tooltipPosition="left"
                bsStyle="primary"
                onClick={() => this.props.onClick()}>
                <Glyphicon glyph="1-layer"/>
            </ButtonT>
        ) : null;
    }
}

const tocButtonSelector = createSelector([
    state => state.controls && state.controls.compacttoc && state.controls.compacttoc.enabled,
    state => state.controls && state.controls.compacttoc && state.controls.compacttoc.hide,
    layersSelector
], (enabled, hide, layers) => {
    const tocLayers = layers.filter(layer => layer.group === 'toc_layers');
    return {
        enabled: !enabled && head(tocLayers) && !hide
    };
});

const TOCButtonPlugin = connect(
    tocButtonSelector,
    {
        onClick: toggleControl.bind(null, 'compacttoc', null)
    }
)(TOCButtonComponent);

module.exports = {
    TOCButtonPlugin,
    reducers: {}
};
