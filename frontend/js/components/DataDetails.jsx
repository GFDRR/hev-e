
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
const FilterListComponent = require('./FilterList');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const RelatedData = require('./RelatedData');
const DefaultWidget = require('../../MapStore2/web/client/components/widgets/widget/DefaultWidget');
const {head} = require('lodash');

const data = [
    {name: 'Residential', "Occupancy": 50},
    {name: 'Commercial', "Occupancy": 10},
    {name: 'Industrial', "Occupancy": 4},
    {name: 'Health Care', "Occupancy": 1},
    {name: 'Education', "Occupancy": 1},
    {name: 'Government', "Occupancy": 4},
    {name: 'Unknown', "Occupancy": 30}
];

const series = [{dataKey: "Occupancy"}];
const xAxis = {dataKey: "name"};

const dataA = [
    {name: 'Masonry', "Construction": 20},
    {name: 'Concrete', "Construction": 30},
    {name: 'Steel Frame', "Construction": 1},
    {name: 'Composite', "Construction": 4},
    {name: 'Wood', "Construction": 5},
    {name: 'Earth', "Construction": 10},
    {name: 'Unknown', "Construction": 30}
];

const seriesA = [{dataKey: "Construction"}];
const xAxisA = {dataKey: "name"};

class DataDetails extends React.Component {
    static propTypes = {
        currentDetails: PropTypes.object,
        onClose: PropTypes.func,
        onZoomTo: PropTypes.func,
        onShowDetails: PropTypes.func,
        onShowRelatedData: PropTypes.func,
        showRelatedData: PropTypes.bool,
        onAddLayer: PropTypes.func,
        onRemove: PropTypes.func,
        layout: PropTypes.object,
        layers: PropTypes.array,
        groupInfo: PropTypes.object,
        filterList: PropTypes.node
    };

    static defaultProps = {
        currentDetails: null,
        onClose: () => {},
        onZoomTo: () => {},
        onShowDetails: () => {},
        onShowRelatedData: () => {},
        onAddLayer: () => {},
        onRemove: () => {},
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
        ],
        filterList: FilterListComponent
    };

    state = {};

    render() {
        const FilterList = this.props.filterList;
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
                        title={<span><i className={'fa fa-' + this.props.groupInfo[this.props.currentDetails.properties.category].icon}/>&nbsp;<strong>{this.props.currentDetails.properties.name}</strong></span>}
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
                                            visible: this.props.currentDetails.properties && this.props.currentDetails.properties.category === 'buildings',
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
                                                const coordinates = this.props.currentDetails && this.props.currentDetails.geometry && this.props.currentDetails.geometry.coordinates;
                                                if (coordinates) {
                                                    const bbox = [...coordinates[0][0], ...coordinates[0][2]];
                                                    this.props.onZoomTo([...bbox], 'EPSG:4326');
                                                }
                                            }
                                        },
                                        {
                                            glyph: 'trash',
                                            visible: !!head(this.props.layers.filter(layer => layer.id === this.props.currentDetails.properties.name)),
                                            tooltipId: 'heve.removeLayer',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                const id = this.props.currentDetails.properties && this.props.currentDetails.properties.name;
                                                this.props.onRemove(id);
                                            }
                                        },
                                        {
                                            glyph: 'plus',
                                            visible: !head(this.props.layers.filter(layer => layer.id === this.props.currentDetails.properties.name)),
                                            tooltipId: 'heve.addLayer',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                const coordinates = this.props.currentDetails && this.props.currentDetails.geometry && this.props.currentDetails.geometry.coordinates;
                                                const bbox = [...coordinates[0][0], ...coordinates[0][2]];
                                                this.props.onAddLayer({
                                                    type: 'wms',
                                                    url: this.props.currentDetails.properties.wms_url,
                                                    visibility: true,
                                                    name: this.props.currentDetails.properties.name,
                                                    title: this.props.currentDetails.properties.title,
                                                    description: this.props.currentDetails.properties.description,
                                                    group: 'toc_layers',
                                                    bbox: {
                                                    crs: 'EPSG:4326',
                                                    bounds: {
                                                        minx: bbox[0],
                                                        miny: bbox[1],
                                                        maxx: bbox[2],
                                                        maxy: bbox[3]
                                                    }
                                                    },
                                                    id: this.props.currentDetails.properties.name,
                                                    record: {...this.props.currentDetails}
                                                });
                                            }
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
                                        enabled={this.state.showFilter && this.props.currentDetails.properties && this.props.currentDetails.properties.category === 'buildings'}
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
                                        <p>{this.props.currentDetails && this.props.currentDetails.properties && this.props.currentDetails.properties.description}</p>
                                    </Col>
                                </Row>
                                <br/>
                                <Row>
                                    <Col xs={12}>
                                        <h4><strong>Occupance %</strong></h4>
                                    </Col>
                                    <Col xs={12}>
                                    <ContainerDimensions>
                                        { ({width: wChart}) =>
                                            <SimpleChart
                                                data={dataA}
                                                series={seriesA}
                                                xAxis={xAxisA}
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
