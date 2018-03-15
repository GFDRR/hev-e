
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const CompactCatalog = require('../../MapStore2/web/client/components/catalog/CompactCatalog');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const {head} = require('lodash');

class DataCatalog extends React.Component {
    static propTypes = {
        onShowDetails: PropTypes.func,
        catalogURL: PropTypes.string,
        filterList: PropTypes.node,
        filterForm: PropTypes.node,
        onShowBbox: PropTypes.func,
        onZoomTo: PropTypes.func,
        sortBy: PropTypes.string,
        groupInfo: PropTypes.object,
        onAddLayer: PropTypes.func,
        layers: PropTypes.array
    };

    static defaultProps = {
        onShowDetails: () => {},
        catalogURL: '',
        filterList: null,
        filterForm: null,
        onShowBbox: () => {},
        onZoomTo: () => {},
        sortBy: '',
        groupInfo: {},
        onAddLayer: () => {},
        layers: []
    };

    render() {
        const FilterList = this.props.filterList;
        return (
            <div className="et-catalog" style={{display: 'flex', flex: 1, height: '100%'}}>
                <FilterList/>
                {this.props.catalogURL && <CompactCatalog
                    filterForm={this.props.filterForm}
                    onRecordSelected={() => {}}
                    sortBy={this.props.sortBy}
                    groupInfo={this.props.groupInfo}
                    getCustomItem={
                        (item, layers) => ({
                            title: <span>{item.title}</span>,
                            description: <span>{item.description}</span>,
                            caption: <span>{item.caption}</span>,
                            preview: item.icon ? <i className={'fa fa-4x text-center fa-' + item.icon}></i> : null,
                            style: this.props.groupInfo[item.caption] && this.props.groupInfo[item.caption].checked && this.props.groupInfo[item.caption].color ? {
                                borderBottom: '2px solid ' + this.props.groupInfo[item.caption].color
                            } : {},
                            onMouseEnter: () => {
                                const bbox = item && item.record && item.record.bbox || null;
                                if (bbox) {
                                    this.props.onShowBbox('bbox_layer', 'layers', {
                                        features: [{
                                            type: 'Feature',
                                            geometry: {
                                                type: 'Polygon',
                                                coordinates: [
                                                    [
                                                        [bbox[0], bbox[1]],
                                                        [bbox[0], bbox[3]],
                                                        [bbox[2], bbox[3]],
                                                        [bbox[2], bbox[1]],
                                                        [bbox[0], bbox[1]]
                                                    ]
                                                ]
                                            },
                                            properties: {}
                                        }],
                                        style: {
                                            fill: {
                                                color: 'rgba(52, 52, 52, 0.1)' // 'transparent' // "rgba(33, 186, 176, 0.25)"
                                            },
                                            stroke: {
                                                color: this.props.groupInfo[item.caption] && this.props.groupInfo[item.caption].checked && this.props.groupInfo[item.caption].color || '#aaa',
                                                width: this.props.groupInfo[item.caption] && this.props.groupInfo[item.caption].checked && this.props.groupInfo[item.caption].color ? 2 : 1,
                                                opacity: 1
                                            }
                                        }
                                    });
                                }
                            },
                            onMouseLeave: () => {
                                this.props.onShowBbox('bbox_layer', 'layers', {
                                    features: [],
                                    style: {}
                                });
                            },
                            onClick: () => {
                                this.props.onShowDetails(item.record ? {...item.record} : {});
                            },
                            tools: <Toolbar
                                btnDefaultProps={
                                    {
                                        className: 'square-button-md',
                                        bsStyle: 'primary'
                                    }
                                }
                                buttons={[
                                    {
                                        glyph: 'zoom-to',
                                        tooltipId: 'heve.zoomToLayer',
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            const bbox = item && item.record && item.record.bbox || null;
                                            if (bbox) {
                                                this.props.onZoomTo([...bbox], 'EPSG:4326');
                                            }
                                        }
                                    },
                                    /*{
                                        glyph: 'trash',
                                        tooltipId: 'heve.hideLayer',
                                        visible: !!head(layers.filter(layer => layer.id === item.title)),
                                        onClick: (e) => {
                                            e.stopPropagation();
                                        }
                                    },*/
                                    {
                                        glyph: 'plus',
                                        tooltipId: 'heve.showLayer',
                                        visible: !head(layers.filter(layer => layer.id === item.title)),
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            const bbox = item && item.record && item.record.bbox || null;
                                            if (bbox) {
                                                const params = {
                                                    features: [{
                                                        type: 'Feature',
                                                        geometry: {
                                                            type: 'Polygon',
                                                            coordinates: [
                                                                [
                                                                    [bbox[0], bbox[1]],
                                                                    [bbox[0], bbox[3]],
                                                                    [bbox[2], bbox[3]],
                                                                    [bbox[2], bbox[1]],
                                                                    [bbox[0], bbox[1]]
                                                                ]
                                                            ]
                                                        },
                                                        properties: {}
                                                    }],
                                                    style: {
                                                        fill: {
                                                            color: 'rgba(52, 52, 52, 0.1)' // 'transparent' // "rgba(33, 186, 176, 0.25)"
                                                        },
                                                        stroke: {
                                                            color: this.props.groupInfo[item.caption] && this.props.groupInfo[item.caption].color || '#aaa',
                                                            width: this.props.groupInfo[item.caption] && this.props.groupInfo[item.caption].color ? 2 : 1,
                                                            opacity: 1
                                                        }
                                                    }
                                                };
                                                this.props.onAddLayer({
                                                    type: 'vector',
                                                    id: item.title,
                                                    name: item.title,
                                                    title: item.title,
                                                    group: 'toc_layers',
                                                    visibility: true,
                                                    hideLoading: true,
                                                    record: {...item},
                                                    ...params
                                                });
                                            }
                                        }
                                    }/*,
                                    {
                                        glyph: 'download',
                                        tooltipId: 'heve.addDownload'
                                    }*/
                                ]}/>
                        })
                    }
                    layers={this.props.layers}
                    catalog= {{
                        url: this.props.catalogURL,
                        type: 'hev-e',
                        title: 'HEV-E',
                        autoload: true
                    }}/>}
            </div>
        );
    }
}

module.exports = DataCatalog;
