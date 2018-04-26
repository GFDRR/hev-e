/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {Col, FormGroup, FormControl, Grid, Row, Form} = require('react-bootstrap');
const localizeProps = require('../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const Filter = localizeProps('filterPlaceholder')(require('../ms2override/components/Filter'));

const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
module.exports = ({
    onSearchTextChange = () => { },
    searchText,
    onShowFilter = () => {},
    showFilter,
    onChangeSortType = () => {},
    sortType,
    sortOptions,
    searchFilter
}) =>(
    <Grid className="catalog-form" fluid>
        <Row>
            <Col xs={12} style={{padding: 10}}>
                {searchFilter && <Filter
                    filterText={searchText || ''}
                    filterPlaceholder="heve.textSearchPlaceholder"
                    onFilter={text => onSearchTextChange(text)} />}
            </Col>
            <Col xs={12}>
                <Form inline>
                    <FormGroup controlId="formInlineName" className="pull-right">
                        {sortOptions && <span>
                            <Message msgId="heve.sortBy" />: {' '}
                            <FormControl
                                componentClass="select"
                                value={sortType}
                                onChange={e => {
                                    onChangeSortType(e.target.value);
                                }}>
                                {sortOptions.map(option => (<option value={option.value}><Message msgId={'heve.' + option.label} /></option>))}
                            </FormControl>{' '}
                        </span>}
                        <Toolbar
                            btnDefaultProps={
                                {
                                    className: 'square-button-md',
                                    bsStyle: 'primary'
                                }
                            }
                            buttons={
                                [
                                    {
                                        glyph: 'filter',
                                        tooltipId: showFilter ? 'heve.hideFilters' : 'heve.showFilters',
                                        active: !!showFilter,
                                        onClick: () => {
                                            onShowFilter(!showFilter);
                                        }
                                    }
                                ]
                            }/>
                    </FormGroup>
                </Form>
            </Col>
        </Row>
    </Grid>
);
