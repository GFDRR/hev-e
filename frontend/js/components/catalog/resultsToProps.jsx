/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {getItem} = require('../../utils/ItemsUtils');

module.exports = {

    exposures: ({result = {}, groupInfo, onShowDetails = () => {}, onShowBbox = () => {}, LayerToolbar = () => <div/>, availableFormats, currentDataset}) => ({
        items: (result.records || []).map((record = {}) => {

            const item = getItem.exposures(record, groupInfo);

            return {
                title: <span>{item.title}</span>,
                description: <span>{item.description}</span>,
                caption: <span>{item.caption}</span>,
                preview: item.icon && <i className={'fa fa-4x text-center ' + item.icon}/> || <i className="fa fa-4x text-center fa-database"/>,

                onClick: () => onShowDetails({...record, dataset: currentDataset}),
                onMouseEnter: () => onShowBbox('bbox_layer', 'layers', {
                    features: [{...record}],
                    style: {
                        fill: {
                            color: 'rgba(52, 52, 52, 0.1)' // 'transparent' // "rgba(33, 186, 176, 0.25)"
                        },
                        stroke: {
                            color: groupInfo[record.properties.category] && groupInfo[record.properties.category].checked && groupInfo[record.properties.category].color || '#aaa',
                            width: groupInfo[record.properties.category] && groupInfo[record.properties.category].checked && groupInfo[record.properties.category].color ? 2 : 1,
                            opacity: 1
                        }
                    }
                }),
                onMouseLeave: () => onShowBbox('bbox_layer', 'layers', {features: [], style: {}}),
                tools: <LayerToolbar
                    item={{...item,
                        geometry: record.geometry && {...record.geometry},
                        properties: {...record.properties},
                        dataset: currentDataset
                    }}
                    showZoomTo
                    showDownload
                    showAddLayer
                    showRemoveLayer
                    dataset={currentDataset}
                    availableFormats={availableFormats}/>,
                style: groupInfo[record.properties.category] && groupInfo[record.properties.category].checked && groupInfo[record.properties.category].color ? {
                    borderBottom: '2px solid ' + groupInfo[record.properties.category].color
                } : {}
            };
        }),
        total: result && result.numberOfRecordsMatched,
        error: result.error
    }),

    vulnerabilities: ({result = {}, onShowDetails = () => {}, groupInfo, LayerToolbar = () => <div/>, availableFormats, currentDataset}) => ({
        items: (result.records || []).map((record = {}) => {

            const item = getItem.vulnerabilities(record, groupInfo);

            return {
                title: <span>{item.title}</span>,
                description: <span>
                    <div>
                        <small>
                            {item.exposureIcon && <i className={'fa text-center ' + item.exposureIcon}/> || <i className="fa text-center fa-database"/>}
                            {' ' + item.exposure}
                        </small>
                    </div>
                    <div>
                        <small>
                            {item.hazardIcon && <i className={'text-center ' + item.hazardIcon}/> || <i className="fa text-center fa-database"/>}
                            {' ' + item.hazard}
                        </small>
                    </div>
                </span>,
                caption: <span>{item.caption}</span>,
                preview: item.icon && <i className={'fa fa-4x text-center ' + item.icon}/> || <i className="fa fa-4x text-center fa-database"/>,
                tools: <LayerToolbar
                    showDownload
                    dataset={currentDataset}
                    availableFormats={availableFormats}
                    item={{...item, dataset: currentDataset}}/>,
                style: record.vulnerability_type && groupInfo[record.vulnerability_type] && groupInfo[record.vulnerability_type].checked && groupInfo[record.vulnerability_type].color ? {
                    borderBottom: '2px solid ' + groupInfo[record.vulnerability_type].color
                } : {},
                onClick: () => onShowDetails({...record, dataset: currentDataset})
            };
        }),
        total: result && result.numberOfRecordsMatched,
        error: result.error
    }),

    hazards: () => ({
        items: [],
        total: 0
    })
};
