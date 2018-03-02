
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const CompactCatalog = require('../../MapStore2/web/client/components/catalog/CompactCatalog');
const DataFilter = require('./DataFilter');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');

class DataCatalog extends React.Component {
    static propTypes = {

    };

    static defaultProps = {

    };

    render() {
        return (
            <CompactCatalog
                filterForm={DataFilter}
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
                                    onClick: () => {}
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
                    "url": "https://demo.geo-solutions.it/geoserver/csw",
                    "type": "csw",
                    "title": "Demo CSW Service",
                    "autoload": true
                }}/>
        );
    }
}

module.exports = DataCatalog;
