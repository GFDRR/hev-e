
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

class DataCatalog extends React.Component {
    static propTypes = {
        onShowDetails: PropTypes.func,
        catalogURL: PropTypes.string,
        filterList: PropTypes.node,
        filterForm: PropTypes.node,
        onShowBbox: PropTypes.func,
        onZoomTo: PropTypes.func
    };

    static defaultProps = {
        onShowDetails: () => {},
        catalogURL: '',
        filterList: null,
        filterForm: null,
        onShowBbox: () => {},
        onZoomTo: () => {}
    };

    render() {
        const FilterList = this.props.filterList;
        return (
            <div className="et-catalog" style={{display: 'flex', flex: 1, height: '100%'}}>
                <FilterList/>
                {this.props.catalogURL && <CompactCatalog
                    filterForm={this.props.filterForm}
                    onRecordSelected={() => {}}
                    key={'' + this.props.catalogURL}
                    getCustomItem={
                        item => ({
                            title: <span>{item.title}</span>,
                            description: <span>{item.description}</span>,
                            caption: <span>{item.caption}</span>,
                            preview: item.icon ? <i className={'fa fa-4x text-center fa-' + item.icon}></i> : null,
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
                                                color: "rgba(33, 186, 176, 0.25)"
                                            },
                                            stroke: {
                                                color: "#555",
                                                width: 2,
                                                opacity: 1,
                                                lineDash: [
                                                    4,
                                                    6
                                                ]
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
                                        tooltip: 'Zoom to layer',
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            const bbox = item && item.record && item.record.bbox || null;
                                            if (bbox) {
                                                this.props.onZoomTo([...bbox], 'EPSG:4326');
                                            }
                                        }
                                    },
                                    {
                                        glyph: 'bulb-off',
                                        tooltip: 'Show layer'
                                    },
                                    {
                                        glyph: 'plus',
                                        tooltip: 'Add layer to download list'
                                    }
                                ]}/>
                        })
                    }
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
