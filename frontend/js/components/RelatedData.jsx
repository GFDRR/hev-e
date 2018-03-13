/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {Nav, NavItem, Grid, Col, Row, Button, Glyphicon} = require('react-bootstrap');
const tooltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ButtonT = tooltip(Button);

const CompactCatalog = require('../../MapStore2/web/client/components/catalog/CompactCatalog');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const Message = require('../../MapStore2/web/client/components/I18N/Message');

class RelatedData extends React.Component {
    static propTypes = {
        onClose: PropTypes.func,
        onZoomTo: PropTypes.func,
        onShowDetails: PropTypes.func,
        showData: PropTypes.bool,
        onShowData: PropTypes.func,
        currentDetails: PropTypes.object
    };

    static defaultProps = {
        onClose: () => {},
        onZoomTo: () => {},
        onShowDetails: () => {},
        showData: false,
        onShowData: () => {},
        currentDetails: null
    };

    state = {};

    render() {
        const className = this.props.showData ? ' et-show' : ' et-hide';
        return (
            <div className={'et-related-data' + className}>
                <Grid fluid style={{padding: 0, display: 'flex', flexDirection: 'column', height: '100%'}}>
                {this.props.showData ? <Row className="ms-header" style={{paddingBottom: 15}}>
                        <Col xs={2}>
                            {this.props.showData && <ButtonT
                                className="square-button no-border"
                                tooltipId="heve.backToLayer"
                                tooltipPosition="right"
                                bsStyle="primary"
                                onClick={() => {
                                    this.props.onShowData(false);
                                }}>
                                <Glyphicon glyph="undo"/>
                            </ButtonT>}
                        </Col>
                        <Col xs={8} className="text-center">
                            {this.props.currentDetails && this.props.currentDetails.title && <h3>Data related to: <a href="#" onClick={() => {
                                this.props.onShowData(false);
                            }}><strong>{this.props.currentDetails.title}</strong></a></h3>}
                        </Col>
                        <Col xs={2}/>
                    </Row> : <Row className="ms-header">
                        <Col xs={2}/>
                        <Col xs={8} className="text-center et-btn-row">
                            <Button
                                onClick={() => {
                                    this.props.onShowData(true);
                                }}>
                                <h4><Message msgId="heve.releatedDataInterested"/></h4>
                            </Button>
                        </Col>
                        <Col xs={2}/>
                    </Row>}
                    <Row>
                        <Col xs={12}>
                            <Nav bsStyle="tabs" activeKey="exposures" justified>
                                <NavItem eventKey="hazards" ><Message msgId="heve.hazards"/></NavItem>
                                <NavItem eventKey="exposures" ><Message msgId="heve.exposures"/></NavItem>
                                <NavItem eventKey="vulnerabilities" ><Message msgId="heve.vulnerabilities"/></NavItem>
                            </Nav>
                        </Col>
                    </Row>
                    {this.props.showData && <CompactCatalog
                        catalog= {{
                            url: 'okok',
                            type: 'hev-e',
                            title: 'HEV-E',
                            autoload: true
                        }}
                        getCustomItem={
                            item => ({
                                title: <span>{item.title}</span>,
                                description: <span>{item.description}</span>,
                                caption: <span>{item.caption}</span>,
                                preview: item.icon ? <i className={'fa fa-4x text-center fa-' + item.icon}></i> : null,
                                onMouseEnter: () => {},
                                onMouseLeave: () => {},
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
                                        }
                                    ]}/>
                            })
                        }/>}
                </Grid>
            </div>
        );
    }
}


module.exports = RelatedData;
