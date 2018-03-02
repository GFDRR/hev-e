/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const { Col, FormGroup, FormControl, Grid, Row, ButtonToolbar } = require('react-bootstrap');
const CatalogServiceSelector = require('../../MapStore2/web/client/components/catalog/CatalogServiceSelector');
const localizeProps = require('../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const SearchInput = localizeProps("placeholder")(FormControl);

const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
module.exports = ({
    onSearchTextChange = () => { },
    searchText,
    title,
    catalog,
    services,
    isValidServiceSelected,
    showCatalogSelector
}) =>(
    <Grid className="catalog-form" fluid>
        <Row>
            <Col xs={12}>
            <h4 className="text-center">{title}</h4>
            {
                showCatalogSelector ? (
                <FormGroup>
                    <CatalogServiceSelector servieces={services} catalog={catalog} isValidServiceSelected={isValidServiceSelected}/>
                </FormGroup>
                ) : null
            }
                <FormGroup controlId="catalog-form">
                    <SearchInput type="text" placeholder="catalog.textSearchPlaceholder" value={searchText} onChange={(e) => onSearchTextChange(e.currentTarget.value)}/>
                </FormGroup>
            </Col>
            <Col xs={12} className="text-center">
                <ButtonToolbar>
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
                                    text: <i className="fa fa-sort-alpha-asc"></i>,
                                    tooltip: '',
                                    active: true
                                },
                                {
                                    text: <i className="fa fa-sort-alpha-desc"></i>,
                                    tooltip: ''
                                }
                            ]
                        }/>

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
                                    text: <i className="fa fa-building"></i>,
                                    tooltip: 'Toggle buildings filter',
                                    active: true
                                },
                                {
                                    text: <i className="fa fa-road"></i>,
                                    tooltip: 'Toggle infrastructures filter',
                                    active: true
                                },
                                {
                                    text: <i className="fa fa-leaf"></i>,
                                    tooltip: 'Toggle agronomic filter',
                                    active: true
                                },
                                {
                                    text: <i className="fa fa-users"></i>,
                                    tooltip: 'Toggle social filter',
                                    active: true
                                }
                            ]
                        }/>
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
                                    text: <i className="fa fa-filter"></i>,
                                    tooltip: 'Advanced filter'
                                }
                            ]
                        }/>
                </ButtonToolbar>
            </Col>
        </Row>
    </Grid>
);
