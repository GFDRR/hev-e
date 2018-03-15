
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {/*Glyphicon,*/ Grid, Row, Col} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const ContainerDimensions = require('react-container-dimensions').default;
const sampleData = require('../../MapStore2/web/client/components/widgets/enhancers/sampleChartData');
const SimpleChart = sampleData(require('../../MapStore2/web/client/components/charts/SimpleChart'));
const FilterList = require('./FilterList');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const RelatedData = require('./RelatedData');
const DefaultWidget = require('../../MapStore2/web/client/components/widgets/widget/DefaultWidget');
const {head} = require('lodash');

const data = [
    {name: '2008', "Statistical Capacity score (Overall average)": 65.5555555555556},
    {name: '2009', "Statistical Capacity score (Overall average)": 63.3333333333333},
    {name: '2010', "Statistical Capacity score (Overall average)": 67.7777777777778},
    {name: '2011', "Statistical Capacity score (Overall average)": 72.2222222222222},
    {name: '2012', "Statistical Capacity score (Overall average)": 72.2222222222222},
    {name: '2013', "Statistical Capacity score (Overall average)": 72.2222222222222},
    {name: '2014', "Statistical Capacity score (Overall average)": 72.2222222222222},
    {name: '2015', "Statistical Capacity score (Overall average)": 75.5556},
    {name: '2016', "Statistical Capacity score (Overall average)": 73.3333666666667},
    {name: '2017', "Statistical Capacity score (Overall average)": 71.1111}
];

const series = [{dataKey: "Statistical Capacity score (Overall average)"}];
const xAxis = {dataKey: "name"};

class DataDetails extends React.Component {
    static propTypes = {
        currentDetails: PropTypes.object,
        onClose: PropTypes.func,
        onZoomTo: PropTypes.func,
        onShowDetails: PropTypes.func,
        onShowRelatedData: PropTypes.func,
        showRelatedData: PropTypes.bool,
        layout: PropTypes.object,
        layers: PropTypes.array
    };

    static defaultProps = {
        currentDetails: null,
        onClose: () => {},
        onZoomTo: () => {},
        onShowDetails: () => {},
        onShowRelatedData: () => {},
        showRelatedData: false,
        layers: [],
        layout: [
            /*{
                widgetType: 'text',
                text: "<p>Tanzania (/ˌtænzəˈniːə/),[12] officially the United Republic of Tanzania (Swahili: Jamhuri ya Muungano wa Tanzania), is a sovereign state in eastern Africa within the African Great Lakes region. It borders Kenya and Uganda to the north; Rwanda, Burundi, and the Democratic Republic of the Congo to the west; Zambia, Malawi, and Mozambique to the south; and the Indian Ocean to the east. Mount Kilimanjaro, Africa's highest mountain, is in north-eastern Tanzania. The United Nations estimated Tanzania's 2016 population at 55.57 million.[6] The population is composed of several ethnic, linguistic, and religious groups. Tanzania is a presidential constitutional republic and since 1996 its official capital city has been Dodoma where the president's office, the National Assembly, and some government ministries are located.[13] Dar es Salaam, the former capital, retains most government offices and is the country's largest city, principal port, and leading commercial centre.[14][15][16] Tanzania is a one party dominant state with the socialist-progressive Chama Cha Mapinduzi party in power.</p>"
            },
            {
                widgetType: 'chart'
            }*/
        ]
    };

    state = {};

