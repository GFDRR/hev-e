/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {Grid, Row, Col} = require('react-bootstrap');
const ContainerDimensions = require('react-container-dimensions').default;
const sampleData = require('../../../MapStore2/web/client/components/widgets/enhancers/sampleChartData');
const SimpleChart = sampleData(require('../../../MapStore2/web/client/components/charts/SimpleChart'));
const BorderLayout = require('../../../MapStore2/web/client/components/layout/BorderLayout');
const {truncate, isString, head} = require('lodash');
const {withState} = require('recompose');
const {getItem} = require('../../utils/ItemsUtils');

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

const hasFilter = group => head(group.filters.filter(filt => filt.checked));

const getData = (group, idx, data) => {
    const checkedFilter = hasFilter(group);
    return group.filters && group.filters.filter(val => !checkedFilter || (checkedFilter && val.checked)).map(filter => {
        return {
            [group.name]: data[filter.name.toLowerCase()] ? data[filter.name.toLowerCase()] : 0,
            name: filter.name,
            style: {
                fill: group.style === group.styleChecked ? filter.color : '#333333' // '#21bab0'
            }
        };
    }) || [];
};

module.exports = withState('showFilter', 'onToggleFilter', true)(({
    filterList,
    currentDetails,
    currentTaxonomy,
    groupInfo,
    currentDataset,
    showFilter,
    onToggleFilter,
    bbox,
    availableFormats,
    layout,
    layerToolbar
}) => {

    const FilterList = filterList;
    const category = currentDetails && currentDetails.properties && currentDetails.properties.category;
    const taxonomy = currentTaxonomy[category];
    const properties = currentDetails && currentDetails.properties;
    const taxonomyObj = {taxonomy};
    const LayerToolbar = layerToolbar;
    return (<BorderLayout
        header={
            <Grid fluid style={{ width: '100%' }}>
                <Row>
                    <Col xs={12}>
                        <LayerToolbar
                            item={{
                                ...getItem.exposures(currentDetails, groupInfo),
                                ...taxonomyObj,
                                geometry: currentDetails.geometry && {...currentDetails.geometry}
                            }}
                            dataset={currentDataset}
                            showDownload
                            showFilter
                            showZoomTo
                            activeFilter={showFilter}
                            onToggleFilter={() => onToggleFilter(!showFilter)}
                            mapBbox={bbox}
                            availableFormats={availableFormats} />
                    </Col>
                </Row>
            </Grid>
        }
        columns={[
            <div style={{ order: -1 }}>
                {FilterList && <FilterList
                    enabled={showFilter && currentDetails.properties && currentDetails.properties.category === 'buildings'}
                    type={currentDetails.properties && currentDetails.properties.category}
                    hasStyle
                    typeOfAction="taxonomy" />}
            </div>
        ]}>

        <Grid fluid>
            <Row>
                <Col xs={12}>
                    <p>{currentDetails && currentDetails.properties && currentDetails.properties.description}</p>
                </Col>
            </Row>
            <br />
            {
                layout && layout[category] && layout[category].map(section => {
                    return !(properties && properties[section.name]) ? null : (
                        <Row>
                            <Col xs={12}>
                                <h3 className="text-center">{properties[section.name].name}</h3>
                            </Col>
                            {taxonomy && taxonomy.map((group, idx) =>
                                <Col xs={12} style={{ marginBottom: 40 }}>
                                    <h4 className="text-center" style={{ textDecoration: 'underline' }}>{group.name}</h4>
                                    <ContainerDimensions>
                                        {({ width: wChart }) =>
                                            <SimpleChart
                                                data={getData(group, idx, properties[section.name].data[group.code])}
                                                type="bar"
                                                legend={false}
                                                series={{ dataKey: group.name, isAnimationActive: false }}
                                                xAxis={{ dataKey: 'name', tick: <CustomizedAxisTick />, interval: 0 }}
                                                width={wChart - 40}
                                                colorGenerator={() => ['#333333']} />
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
    </BorderLayout>);
});
