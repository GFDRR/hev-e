
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const BorderLayout = require('../../../MapStore2/web/client/components/layout/BorderLayout');
const {Row, Col, Grid} = require('react-bootstrap');
const {head, isArray, join, isObject, isString} = require('lodash');

const {getItem} = require('../../utils/ItemsUtils');

const getValueFromObj = (obj, values) => {
    const names = Object.keys(obj);
    return names.map((name, idx) => (
        <div style={{paddingLeft: 10}}>
            <p>
                <small>Name: <strong>{name}</strong></small>
            </p>
            {values.filter(value => obj[name] && obj[name][value.code]).map(value => (<p>
                <small>{value.name}: {obj[name][value.code]}</small>
            </p>))}
            {idx < names.length - 1 && <hr/>}
        </div>
    ));
};

module.exports = ({
    layout,
    currentDetails,
    layerToolbar,
    currentDataset,
    availableFormats,
    groupInfo
}) => {

    const commonsLayout = layout && layout.commons || {};
    const vulnerabilityLayout = currentDetails && layout && layout[currentDetails.vulnerability_type]
        || currentDetails && layout && layout.vulnerability || {};
    const LayerToolbar = layerToolbar;
    const currentLayout = {...commonsLayout, ...vulnerabilityLayout};
    const order = vulnerabilityLayout.order || commonsLayout.order || Object.keys(currentLayout) && Object.keys(currentLayout).filter(key => key !== 'order');

    return (<BorderLayout
        header={
            <Grid fluid style={{ width: '100%' }}>
                <Row>
                    <Col xs={12}>
                        <LayerToolbar
                            item={{...getItem.vulnerabilities(currentDetails, groupInfo)}}
                            dataset={currentDataset}
                            showDownload
                            availableFormats={availableFormats} />
                    </Col>
                </Row>
            </Grid>
        }>
        <Grid fluid style={{width: '100%', paddingBottom: 30}}>
            {currentLayout && order
                .filter(key => isString(currentLayout[key]) || currentLayout[key] && head(currentLayout[key].filter(value => value && currentDetails[value.code])))
                .map(key => (
                <Row style={{paddingLeft: 20}}>
                    <Col xs={12}>
                        {!isString(currentLayout[key]) && <h3>{key}</h3>}
                        {isString(currentLayout[key]) && currentDetails[currentLayout[key]] && <h2>{key}{ ' ' + currentDetails[currentLayout[key]]}</h2>}
                    </Col>
                    {!isString(currentLayout[key]) && <Col xs={12}>
                        {currentLayout[key].filter(value => currentDetails[value.code]).map(value => (
                            <div style={{paddingLeft: 10}}>
                                <h5><strong>{value.name}</strong>:</h5>
                                <p>
                                    {
                                        isArray(currentDetails[value.code]) && join(currentDetails[value.code], ', ')
                                        || isObject(currentDetails[value.code]) && getValueFromObj(currentDetails[value.code], value.values || [])
                                        || !isObject(currentDetails[value.code]) && currentDetails[value.code]
                                    }
                                </p>
                                <hr/>
                            </div>
                        ))}
                    </Col>}
                </Row>
            ))}
        </Grid>
    </BorderLayout>);
};
