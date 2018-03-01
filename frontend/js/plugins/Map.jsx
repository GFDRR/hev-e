
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
const {MapPlugin, reducers, epics} = require('../../MapStore2/web/client/plugins/Map');
const {resizeMap} = require('../../MapStore2/web/client/actions/map');
const ContainerDimensions = require('react-container-dimensions').default;

class ResizableMapComponent extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        onResizeMap: PropTypes.function
    };

    static defaultProps = {
        width: 0,
        height: 0,
        onResizeMap: () => {}
    };

    componentWillReceiveProps(newProps) {
        if (newProps.width !== this.props.width
        || newProps.height !== this.props.height) {
            this.props.onResizeMap();
        }
    }

    render() {
        return (
           <MapPlugin {...this.props}/>
        );
    }
}

const ResizableMap = connect(() => ({}), {onResizeMap: resizeMap})(ResizableMapComponent);

class ResizableContainer extends React.Component {
    render() {
        return (
            <ContainerDimensions>
            { ({width, height}) =>
                <ResizableMap width={width} height={height} {...this.props}/>
            }
            </ContainerDimensions>
        );
    }
}

module.exports = {
    MapPlugin: ResizableContainer,
    reducers,
    epics
};
