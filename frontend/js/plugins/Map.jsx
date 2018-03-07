
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
const {resizeMap, changeMousePointer} = require('../../MapStore2/web/client/actions/map');
const ContainerDimensions = require('react-container-dimensions').default;
const {getStyle} = require('../../MapStore2/web/client/components/map/openlayers/VectorStyle');
const {selectArea} = require('../actions/dataexploration');
const {createSelector} = require('reselect');

class ResizableMapComponent extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        options: PropTypes.options,
        onResizeMap: PropTypes.func,
        onSelectArea: PropTypes.func,
        onChangePointer: PropTypes.func,
        mousePointer: PropTypes.string
    };

    static defaultProps = {
        width: 0,
        height: 0,
        onResizeMap: () => {},
        onSelectArea: () => {},
        onChangePointer: () => {},
        mousePointer: ''
    };

    componentWillReceiveProps(newProps) {
        if (newProps.width !== this.props.width
        || newProps.height !== this.props.height) {
            this.props.onResizeMap();
        }
    }

    render() {
        return (
            <MapPlugin
                options={{
                    ...this.props.options,
                    onClickEvent: event => {
                        const featuresAtPixel = event.target && event.target.getFeaturesAtPixel && event.target.getFeaturesAtPixel(event.pixel);
                        if (featuresAtPixel && featuresAtPixel.length > 0) {
                            const propertiesArray = featuresAtPixel.map(feature => {
                                const properties = feature.getProperties();
                                const extent = feature.getGeometry().getExtent();

                                // TODO: get crs
                                return properties && Object.keys(properties)
                                    .filter(key => key !== 'geometry')
                                    .reduce((newProperties, key) => ({
                                        ...newProperties,
                                        [key]: properties[key]
                                    }), {
                                        bbox: [...extent],
                                        crs: 'EPSG:3857'
                                    });
                            }).filter(val => val);
                            if (propertiesArray.length > 0) {
                                this.props.onSelectArea({...propertiesArray[0]});
                            }
                        }
                    },
                    onMoveEvent: event => {
                        const featuresAtPixel = event.target && event.target.getFeaturesAtPixel && event.target.getFeaturesAtPixel(event.pixel);
                        let hrefs = [];
                        if (featuresAtPixel && featuresAtPixel.length > 0) {
                            hrefs = featuresAtPixel.map(feature => {
                                const properties = feature.getProperties();
                                return properties.href;
                            }).filter(href => href);
                            this.props.onChangePointer('pointer');
                        } else if (this.props.mousePointer !== 'default') {
                            this.props.onChangePointer('default');
                        }
                        const layers = event.target && event.target.getLayers && event.target.getLayers();
                        const layersArray = layers && layers.getArray && layers.getArray();
                        if (layersArray && layersArray.length > 0) {
                            layersArray.forEach(layer => {
                                if (layer.type === 'VECTOR' && layer.get('msId') === 'datasets_layer' && layer.getSource) {
                                    layer.getSource().forEachFeature(feature => {
                                        const properties = feature.getProperties();
                                        if (hrefs.indexOf(properties.href) !== -1) {
                                            // selected style
                                            feature.setStyle(getStyle({
                                                style: {
                                                    color: '#db0033',
                                                    fillColor: 'rgba(240, 240, 240, 0.5)',
                                                    weight: 7
                                                }
                                            }));
                                        } else {
                                            // default style
                                            feature.setStyle(getStyle({
                                                style: {
                                                    color: '#db0033',
                                                    fillColor: 'rgba(240, 240, 240, 0.5)',
                                                    weight: 2
                                                }
                                            }));
                                        }
                                    });
                                }
                            });
                        }
                    }
                }}
                {...this.props}/>
        );
    }
}

const mapSelector = createSelector([
    state => state.map && state.map.present && state.map.present.mousePointer || 'default'
], (mousePointer) => ({
    mousePointer
}));

const ResizableMap = connect(
    mapSelector,
    {
        onResizeMap: resizeMap,
        onSelectArea: selectArea,
        onChangePointer: changeMousePointer
    }
)(ResizableMapComponent);

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
