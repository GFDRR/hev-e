/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {Grid, Row, Col, ListGroup, ListGroupItem, Button, ButtonToolbar} = require('react-bootstrap');
const Message = require('../../../MapStore2/web/client/components/I18N/Message');
const moment = require('moment');
const tooltip = require('../../../MapStore2/web/client/components/misc/enhancers/tooltip');
const FailedIcon = tooltip(props => (<div className="fa fa-ban fa-2x text-danger" {...props}/>));
const {join} = require('lodash');

const Body = ({items, name, order}) => {
    return (
        <Col xs={12}>
            <div className="et-list-item" style={{padding: '10px 15px'}}>
                <div>
                    <div>{name}</div>
                </div>
                <div>
                    <div>
                        {(order.status === 'Completed' || order.status === 'Failed') &&
                            <ButtonToolbar>
                                {items && items[0] && items[0].format === 'geopackage' && items[0].download_url && <Button
                                    bsStyle="success"
                                    bsSize="sm"
                                    href={items[0].download_url}>
                                    <Message msgId="heve.bDownload"/>
                                </Button>}
                            </ButtonToolbar>
                        }
                    </div>
                </div>
            </div>
            <ListGroup>
                {items && items.map(item => (
                    <ListGroupItem className="et-list-item">
                        <div>
                            <div><Message msgId="heve.fileName"/>: <strong>{item.layer}</strong></div>
                            <div><small><Message msgId="heve.format"/>: {item.format}</small></div>
                            {item.bbox && <div><small><Message msgId="heve.bboxOrder"/>: {item.bbox}</small></div>}
                            {item.taxonomic_categories && <div><small><Message msgId="heve.filterOrder"/>: {join(item.taxonomic_categories, ' ')}</small></div>}
                            <div><small><Message msgId="heve.createdOn"/>: {moment(item.created_on).format('MM/DD/YYYY h:mm a')}</small></div>
                            {item.expires_on && <div><small><Message msgId="heve.expiresOn"/>: {moment(item.expires_on).format('MM/DD/YYYY h:mm a')}</small></div>}
                        </div>
                        <div>
                            <div>
                                {(item.status === 'InProduction' || item.status === 'Suspended') && <div style={{width: 24, height: 24}}><div className="mapstore-medium-size-loader" /></div>}
                                {item.status === 'Failed' && <FailedIcon tooltipId="heve.failedOrder"/>}
                                {item.download_url && item.format !== 'geopackage' && item.status === 'Completed' && <Button
                                    bsStyle="success"
                                    bsSize="sm"
                                    href={item.download_url}>
                                    <Message msgId="heve.bDownload"/>
                                </Button>}
                                {item.download_url && item.format === 'geopackage' && item.status === 'Completed' && <i className="fa fa-check fa-2x text-success"/>}
                            </div>
                        </div>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </Col>
    );
};

module.exports = ({
    orders = [],
    onRemove = () => {}
}) => {
    return (
        <Grid fluid>
            {orders.map((order, idx) => {

                const exposure = order && order.order_items && order.order_items.filter(item => {
                    const splitLayerName = item.layer && item.layer.split(':') || [];
                    return splitLayerName[0] !== 'vulnerability';
                });

                const vulnerability = order && order.order_items && order.order_items.filter(item => {
                    const splitLayerName = item.layer && item.layer.split(':') || [];
                    return splitLayerName[0] === 'vulnerability';
                });

                return (
                    <Row key={idx}>
                        <Col xs={12}>
                            <div className="et-list-item" style={{padding: '10px 15px'}}>
                                <div>
                                    <h4><strong><Message msgId="heve.orederCreate"/> {moment(order.created_on).format('MM/DD/YYYY h:mm a')}</strong></h4>
                                    {order.email && <div><Message msgId="heve.emailNotification"/>: {order.email}</div>}
                                </div>
                                <div>
                                    <div>
                                        {(order.status === 'InProduction' || order.status === 'Suspended') &&
                                            <div style={{width: 24, height: 24}}><div className="mapstore-medium-size-loader" /></div>
                                        }
                                        {(order.status === 'Completed' || order.status === 'Failed') &&
                                            <ButtonToolbar>
                                                <Button
                                                    bsSize="sm"
                                                    bsStyle="primary"
                                                    onClick={() => onRemove(order.id)}>
                                                    <Message msgId="heve.bRemove"/>
                                                </Button>
                                            </ButtonToolbar>
                                        }
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {exposure && exposure.length > 0 && <Body items={exposure} name="Exposures" order={order}/>}
                        {vulnerability && vulnerability.length > 0 && <Body items={vulnerability} name="Vulnerabilities" order={order}/>}
                        {idx !== orders.length - 1 &&
                        <Col xs={12}>
                            <hr />
                        </Col>}
                    </Row>
                );
            })}
        </Grid>
    );
};
