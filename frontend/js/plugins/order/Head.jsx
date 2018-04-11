/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {Grid, Row, Col} = require('react-bootstrap');
const localizeProps = require('../../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Filter = localizeProps('filterPlaceholder')(require('../../ms2override/components/Filter'));

module.exports = ({
    filterText,
    onUpdateFilter = () => {}
}) => (
    <Grid
        fluid
        className="et-download-head"
        style={{width: '100%'}}>
        <Row>
            <Col xs={12}>
                <Filter
                    filterText={filterText || ''}
                    filterPlaceholder="heve.textOrderPlaceholder"
                    onFilter={text => onUpdateFilter(text)} />
            </Col>
        </Row>
    </Grid>
);
