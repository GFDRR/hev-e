
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {Glyphicon, Grid, Row, Col} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const ContainerDimensions = require('react-container-dimensions').default;
const sampleData = require('../../MapStore2/web/client/components/widgets/enhancers/sampleChartData');
const SimpleChart = sampleData(require('../../MapStore2/web/client/components/charts/SimpleChart'));

class DataDetails extends React.Component {
    static propTypes = {
        relatedCards: PropTypes.array,
        currentDetails: PropTypes.object,
        onClose: PropTypes.func
    };

    static defaultProps = {
        currentDetails: null,
        relatedCards: [
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            }
        ],
        onClose: () => {}
    };

    render() {
        return this.props.currentDetails ? (
            <ContainerDimensions>
            { ({width}) =>
                <div style={{
                    position: 'relative',
                    width: width,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'}}>
                    <ResizableModal
                        show
                        title={<span><Glyphicon glyph="info-sign"/>&nbsp;Tanzania {/*this.props.currentDetails.title*/}</span>}
                        onClose={this.props.onClose}>
                        {/**/}
                        <Grid fluid>
                            <br/>
                            <Row>
                                <Col xs={12}>
                                    <p>
                                    Tanzania (/ˌtænzəˈniːə/),[12] officially the United Republic of Tanzania (Swahili: Jamhuri ya Muungano wa Tanzania), is a sovereign state in eastern Africa within the African Great Lakes region. It borders Kenya and Uganda to the north; Rwanda, Burundi, and the Democratic Republic of the Congo to the west; Zambia, Malawi, and Mozambique to the south; and the Indian Ocean to the east. Mount Kilimanjaro, Africa's highest mountain, is in north-eastern Tanzania.

The United Nations estimated Tanzania's 2016 population at 55.57 million.[6] The population is composed of several ethnic, linguistic, and religious groups.

Tanzania is a presidential constitutional republic and since 1996 its official capital city has been Dodoma where the president's office, the National Assembly, and some government ministries are located.[13] Dar es Salaam, the former capital, retains most government offices and is the country's largest city, principal port, and leading commercial centre.[14][15][16] Tanzania is a one party dominant state with the socialist-progressive Chama Cha Mapinduzi party in power.
                                    </p>
                                </Col>
                            </Row>
                            <br/>
                            <Row>
                                <Col xs={12}>
                                    <SimpleChart type="bar"/>
                                </Col>
                            </Row>
                        </Grid>
                    </ResizableModal>
                    <div className="et-related-head">
                        <h4>Related data</h4>
                    </div>
                    <div className="et-related-list">
                        <div className="et-related-list-container">
                        {
                            this.props.relatedCards.map((card, idx) => {
                                return (
                                    <div key={idx} className="ms-square-card">
                                        <div className="ms-square-card-container">
                                            <div className="ms-top-card">
                                                <h5>{card.title}</h5>
                                                <Glyphicon glyph="info-sign"/>
                                            </div>
                                            <div className="ms-preview-card">
                                                {card.preview}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                        </div>
                    </div>
                </div>
            }
            </ContainerDimensions>
        ) : null;
    }
}

module.exports = DataDetails;
