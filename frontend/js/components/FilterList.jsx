/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {Grid, Row, Col, FormGroup, Checkbox} = require('react-bootstrap');

class FilterList extends React.Component {

    static propTypes = {
        enabled: PropTypes.bool,
        onChange: PropTypes.func,
        filter: PropTypes.object
    };

    static defaultProps = {
        enabled: false,
        onChange: () => {},
        filter: {}
    };

    render() {
        return this.props.enabled ? (
            <div className="et-filter">
                <Grid fluid>
                    <Row>
                        <Col xs={12}>
                            <h4>Filter by</h4>
                        </Col>
                    </Row>
                </Grid>
                {this.props.filter.categories && <Grid fluid>
                    <Row>
                        <br/>
                        <Col xs={12}>
                            <FormGroup>
                                <a href="#" className="text-hev-e-red">Clear</a>
                            </FormGroup>
                        </Col>
                    </Row>
                    {
                        this.props.filter.categories.map((category, categoryId) => (
                            <Row>
                                <Col xs={12}>
                                    <small><strong>{category.name}</strong></small>
                                </Col>
                                <Col xs={12}>
                                    <FormGroup>
                                    {
                                        category.datasetLayers && category.datasetLayers.map((dataset, datasetId) => (
                                            <span>
                                                <Checkbox
                                                    checked={dataset.checked}
                                                    onChange={() => {
                                                        this.props.onChange({
                                                            type: 'categories',
                                                            categoryId,
                                                            datasetId,
                                                            checked: !dataset.checked
                                                        });
                                                    }}>{dataset.name}</Checkbox>
                                                { dataset.availableFilters &&
                                                    <Grid fluid>
                                                        {
                                                            dataset.availableFilters.map((availableFilter, availableFilterId) => (
                                                                <Row>
                                                                    <Col xs={12}>
                                                                        <small><strong>{availableFilter.name}</strong></small>
                                                                    </Col>
                                                                    <Col xs={12}>
                                                                        <FormGroup>
                                                                        {
                                                                            availableFilter.filters && availableFilter.filters.map((filter, filterId) => (
                                                                                <Checkbox
                                                                                    checked={filter.checked}
                                                                                    disabled={!dataset.checked}
                                                                                    onChange={() => {
                                                                                        this.props.onChange({
                                                                                            type: 'categories',
                                                                                            categoryId,
                                                                                            datasetId,
                                                                                            availableFilterId,
                                                                                            filterId,
                                                                                            checked: !filter.checked
                                                                                        });
                                                                                    }}>{filter.name}</Checkbox>
                                                                            ))
                                                                        }
                                                                        </FormGroup>
                                                                    </Col>
                                                                </Row>
                                                            ))
                                                        }
                                                    </Grid>
                                                }
                                            </span>
                                        ))
                                    }
                                    </FormGroup>
                                </Col>
                            </Row>
                        ))
                    }
                </Grid>}
            </div>
        ) : null;
    }
}

module.exports = FilterList;
