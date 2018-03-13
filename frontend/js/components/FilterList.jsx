/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {head} = require('lodash');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {Grid, Row, Col, FormGroup, Checkbox} = require('react-bootstrap');

class FilterList extends React.Component {

    static propTypes = {
        enabled: PropTypes.bool,
        onChange: PropTypes.func,
        filter: PropTypes.object,
        type: PropTypes.string
    };

    static defaultProps = {
        enabled: false,
        onChange: () => {},
        filter: {},
        type: 'categories'
    };

    render() {
        const hasFilter = this.props.filter[this.props.type] && this.hasFilter(this.props.filter[this.props.type]);
        return this.props.enabled ? (
            <div className="et-filter">
                <Grid fluid>
                    <Row>
                        <Col xs={12}>
                            <h4><Message msgId="heve.filterBy"/></h4>
                        </Col>
                    </Row>
                </Grid>
                {this.props.filter[this.props.type] && <Grid fluid>
                    <Row>
                        <br/>
                        <Col xs={12}>
                            { hasFilter && <FormGroup>
                                <a
                                    href="#"
                                    className="text-hev-e-primary"
                                    onClick={() => {
                                        this.props.onChange({
                                            type: 'categories',
                                            clear: true
                                        });
                                    }}><Message msgId="heve.clearAll"/></a>
                            </FormGroup>}
                        </Col>
                    </Row>
                    {
                        this.props.filter[this.props.type].map((category, categoryId) => (

                            <Row key={categoryId}>
                                <Col xs={12}>
                                    <small>{category.icon && <span><i className={'fa fa-' + category.icon}/>{' '}</span>}<strong>{category.name}</strong></small>
                                </Col>
                                <Col xs={12}>
                                    <FormGroup>
                                    {
                                        category.datasetLayers && category.datasetLayers.map((dataset, datasetId) => (
                                            <Checkbox
                                                key={datasetId}
                                                checked={dataset.checked || false}
                                                onChange={() => {
                                                    this.props.onChange({
                                                        type: 'categories',
                                                        categoryId,
                                                        datasetId,
                                                        checked: !dataset.checked
                                                    });
                                                }}>
                                                <span style={
                                                    {
                                                        borderBottom: dataset.checked && dataset.color
                                                            ? '2px solid ' + dataset.color
                                                            : '2px solid transparent',
                                                        display: 'inline-block'
                                                    }
                                                }>{dataset.name}</span>
                                            </Checkbox>
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

    hasFilter(filter) {
        return head(filter.map(group => group.datasetLayers && head(group.datasetLayers.filter(filt => filt.checked)) || null ).filter(val => val));
    }
}

module.exports = FilterList;
