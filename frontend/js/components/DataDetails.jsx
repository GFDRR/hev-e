
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
        currentTaxonomy: PropTypes.object,
        onAddDownload: PropTypes.func,
        downloads: PropTypes.array,
        bbox: PropTypes.object,
        loading: PropTypes.bool
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
        layout: {
            buildings: [{
                name: 'counts'
            }]
        },
        filterList: FilterListComponent,
        currentTaxonomy: {},
        onAddDownload: () => {},
        downloads: [],
        bbox: {},
        loading: false
    };

    state = {};

    getData(group, idx, data) {
        const hasFilter = this.hasFilter(group);
        return group.filters && group.filters.filter(val => !hasFilter || (hasFilter && val.checked)).map(filter => {
            return {
                [group.name]: data[filter.name.toLowerCase()] ? data[filter.name.toLowerCase()] : 0,
                name: filter.name,
                style: {
                    fill: group.style === group.styleChecked ? filter.color : '#333333' // '#21bab0'
                }
            };
        }) || [];
    }

    render() {
        const FilterList = this.props.filterList;
        const category = this.props.currentDetails && this.props.currentDetails.properties && this.props.currentDetails.properties.category;
        const taxonomy = this.props.currentTaxonomy[category];
        const properties = this.props.currentDetails && this.props.currentDetails.properties;
        const taxonomyObj = {taxonomy};
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
                        onClose={this.props.onClose}
                        clickOutEnabled={false}>
                        <BorderLayout
                            footer={
                                <div style={{width: 24, height: 24, padding: 4, margin: 4}}>
                                    {this.props.loading && <div className="mapstore-small-size-loader" />}
                                </div>
                            }
                            header={
                                <Grid fluid style={{width: '100%'}}>
                                <Row>
                                    <Col xs={12}>
                                        <LayerToolbar
                                            item={{...this.props.currentDetails, ...taxonomyObj, icon: this.props.groupInfo[this.props.currentDetails.properties.category].icon}}
                                            layers={this.props.layers}
                                            downloads={this.props.downloads}
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
                                            onAddLayer={this.props.onAddLayer}
                                            onAddDownload={this.props.onAddDownload}
                                            mapBbox={this.props.bbox}/>
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
                                <Row>
                                    <Col xs={12}>
                                        <p>{this.props.currentDetails && this.props.currentDetails.properties && this.props.currentDetails.properties.description}</p>
                                    </Col>
                                </Row>
                                <br/>
                                {
                                    this.props.layout && this.props.layout[category] && this.props.layout[category].map(section => {
                                        return !(properties && properties[section.name]) ? null : (
                                            <Row>
                                                <Col xs={12}>
                                                    <h3 className="text-center">{properties[section.name].name}</h3>
                                                </Col>
                                                {taxonomy && taxonomy.map((group, idx) =>
                                                    <Col xs={12} style={{marginBottom: 40}}>
                                                        <h4 className="text-center" style={{textDecoration: 'underline'}}>{group.name}</h4>
                                                        <ContainerDimensions>
                                                            { ({width: wChart}) =>
                                                                <SimpleChart
                                                                    data={this.getData(group, idx, properties[section.name].data[group.code])}
                                                                    type="bar"
                                                                    legend={false}
                                                                    series={{dataKey: group.name, isAnimationActive: false}}
                                                                    xAxis={{dataKey: 'name', tick: <CustomizedAxisTick/>, interval: 0}}
                                                                    width={wChart - 40}
                                                                    colorGenerator={() => ['#333333']}/>
                                                            }
                                                        </ContainerDimensions>
                                                    </Col>
                                                )}
                                                <hr />
                                            </Row>
                                        );
                                    })
                                }
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
