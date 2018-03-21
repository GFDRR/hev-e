
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
const RelatedData = require('./RelatedData');
const DefaultWidget = require('../../MapStore2/web/client/components/widgets/widget/DefaultWidget');
const LayerToolbar = require('./LayerToolbar');
const {truncate, isString, head} = require('lodash');

const CustomizedAxisTick = class DataDetails extends React.Component {
    render() {
        const {x, y, payload} = this.props;
        return (
            <g transform={`translate(${x},${y})`}>
                <title>{payload.value}</title>
                <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">{payload.value && isString(payload.value) && truncate(payload.value, {length: 11}) || ''}</text>
            </g>
        );
    }
};

const data = [
    [5, 4, 1, 30, 10, 20, 30],
    [50, 10, 4, 1, 1, 4, 30]
];

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
        filterList: PropTypes.node,
        currentTaxonomy: PropTypes.object
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
        filterList: FilterListComponent,
        currentTaxonomy: {}
    };

    state = {};

    getData(group, idx) {
        const hasFilter = this.hasFilter(group);
        return group.filters && group.filters.filter(val => !hasFilter || (hasFilter && val.checked)).map((filter, j) => {
            return {
                [group.name]: data[idx][j],
                name: filter.name,
                style: {
                    fill: group.style === group.styleChecked ? filter.color : '#21bab0'
                }
            };
        }) || [];
    }

    render() {
        const FilterList = this.props.filterList;
        const category = this.props.currentDetails && this.props.currentDetails.properties && this.props.currentDetails.properties.category;
        const taxonomy = this.props.currentTaxonomy[category];
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
                                        <LayerToolbar
                                            item={{...this.props.currentDetails}}
                                            layers={this.props.layers}
                                            showDownload
                                            showFilter
                                            activeFilter={this.state.showFilter}
                                            onToggleFilter={() => {
                                                this.setState({
                                                    showFilter: !this.state.showFilter
                                                });
                                            }}
                                            onZoomTo={this.props.onZoomTo}
                                            onRemoveLayer={this.props.onRemove}
                                            onAddLayer={this.props.onAddLayer}/>
                                    </Col>
                                </Row>
                            </Grid>
                            }
                            columns={[
                                <div style={{order: -1}}>
                                    <FilterList
                                        enabled={this.state.showFilter && this.props.currentDetails.properties && this.props.currentDetails.properties.category === 'buildings'}
                                        type={this.props.currentDetails.properties && this.props.currentDetails.properties.category}
                                        hasStyle
                                        typeOfAction="taxonomy"/>
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
                                        <h3 className="text-center">Occupance %</h3>
                                    </Col>
                                    {taxonomy && taxonomy.map((group, idx) =>
                                        <Col xs={12} style={{marginBottom: 40}}>
                                            <h4 className="text-center" style={{textDecoration: 'underline'}}>{group.name}</h4>
                                            <ContainerDimensions>
                                                { ({width: wChart}) =>
                                                    <SimpleChart
                                                        data={this.getData(group, idx)}
                                                        type="bar"
                                                        legend={false}
                                                        series={{dataKey: group.name, isAnimationActive: false}}
                                                        xAxis={{dataKey: 'name', tick: <CustomizedAxisTick/>, interval: 0}}
                                                        width={wChart - 40}
                                                        colorGenerator={() => ['#21bab0']}/>
                                                }
                                            </ContainerDimensions>
                                        </Col>
                                    )}
                                    <hr />
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

    hasFilter(group) {
        return head(group.filters.filter(filt => filt.checked));
    }
}

module.exports = DataDetails;
