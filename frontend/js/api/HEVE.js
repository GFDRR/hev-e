/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const axios = require('../../MapStore2/web/client/libs/ajax');
const urlUtil = require('url');
const assign = require('object-assign');
const {join} = require('lodash');

const parseUrl = url => {
    const parsed = urlUtil.parse(url, true);
    return urlUtil.format(assign({}, parsed, {search: null}, {
        query: assign({}, parsed.query, {request: undefined})
    }));
};

const Api = {
    exposures: ({catalogURL, page, maxRecords, searchText, sortBy, groupInfo, bboxFilter}) => {
        return new Promise((resolve) => {
            const hasFilter = groupInfo && Object.keys(groupInfo).filter(key => groupInfo[key].checked).map(key => groupInfo[key] && groupInfo[key].code);
            const bboxObj = bboxFilter ? {bbox: bboxFilter} : {};
            const categoryObj = hasFilter.length > 0 ? {category: join(hasFilter, ',')} : {};
            const searchObj = searchText ? {search: searchText} : {};
            const sortByObj = sortBy ? {ordering: sortBy} : {};

            resolve(axios.get(parseUrl(catalogURL), {
                params: {
                    page: page + 1,
                    page_size: maxRecords,
                    format: 'json',
                    ...sortByObj,
                    ...searchObj,
                    ...bboxObj,
                    ...categoryObj
                }
            }).then((response) => {
                const records = response.data && response.data.features || null;
                const numberOfRecordsMatched = response.data && response.data.count || 0;
                if (records) {
                    return {
                        numberOfRecordsMatched,
                        numberOfRecordsReturned: records.length,
                        records
                    };
                }
                return {
                    numberOfRecordsMatched: 0,
                    numberOfRecordsReturned: 0,
                    records: []
                };
            })
            .catch(() => ({
                numberOfRecordsMatched: 0,
                numberOfRecordsReturned: 0,
                records: []
            })));
        });
    },
    vulnerabilities: ({catalogURL, page, maxRecords, groupInfo, bboxFilter, categoryParams}) => {

        return new Promise((resolve) => {

            const bboxObj = bboxFilter ? {bbox: bboxFilter} : {};

            const categoryFilterObj = categoryParams.reduce((params, param) => {
                const hasFilter = groupInfo && Object.keys(groupInfo)
                .filter(key => groupInfo[key].param === param && groupInfo[key].checked)
                .reduce((values, key) =>
                    [...values, ...(groupInfo[key] && groupInfo[key].values && groupInfo[key].values.map(value => value.code)
                    || groupInfo[key] && groupInfo[key].code && [groupInfo[key].code])],
                []);
                return {
                    ...params,
                    ...(hasFilter.length > 0 ? {[param]: join(hasFilter, ',')} : {})
                };
            }, {});

            resolve(axios.get(parseUrl(catalogURL), {
                params: {
                    page: page + 1,
                    page_size: maxRecords,
                    format: 'json',
                    ...bboxObj,
                    ...categoryFilterObj
                }
            }).then((response) => {

                const records = response.data && response.data.results || null;
                const numberOfRecordsMatched = response.data && response.data.count || 0;
                if (records) {
                    return {
                        numberOfRecordsMatched,
                        numberOfRecordsReturned: records.length,
                        records
                    };
                }
                return {
                    numberOfRecordsMatched: 0,
                    numberOfRecordsReturned: 0,
                    records: []
                };
            })
            .catch(() => ({
                numberOfRecordsMatched: 0,
                numberOfRecordsReturned: 0,
                records: []
            })));
        });
    }
};

module.exports = Api;