    render() {
        return this.props.currentDetails ? (
            <ContainerDimensions>
            { ({width}) =>
                <div style={{
                    position: 'relative',
                    width: width,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'}}
                    className="et-details">
                    <ResizableModal
                        show
                        title={<span><i className={'fa fa-' + this.props.currentDetails.icon}/>&nbsp;{this.props.currentDetails.title}</span>}
                        onClose={this.props.onClose}>
                        <BorderLayout
                            header={
                                <Grid fluid style={{width: '100%'}}>
                                <Row>
                                    <Col xs={12}>
                                <Toolbar
                                    btnDefaultProps={
                                        {
                                            className: 'square-button-md',
                                            bsStyle: 'primary'
                                        }
                                    }
                                    buttons={[
                                        {
                                            glyph: 'filter',
                                            tooltipId: this.state.showFilter ? 'heve.hideFilters' : 'heve.showFilters',
                                            visible: this.props.currentDetails.caption === 'buildings',
                                            active: this.state.showFilter,
                                            onClick: () => {
                                                this.setState({
                                                    showFilter: !this.state.showFilter
                                                });
                                            }
                                        },
                                        {
                                            glyph: 'zoom-to',
                                            tooltipId: 'heve.zoomToLayer',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                const bbox = this.props.currentDetails && this.props.currentDetails.bbox || null;
                                                if (bbox) {
                                                    this.props.onZoomTo([...bbox], 'EPSG:4326');
                                                }
                                            }
                                        },
                                        {
                                            glyph: 'plus',
                                            visible: !head(this.props.layers.filter(layer => layer.id === this.props.currentDetails.title)),
                                            tooltipId: 'heve.addLayer'
                                        },
                                        {
                                            glyph: 'download',
                                            tooltipId: 'heve.addDownload'
                                        }
                                    ]}/>
                                    </Col>
                                </Row>
                            </Grid>
                            }
                            columns={[
                                <div style={{order: -1}}>
                                    <FilterList
                                        enabled={this.state.showFilter && this.props.currentDetails.caption === 'buildings'}
                                        filter={{
                                            categories: [
                                                {
                                                    "name": "Construction",
                                                    "datasetLayers": [
                                                        {
                                                            "name": "Masonry"
                                                        },
                                                        {
                                                            "name": "Concrete"
                                                        },
                                                        {
                                                            "name": "Steel Frame"
                                                        },
                                                        {
                                                            "name": "Composite"
                                                        },
                                                        {
                                                            "name": "Wood"
                                                        },
                                                        {
                                                            "name": "Earth"
                                                        },
                                                        {
                                                            "name": "Unknown"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "name": "Occupancy",
                                                    "datasetLayers": [
                                                        {
                                                            "name": "Residential"
                                                        },
                                                        {
                                                            "name": "Commercial"
                                                        },
                                                        {
                                                            "name": "Industrial"
                                                        },
                                                        {
                                                            "name": "Healthcare"
                                                        },
                                                        {
                                                            "name": "Education"
                                                        },
                                                        {
                                                            "name": "Government"
                                                        },
                                                        {
                                                            "name": "Unknown"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }}
                                        />
                                </div>
                            ]}>

                            <Grid fluid>
                                {
                                    this.props.layout.map((el, idx) => {
                                        return (
                                            <Row key={idx}>
                                                <Col xs={12}>
                                                    <DefaultWidget
                                                        {...el}/>
                                                </Col>
                                            </Row>
                                        );
                                    })
                                }
                                <br/>
                                <Row>
                                    <Col xs={12}>
                                        <p>Tanzania (/ˌtænzəˈniːə/),[12] officially the United Republic of Tanzania (Swahili: Jamhuri ya Muungano wa Tanzania), is a sovereign state in eastern Africa within the African Great Lakes region. It borders Kenya and Uganda to the north; Rwanda, Burundi, and the Democratic Republic of the Congo to the west; Zambia, Malawi, and Mozambique to the south; and the Indian Ocean to the east. Mount Kilimanjaro, Africa's highest mountain, is in north-eastern Tanzania. The United Nations estimated Tanzania's 2016 population at 55.57 million.[6] The population is composed of several ethnic, linguistic, and religious groups. Tanzania is a presidential constitutional republic and since 1996 its official capital city has been Dodoma where the president's office, the National Assembly, and some government ministries are located.[13] Dar es Salaam, the former capital, retains most government offices and is the country's largest city, principal port, and leading commercial centre.[14][15][16] Tanzania is a one party dominant state with the socialist-progressive Chama Cha Mapinduzi party in power.</p>
                                    </Col>
                                </Row>
                                <br/>
                                <Row>
                                    <Col xs={12}>
                                    <ContainerDimensions>
                                        { ({width: wChart}) =>
                                            <SimpleChart
                                                data={data}
                                                series={series}
                                                xAxis={xAxis}
                                                autoColorOptions={{
                                                    base: 176,
                                                    range: 0,
                                                    s: 0.82,
                                                    v: 0.73
                                                }}
                                                width={wChart - 40}
                                                type="bar"/>
                                        }
                                        </ContainerDimensions>
                                    </Col>
                                    </Row>
                            </Grid>
                        </BorderLayout>
                    </ResizableModal>
                    <RelatedData
                        currentDetails={this.props.currentDetails}
                        onZoomTo={this.props.onZoomTo}
                        onShowDetails={this.props.onShowDetails}
                        showData={this.props.showRelatedData}
                        onShowData={this.props.onShowRelatedData}/>
                </div>
            }
            </ContainerDimensions>
        ) : null;
    }
}

module.exports = DataDetails;
