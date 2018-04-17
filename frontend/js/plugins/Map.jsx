
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
const CoordinatesUtils = require('../../MapStore2/web/client/utils/CoordinatesUtils');
const {head} = require('lodash');
const {getMainViewStyle} = require('../utils/StyleUtils');

class ResizableMapComponent extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        options: PropTypes.options,
        onResizeMap: PropTypes.func,
        onSelectArea: PropTypes.func,
        onChangePointer: PropTypes.func,
        mousePointer: PropTypes.string,
        propertyId: PropTypes.string
    };

    static defaultProps = {
        width: 0,
        height: 0,
        onResizeMap: () => {},
        onSelectArea: () => {},
        onChangePointer: () => {},
        mousePointer: '',
        propertyId: 'iso3'
    };

    componentWillReceiveProps(newProps) {
        if (newProps.width !== this.props.width
        || newProps.height !== this.props.height) {
            this.props.onResizeMap();
        }
    }

    getLayers(event) {
        const layers = event.target && event.target.getLayers && event.target.getLayers();
        return layers && layers.getArray && layers.getArray();
    }

    render() {
        return (
            <MapPlugin
                options={{
                    ...this.props.options,
                    onClickEvent: event => {
                        const layers = this.getLayers(event);
                        if (layers && !head(layers.filter(layer => layer.get('msId') === 'datasets_layer' && layer.getVisible()))) {
                            return null;
                        }
                        const featuresAtPixel = event.target && event.target.getFeaturesAtPixel && event.target.getFeaturesAtPixel(event.pixel);
                        if (featuresAtPixel && featuresAtPixel.length > 0) {
                            const newFeature = head(featuresAtPixel.map(feature => {
                                const properties = feature.getProperties();
                                const extent = feature.getGeometry().getExtent();
                                return {
                                    bbox: [...extent],
                                    crs: 'EPSG:4326',
                                    type: 'Feature',
                                    geometry: {
                                        type: feature.getGeometry().getType(),
                                        coordinates: feature.getGeometry().getCoordinates()
                                    },
                                    properties: properties && Object.keys(properties)
                                    .filter(key => key !== 'geometry')
                                    .reduce((newProperties, key) => ({
                                        ...newProperties,
                                        [key]: properties[key]
                                    }), {}) || {}
                                };
                            }).filter(val => val && val.properties && val.properties[this.props.propertyId]));
                            if (newFeature) {
                                const reprojectedFeature = CoordinatesUtils.reprojectGeoJson(newFeature, 'EPSG:3857', 'EPSG:4326');
                                this.props.onSelectArea({...reprojectedFeature});
                            }
                        }
                    },
                    onMoveEvent: event => {
                        const layers = this.getLayers(event);
                        if (layers && !head(layers.filter(layer => layer.get('msId') === 'datasets_layer' && layer.getVisible()))) {
                            if (this.props.mousePointer !== 'default') {
                                this.props.onChangePointer('default');
                            }
                            return null;
                        }
                        const featuresAtPixel = event.target && event.target.getFeaturesAtPixel && event.target.getFeaturesAtPixel(event.pixel);
                        let id = [];
                        if (featuresAtPixel && featuresAtPixel.length > 0) {
                            id = head(featuresAtPixel.map(feature => {
                                const properties = feature.getProperties();
                                return properties[this.props.propertyId];
                            }).filter(idx => idx));
                            if (this.props.mousePointer !== 'pointer') {
                                this.props.onChangePointer('pointer');
                            }
                        } else if (this.props.mousePointer !== 'default') {
                            this.props.onChangePointer('default');
                        }

                        if (layers && layers.length > 0) {
                            layers.forEach(layer => {
                                if (layer.type === 'VECTOR' && layer.get('msId') === 'datasets_layer' && layer.getSource) {
                                    layer.getSource().forEachFeature(feature => {
                                        const properties = feature.getProperties();
                                        if (id && id === properties[this.props.propertyId]) {
                                            // hover style
                                            feature.setStyle(getStyle({
                                                style: getMainViewStyle(true)
                                            }));
                                        } else {
                                            // default style
                                            feature.setStyle(getStyle({
                                                style: getMainViewStyle()
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
