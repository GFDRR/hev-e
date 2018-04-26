/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const ContainerDimensions = require('react-container-dimensions').default;
// const RelatedData = require('./RelatedData');

const layout = {
    exposures: require('./details/Exposures'),
    vulnerabilities: require('./details/Vulnerabilities'),
    hazards: require('./details/Hazards')
};

module.exports = props => {

    const Layout = props.currentDetails && props.currentDetails.dataset && layout[props.currentDetails.dataset] || layout[props.currentDataset];
    const filterName = props.currentDetails && props.currentDetails.properties && (props.currentDetails.properties.category || props.currentDetails.properties.hazard_type)
        || props.currentDetails && props.currentDetails.vulnerability_type;
    const name = props.currentDetails && props.currentDetails.properties && (props.currentDetails.properties.title || props.currentDetails.properties.name)
        || props.currentDetails && (props.currentDetails.title || props.currentDetails.name);
    const icon = props.groupInfo[filterName] && props.groupInfo[filterName].icon || '';

    return props.currentDetails ? (
        <ContainerDimensions>
        { ({width}) =>
            <div style={{
                position: 'relative',
                width: width,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'}}
                className="et-details">
                <ResizableModal
                    show
                    title={<span><i className={props.currentDetails && props.currentDetails.dataset === 'hazards' ? icon : 'fa fa-' + icon}/>&nbsp;<strong>{name}</strong></span>}
                    onClose={props.onClose}
                    clickOutEnabled={false}
                    showClose={!props.loading}
                    showLoading={props.loading}>
                    {Layout && <Layout {...props}/>}
                </ResizableModal>
                {/*<RelatedData
                    currentDetails={props.currentDetails}
                    onZoomTo={props.onZoomTo}
                    onShowDetails={props.onShowDetails}
                    showData={props.showRelatedData}
                onShowData={props.onShowRelatedData}/>*/}
            </div>
        }
        </ContainerDimensions>
    ) : null;
};
