/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const { Grid, Row, Col, Form, FormGroup, FormControl: FormControlB, InputGroup, Glyphicon } = require('react-bootstrap');
const localizeProps = require('../../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Filter = localizeProps('filterPlaceholder')(require('../../ms2override/components/Filter'));
const FormControl = localizeProps('placeholder')(FormControlB);
const Toolbar = require('../../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const Message = require('../../../MapStore2/web/client/components/I18N/Message');
const ResizableModal = require('../../../MapStore2/web/client/components/misc/ResizableModal');
const validateEmail = email => email && /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(String(email).toLowerCase());
const {withState} = require('recompose');

const onlyVulnerabilities = downloads => {
    const filteredDownloads = downloads && downloads.filter(download => download && download.vulnerabilities);
    return filteredDownloads && filteredDownloads.length === 1 && downloads.length === 1;
};

module.exports = withState('showModal', 'onShowModal', null)(({
    onUpdateFilter = () => {},
    downloads = [],
    filterText,
    email,
    onUpdateEmail,
    restoreDownloads,
    onRemoveDownload = () => {},
    format,
    onSelectType = () => {},
    downloadOptions = [
        {
            value: 'single',
            label: 'single'
        },
        {
            value: 'package',
            label: 'package'
        }
    ],
    onDownload = () => {},
    onShowModal = () => {},
    showModal,
    loading
}) => (
    <Grid className="et-download-head" fluid style={{ width: '100%' }}>
        <Row>
            <Col xs={12}>
                <Filter
                    filterText={filterText || ''}
                    filterPlaceholder="heve.textSearchPlaceholder"
                    disabled={!downloads || downloads.length === 0 || loading}
                    onFilter={text => onUpdateFilter(text)} />
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <Form inline>
                    <FormGroup
                        validationState={email && validateEmail(email) && 'success' || email && !validateEmail(email) && 'error'}
                        className="mapstore-filter"
                        style={{ width: '100%' }}>
                        <InputGroup>
                            <FormControl
                                disabled={!downloads || downloads.length === 0 || loading}
                                placeholder="heve.email"
                                value={email}
                                type="text"
                                onChange={e => onUpdateEmail(e.target.value)} />
                            <InputGroup.Addon>@</InputGroup.Addon>
                        </InputGroup>
                    </FormGroup>
                </Form>
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <Form inline>
                    <FormGroup controlId="formInlineName" className="pull-left">
                        <Toolbar
                            btnDefaultProps={{ className: 'square-button-md no-border' }}
                            buttons={
                                [
                                    {
                                        glyph: 'undo',
                                        tooltipId: 'heve.restoreLastChanges',
                                        visible: !!restoreDownloads,
                                        onClick: e => {
                                            e.stopPropagation();
                                            onRemoveDownload('restore');
                                        }
                                    }
                                ]
                            } />
                    </FormGroup>
                    <FormGroup controlId="formInlineName" className="pull-right">
                        <span><Message msgId="heve.downloadFormat" /></span>: {' '}
                        <FormControl
                            disabled={!downloads || downloads.length === 0 || loading}
                            componentClass="select"
                            disabled={onlyVulnerabilities(downloads)}
                            value={format}
                            onChange={e => onSelectType(e.target.value)}>
                            {downloadOptions.map(option => (<option value={option.value}><Message msgId={'heve.' + option.label} /></option>))}
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
                                        glyph: 'trash',
                                        tooltipId: 'heve.removeAll',
                                        disabled: !downloads || downloads.length === 0 || loading,
                                        onClick: () => {
                                            onRemoveDownload('all');
                                        }
                                    },
                                    {
                                        glyph: 'download',
                                        tooltipId: 'heve.downloadAll',
                                        disabled: !downloads || downloads.length === 0 || loading,
                                        onClick: () => {
                                            if (email && !validateEmail(email)) {
                                                onShowModal(downloads);
                                            } else {
                                                onDownload(downloads);
                                            }
                                        }
                                    }
                                ]
                            } />
                    </FormGroup>
                </Form>
            </Col>
        </Row>
        <span className="et-download-modal-alert">
            <ResizableModal
                size="sm"
                title={<Glyphicon className="text-danger" glyph="exclamation-mark"/>}
                show ={showModal}
                onClose={() => {
                    onShowModal(null);
                }}
                buttons={[
                    {
                        text: 'Download',
                        onClick: () => {
                            onDownload(downloads);
                        }
                    }
                ]}>
                <Grid fluid>
                    <Row>
                        <Col xs={12} className="text-center">
                            <p><Message msgId="heve.invalidEmailA"/></p>
                            <p><Message msgId="heve.invalidEmailB"/></p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} className="text-center">
                            <h3><strong>{email}</strong></h3>
                        </Col>
                    </Row>
                </Grid>
            </ResizableModal>
        </span>
    </Grid>
));
