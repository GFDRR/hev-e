
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

const List = ({layoutKey, layout, item}) => {
    const values = layoutKey && layout[layoutKey] && layout[layoutKey].filter(value => value.code && item.properties && item.properties[value.code]);
    return values ? (
        <Row>
            <Col xs={12}>
                {values.map((value, idx) => (
                    <div key={idx} style={{paddingLeft: 10}}>
                        <h5><strong>{value.name}</strong>:</h5>
                        <p>
                            {item.properties && item.properties[value.code]}
                        </p>
                        <hr/>
                    </div>
                ))}
            </Col>
        </Row>
    ) : null;
};

const Body = ({item, layout, layoutKey, hazardsFilter, onUpdateFilter}) => {
    const footprints = item.footprints && item.footprints.length > 0 && item.footprints;
    return (
        <Grid fluid style={{width: '100%'}}>
            <List layoutKey={layoutKey} layout={layout} item={item}/>
            {footprints && <Row>
                <Col xs={12}>
                    <h5 style={{paddingLeft: 10}}><strong>Footprints</strong>:</h5>
                </Col>
                <Col xs={12}>
                    <Accordion
                    activePanel={hazardsFilter && hazardsFilter['_activePanel:' + item.name]}
                    onSelect={id => hazardsFilter && hazardsFilter['_activePanel:' + item.name] === id ? onUpdateFilter('_activePanel:' + item.name, null) : onUpdateFilter('_activePanel:' + item.name, id)}
                    panels={footprints.map((footprint, idx) => ({
                        id: idx + 1,
                        head: {
                            selected: hazardsFilter && hazardsFilter['_activePanel:' + item.name] === (item.id || item.name),
                            className: hazardsFilter[item.name + ':' + footprint.name] ? 'ms-card-hide' : '',
                            preview: footprint.cql && <Glyphicon
                            glyph={hazardsFilter && hazardsFilter[item.name + ':' + footprint.name] ? 'eye-close' : 'eye-open'}
                            onClick={e => {
                                e.stopPropagation();
                                onUpdateFilter(item.name + ':' + footprint.name, hazardsFilter[item.name + ':' + footprint.name] ? false : footprint.cql);
                            }}/> || <Glyphicon glyph="record"/>,
                            size: 'sm',
                            title: footprint.name
                        },
                        body: <List item={footprint} layout={layout} layoutKey="footprints"/>
                    }))}/>
                </Col>
            </Row> }
        </Grid>
    );
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
    const {events, geometry, ...properties} = currentDetails;
    const eventLayout = layout.event_set;
    const values = eventLayout && eventLayout.filter(value => properties[value.code]) || [];
    return (<BorderLayout
        header={
            <Grid fluid style={{ width: '100%' }}>
                <Row>
                    <Col xs={12}>
                        <LayerToolbar
                                item={{
                                    ...getItem.hazards(currentDetails, groupInfo),
                                    geometry,
                                    properties
                                }}
                                dataset={currentDataset}
                                hideOnAdd
                                showDownload
                                showZoomTo
                                showAddLayer
                                showRemoveLayer
                                availableFormats={availableFormats} />
                    </Col>
                </Row>
            </Grid>
        }>
        <Grid fluid style={{width: '100%', paddingBottom: 30}}>
            <Row>
                <Col xs={12}>
                    {values && values.length > 0 && values.map((value, idx) => (
                        <div key={idx} style={{paddingLeft: 10}}>
                            <h5><strong>{value.name}</strong>:</h5>
                            <p>
                                {properties && properties[value.code]}
                            </p>
                            <hr/>
                        </div>
                    ))}
                </Col>
            </Row>
            {events && <Row>
                <Col xs={12} className="et-accordion">
                    <Accordion
                        activePanel={hazardsFilter && hazardsFilter._activePanel}
                        onSelect={id => hazardsFilter && hazardsFilter._activePanel === id ? onUpdateFilter('_activePanel', null) : onUpdateFilter('_activePanel', id)}
                        panels={events.map(event => ({
                            id: event.id,
                            head: {
                                selected: hazardsFilter && hazardsFilter._activePanel === event.id,
                                className: hazardsFilter[event.id] ? 'ms-card-hide' : '',
                                preview: event.id && <Glyphicon
                                    glyph={hazardsFilter && hazardsFilter[event.id] ? 'eye-close' : 'eye-open'}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onUpdateFilter(event.id, hazardsFilter[event.id] ? false : event.id);
                                    }}/> || <Glyphicon glyph="record"/>,
                                size: 'sm',
                                title: 'Event id: ' + event.id,
                                tools: <LayerToolbar
                                    item={{...event}}
                                    showZoomTo/>
                            },
                            body: <Body
                                item={event}
                                layout={layout}
                                onUpdateFilter={onUpdateFilter}
                                hazardsFilter={hazardsFilter}
                                layoutKey="events"/>
                        }))}/>
                </Col>
            </Row>}
        </Grid>
    </BorderLayout>);
};
