/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const { Col, FormGroup, FormControl, Grid, Row, ButtonToolbar} = require('react-bootstrap');
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
    showCatalogSelector,
    onShowFilter = () => {},
    showFilter
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
                <ButtonToolbar className="pull-right">
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
                                        tooltip: 'Advanced filter',
                                        active: !!showFilter,
                                        onClick: () => {
                                            onShowFilter(!showFilter);
                                        }
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
                </ButtonToolbar>
            </Col>
        </Row>
    </Grid>
);
