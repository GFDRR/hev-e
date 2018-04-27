/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const emptyState = require('../../../MapStore2/web/client/components/misc/enhancers/emptyState');
const Message = require('../../../MapStore2/web/client/components/I18N/Message');
const SideGrid = emptyState(({items=[]}) => items.length === 0, {glyph: 'download', title: <Message msgId="heve.noMatchedDownloads"/>})(require('../../../MapStore2/web/client/components/misc/cardgrids/SideGrid'));
const Toolbar = require('../../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const {Glyphicon} = require('react-bootstrap');

module.exports = ({
    downloads = [],
    onFilter = () => {},
    download,
    onRemoveDownload = () => {},
    onSelectItem = () => {},
    format
}) => (
    <SideGrid
        items={downloads.filter((item) => onFilter(item)).map(item => ({
            preview: item.icon && <i className={`${item.icon.indexOf('icon-') === -1 ? 'fa' : ''} fa-4x text-center ${item.icon}`}/> || <Glyphicon glyph="download fa-4x text-center"/>,
            title: <span>{item.title}</span>,
            description: <span>{item.description}</span>,
            caption: <span>{item.caption}</span>,
            selected: download && download.id === item.id,
            onClick: () => onSelectItem(download && item.id === download.id ? null : {...item}),
            tools: (
                <div>
                    {item.availableFormats[format] && <span><Message msgId={'heve.' + item.availableFormats[format][0].code}/>&nbsp;&nbsp;</span>}
                    {!item.vulnerabilities && <Toolbar
                        btnDefaultProps={
                            {
                                className: 'square-button-md',
                                bsStyle: 'primary'
                            }
                        }
                        buttons={
                            [
                                {
                                    glyph: 'trash',
                                    tooltipId: 'heve.removeDownload',
                                    onClick: e => {
                                        e.stopPropagation();
                                        onRemoveDownload(item.downloadId);
                                    }
                                }
                            ]
                        }/>}
                </div>
            )
        }))}/>
);
