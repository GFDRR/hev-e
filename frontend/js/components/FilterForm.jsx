/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const {Col, FormGroup, FormControl, Grid, Row, Form} = require('react-bootstrap');
const CatalogServiceSelector = require('../../MapStore2/web/client/components/catalog/CatalogServiceSelector');
const localizeProps = require('../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
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
    showFilter,
    onChangeSortType = () => {},
    sortType,
    sortOptions = [
        {
            value: 'alphabeticalAToZ'
        },
        {
            value: 'alphabeticalZToA'
        }
    ]
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
                    <SearchInput type="text" placeholder="heve.textSearchPlaceholder" value={searchText} onChange={(e) => onSearchTextChange(e.currentTarget.value)}/>
                </FormGroup>
            </Col>
            <Col xs={12}>
                <Form inline>
                    <FormGroup controlId="formInlineName" className="pull-right">
                        <span><Message msgId="heve.sortBy" />: </span>{' '}
                        <FormControl
                            componentClass="select"
                            value={sortType}
                            onChange={e => {
                                onChangeSortType(e.target.value);
                            }}>
                            {sortOptions.map(option => (<option value={option.value}><Message msgId={'heve.' + option.value} /></option>))}
                        </FormControl>{' '}
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
