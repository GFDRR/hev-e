/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {head} = require('lodash');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const OlMap = require('../../MapStore2/web/client/components/map/openlayers/Map');
const Layer = require('../../MapStore2/web/client/components/map/openlayers/Layer');
const Feature = require('../../MapStore2/web/client/components/map/openlayers/Feature');
const {Grid, Row, Col, ListGroup, ListGroupItem} = require('react-bootstrap');
const {isEqual} = require('lodash');
const {reprojectBbox} = require('../../MapStore2/web/client/utils/CoordinatesUtils');

const createPolygon = bbox => {
    const reprojectedBbox = bbox && reprojectBbox(bbox.bounds, bbox.crs, 'EPSG:4326');
    return reprojectedBbox ? {
        type: 'Feature',
        id: 'bbox',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [reprojectedBbox[0], reprojectedBbox[1]],
                [reprojectedBbox[2], reprojectedBbox[1]],
                [reprojectedBbox[2], reprojectedBbox[3]],
                [reprojectedBbox[0], reprojectedBbox[3]],
                [reprojectedBbox[0], reprojectedBbox[1]]
            ]]
         },
        properties: {}
     } : null;
};

class FilterPreview extends React.Component {

    static propTypes = {
        download: PropTypes.object,
        layers: PropTypes.array
    };

    static defaultProps = {
        download: null,
        layers: [{
            type: "tileprovider",
            title: "MapBoxStyle",
            provider: "MapBoxStyle",
            name: "MapBoxStyle",
            source: "light-v9",
            group: "background",
            accessToken: "pk.eyJ1IjoiZ2Vvc29sdXRpb25zIiwiYSI6ImNqZWZzbGlzZDBlNWcyd21uY2RsaDA0bXMifQ.Kqd7xVo6gglnLZ9BAQ7uEg",
            visibility: true
        }, {
            type: 'vector',
            id: 'et-preview-bbox',
            name: 'et-preview-bbox',
            title: 'et-preview-bbox',
            visibility: true,
            hideLoading: true,
            features: [],
            style: {
                color: '#21bab0',
                weight: 5,
                fillColor: 'rgba(255, 255, 255, 0)'
            }
        }],
        mapProps: {
            id: 'et-bbox-preview',
            style: {},
            center: {
                x: 0,
                y: 0
            },
            zoom: 8,
            mapStateSource: '',
            projection: 'EPSG:3857',
            onMapViewChanges: () => {},
            onClick: () => {},
            mapOptions: {
                interactions: {
                    doubleClickZoom: false,
                    dragAndDrop: false,
                    keyboardPan: false,
                    keyboardZoom: false,
                    mouseWheelZoom: false,
                    pointer: false,
                    select: false
                }
            },
            zoomControl: false,
            mousePointer: 'default',
            onMouseMove: () => {},
            onLayerLoading: () => {},
            onLayerLoad: () => {},
            onLayerError: () => {},
            resize: 0,
            changeMeasurementState: () => {},
            onCreationError: () => {}
        }
    };

    state = {
        bbox: null
    }

    componentWillUpdate(newProps) {
        if (newProps.download && !isEqual(this.props.download, newProps.download)) {
            this.setState({
                bbox: {...newProps.download.bbox, _et_forceUpdate: true}
            });
            setTimeout(() => {
                this.setState({
                    bbox: newProps.download.bbox
                });
            }, 100);
        }
    }

    renderLayerContent = (layer, projection) => {
        if (layer.features && layer.type === "vector") {
            const bbox = createPolygon(this.state.bbox);
            const features = layer.id === 'et-preview-bbox' && bbox ? [bbox] : [...layer.features];
            return features.map( (feature) => {
                return (
                    <Feature
                        key={feature.id}
                        msId={feature.id}
                        type={feature.type}
                        crs={projection}
                        geometry={feature.geometry}
                        msId={feature.id}
                        featuresCrs={ layer.featuresCrs || 'EPSG:4326' }
                        // FEATURE STYLE OVERWRITE LAYER STYLE
                        layerStyle={layer.style}
                        style={ feature.style || layer.style || null }
                        properties={feature.properties}/>
                );
            });
        }
        return null;
    };

    renderLayers = () => {
        const projection = 'EPSG:3857';
        return this.props.layers.map((layer, index) => {
            return (
                <Layer
                    type={layer.type}
                    srs={projection}
                    position={index}
                    key={layer.id || layer.name}
                    options={layer}>
                    {this.renderLayerContent(layer, projection)}
                </Layer>
            );
        });
    };

    render() {

        const taxonomy = this.props.download && this.props.download.taxonomy;
        const hasFilter = taxonomy && this.hasFilter(taxonomy);
        return this.props.download ? (
            <div className="et-filter">
                <Grid fluid>
                    <Row>
                        <Col xs={12}>
                            <h4>{hasFilter ? <Message msgId="heve.appliedFilters"/> : <Message msgId="heve.noAppliedFilters"/>}</h4>
                        </Col>
                    </Row>
                </Grid>
                <Grid fluid>
                    {hasFilter && <Row>
                        <br/>
                        <Col xs={12}>
                            <small><strong><Message msgId="heve.bbox"/></strong></small>
                        </Col>
                    </Row>}
                    {hasFilter && <Row>
                        <OlMap
                            {...this.props.mapProps}
                            bbox={this.state.bbox}>
                            {this.renderLayers()}
                        </OlMap>
                        <br/>
                    </Row>}
                    {hasFilter && taxonomy && taxonomy.map((group, groupId) => this.hasGroupFilter(group) && (
                        <Row key={groupId}>
                            <Col xs={12}>
                                <small><strong>{group.name}</strong></small>
                            </Col>
                            <Col xs={12}>
                                <ListGroup>
                                    {group.filters.map((filter, filterId) => filter.checked && (
                                        <ListGroupItem key={filterId}>{filter.name}</ListGroupItem>
                                    ))}
                                </ListGroup>
                            </Col>
                        </Row>
                    ))}
                </Grid>
            </div>
        ) : null;
    }

    hasGroupFilter(group) {
        return group && group.filters && head(group.filters.filter(filt => filt.checked));
    }

    hasFilter(filter) {
        return head(filter.map(group => this.hasGroupFilter(group) || null ).filter(val => val));
    }
}

module.exports = FilterPreview;
