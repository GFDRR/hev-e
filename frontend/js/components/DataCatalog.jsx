
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
        filterForm: PropTypes.node
    };

    static defaultProps = {
        onShowDetails: () => {},
        catalogURL: '',
        filterList: null,
        filterForm: null
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
