/**
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
const {layersSelector} = require('../../MapStore2/web/client/selectors/layers');
const assign = require('object-assign');

class GlobalSpinner extends React.Component {
    static propTypes = {
        loading: PropTypes.bool
    };

    render() {
        return this.props.loading ? <div
                className="square-button"
                style={{
                    backgroundColor: 'transparent',
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    padding: 4
                }}>
                <div className="mapstore-medium-size-loader" />
            </div> : null;
    }
}

const selector = createSelector([layersSelector], (layers) => ({
    loading: layers && layers.some((layer) => layer.loading)
}));

const MapLoadingPlugin = connect(selector)(GlobalSpinner);

module.exports = {
    MapLoadingPlugin: assign(MapLoadingPlugin, {
        Toolbar: {
            name: 'maploading',
            position: 1,
            tool: true,
            priority: 10,
            alwaysVisible: true
        }
    }),
    reducers: {}
};
