
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
        catalogUrl: PropTypes.string,
        filterList: PropTypes.node,
        filterForm: PropTypes.node
    };

    static defaultProps = {
        onShowDetails: () => {},
        catalogUrl: 'https://demo.geo-solutions.it/geoserver/csw',
        filterList: null,
        filterForm: null
    };

    render() {
        const FilterList = this.props.filterList;
        return (
            <div className="et-catalog" style={{display: 'flex', flex: 1, height: '100%'}}>
                <FilterList/>
                <CompactCatalog
                    filterForm={this.props.filterForm}
                    onRecordSelected={() => {}}
                    getCustomItem={
                        item => ({
                            title: <span>{item.title}</span>,
                            description: <span>{item.description}</span>,
                            caption: <span>{item.caption}</span>,
                            preview: <i className="fa fa-building fa-4x text-center"></i>,
                            tools: <Toolbar
                                btnDefaultProps={
                                    {
                                        className: 'square-button-md',
                                        bsStyle: 'primary'
                                    }
                                }
                                buttons={[
                                    {
                                        glyph: 'info-sign',
                                        onClick: () => {
                                            this.props.onShowDetails(item.record ? {...item.record} : {});
                                        }
                                    },
                                    {
                                        glyph: 'bulb-off'
                                    },
                                    {
                                        glyph: 'plus'
                                    }
                                ]}/>
                        })
                    }
                    catalog= {{
                        url: this.props.catalogUrl,
                        type: 'csw',
                        title: 'Exploration tool',
                        autoload: true
                    }}/>
            </div>
        );
    }
}

module.exports = DataCatalog;
