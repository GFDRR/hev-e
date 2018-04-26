
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const BorderLayout = require('../../../MapStore2/web/client/components/layout/BorderLayout');
const {Row, Col, Grid, Glyphicon} = require('react-bootstrap');
// const {head, isArray, join, isObject, isString} = require('lodash');
const Accordion = require('../../../MapStore2/web/client/components/misc/panels/Accordion');
const {getItem} = require('../../utils/ItemsUtils');

const Body = ({items, layout, layoutKey}) => {
    const values = layoutKey && layout[layoutKey] && layout[layoutKey].filter(value => value.code && items[value.code]);
    const footprints = layoutKey !== 'footprints' && items.footprints && items.footprints.length > 0 && items.footprints;
    return values ? (
        <Grid fluid style={{width: '100%'}}>
            <Row>
                <Col xs={12}>
                    {values.map(value => (
                        <div style={{paddingLeft: 10}}>
                            <h5><strong>{value.name}</strong>:</h5>
                            <p>
                                {items[value.code]}
                            </p>
                            <hr/>
                        </div>
                    ))}
                </Col>
            </Row>
            {footprints && <Row>
                <Col xs={12}>
                    <Accordion
                    activePanel={0}
                    onSelect={() => {}}
                    panels={footprints.map((footprint, idx) => ({
                        id: idx + 1,
                        head: {
                            preview: <Glyphicon glyph="eye-open"/>,
                            size: 'sm',
                            title: footprint.name
                        },
                        body: <Body items={footprints} layout={layout} layoutKey="footprints"/>
                    }))}/>
                </Col>
            </Row> }
        </Grid>
    ) : null;
};

module.exports = ({
    layout,
    currentDetails,
    layerToolbar,
    currentDataset,
    availableFormats,
    groupInfo,
    onUpdateFilter,
    hazardsFilter
}) => {

    const LayerToolbar = layerToolbar;

   /* const currentDetails = {

        properties: {
            description: 'Current description',
            events: [
                {
                    name: 'Event:001',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:002',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:003',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:004',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:005',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:006',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                },
                {
                    name: 'Event:007',
                    cql: 'filter',
                    footprints: [],
                    min: 0.5
                }
            ]
        }
    };*/

    const events = currentDetails && currentDetails.properties && currentDetails.properties.events;

    return (<BorderLayout
        header={
            <Grid fluid style={{ width: '100%' }}>
                <Row>
                    <Col xs={12}>
                        <LayerToolbar
                                item={{
                                    ...getItem.hazards(currentDetails, groupInfo),
                                    properties: currentDetails.properties && {...currentDetails.properties},
                                    geometry: currentDetails.geometry && {...currentDetails.geometry}
                                }}
                                dataset={currentDataset}
                                hideOnAdd
                                // showDownload
                                // showZoomTo
                                // showAddLayer
                                // showRemoveLayer
                                availableFormats={availableFormats} />
                    </Col>
                </Row>
            </Grid>
        }>
        <Grid fluid style={{width: '100%', paddingBottom: 30}}>
            <Row>
                <Col xs={12}>
                    <p>{currentDetails && currentDetails.properties && currentDetails.properties.description}</p>
                </Col>
            </Row>
            {events && <Row>
                <Col xs={12} className="et-accordion">
                    <Accordion
                        activePanel={hazardsFilter && hazardsFilter._activePanel}
                        onSelect={id => hazardsFilter && hazardsFilter._activePanel === id ? onUpdateFilter('_activePanel', null) : onUpdateFilter('_activePanel', id)}
                        panels={events.map(event => ({
                            id: event.id || event.name,
                            head: {
                                selected: hazardsFilter && hazardsFilter._activePanel === (event.id || event.name),
                                className: hazardsFilter[event.name] ? 'ms-card-hide' : '',
                                preview: <Glyphicon
                                    glyph={hazardsFilter && hazardsFilter[event.name] ? 'eye-close' : 'eye-open'}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onUpdateFilter(event.name, !hazardsFilter[event.name]);
                                    }}/>,
                                size: 'sm',
                                title: event.name
                            },
                            body: <Body items={event} layout={layout} layoutKey="events"/>
                        }))}/>
                </Col>
            </Row>}
        </Grid>
    </BorderLayout>);
};
