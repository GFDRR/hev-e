/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const axios = require('../../MapStore2/web/client/libs/ajax');
const urlUtil = require('url');
const assign = require('object-assign');

const parseUrl = (url) => {
    const parsed = urlUtil.parse(url, true);
    return urlUtil.format(assign({}, parsed, {search: null}, {
        query: assign({}, parsed.query, {request: undefined})
    }));
};

const Api = {
    getRecords: function(url/*, startPosition, maxRecords, filter*/) {
        return new Promise((resolve) => {

            const mock = {
                numberOfRecordsMatched: 2,
                records: [
                    {
                        title: 'TEST'
                    },
                    {
                        title: 'TEST2'
                    }
                ]
            };

            resolve(axios.get(parseUrl(url))
                .then(() => null)
                .catch(() => mock));
/*
            require.ensure(['../../MapStore2/web/client/utils/ogc/CSW', '../../MapStore2/web/client/utils/ogc/Filter'], () => {
                const {CSW, marshaller, unmarshaller} = require('../../MapStore2/web/client/utils/ogc/CSW');

                let body = marshaller.marshalString({
                    name: "csw:GetRecords",
                    value: CSW.getRecords(startPosition, maxRecords, filter)
                });
                resolve(axios.post(parseUrl(url), body, { headers: {
                    'Content-Type': 'application/xml'
                }}).then(
                    (response) => {
                        if (response ) {
                            let json = unmarshaller.unmarshalString(response.data);
                            if (json && json.name && json.name.localPart === "GetRecordsResponse" && json.value && json.value.searchResults) {
                                let rawResult = json.value;
                                let rawRecords = rawResult.searchResults.abstractRecord || rawResult.searchResults.any;
                                let result = {
                                    numberOfRecordsMatched: rawResult.searchResults.numberOfRecordsMatched,
                                    numberOfRecordsReturned: rawResult.searchResults.numberOfRecordsReturned,
                                    nextRecord: rawResult.searchResults.nextRecord
                                    // searchStatus: rawResult.searchStatus
                                };
                                let records = [];
                                if (rawRecords) {
                                    for (let i = 0; i < rawRecords.length; i++) {
                                        let rawRec = rawRecords[i].value;
                                        let obj = {
                                            dateStamp: rawRec.dateStamp && rawRec.dateStamp.date,
                                            fileIdentifier: rawRec.fileIdentifier && rawRec.fileIdentifier.characterString && rawRec.fileIdentifier.characterString.value,
                                            identificationInfo: rawRec.abstractMDIdentification && rawRec.abstractMDIdentification.value
                                        };
                                        if (rawRec.boundingBox) {
                                            let bbox;
                                            let crs;
                                            let el;
                                            if (Array.isArray(rawRec.boundingBox)) {
                                                el = _.head(rawRec.boundingBox);
                                            } else {
                                                el = rawRec.boundingBox;
                                            }
                                            if (el && el.value) {
                                                let lc = el.value.lowerCorner;
                                                let uc = el.value.upperCorner;
                                                bbox = [lc[1], lc[0], uc[1], uc[0]];
                                                // TODO parse the extent's crs
                                                let crsCode = el.value && el.value.crs && el.value.crs.split(":::")[1];
                                                if (crsCode === "WGS 1984") {
                                                    crs = "EPSG:4326";
                                                } else if (crsCode) {
                                                    // TODO check is valid EPSG code
                                                    crs = "EPSG:" + crsCode;
                                                } else {
                                                    crs = "EPSG:4326";
                                                }
                                            }
                                            obj.boundingBox = {
                                                extent: bbox,
                                                crs: crs
                                            };
                                        }
                                        let dcElement = rawRec.dcElement;
                                        if (dcElement) {
                                            let dc = {
                                                references: []
                                            };
                                            for (let j = 0; j < dcElement.length; j++) {
                                                let dcel = dcElement[j];
                                                let elName = dcel.name.localPart;
                                                let finalEl = {};
                                                if (elName === "references" && dcel.value) {
                                                    let urlString = dcel.value.content && ConfigUtils.cleanDuplicatedQuestionMarks(dcel.value.content[0]) || dcel.value.content || dcel.value;
                                                    finalEl = {
                                                        value: urlString,
                                                        scheme: dcel.value.scheme
                                                    };
                                                } else {
                                                    finalEl = dcel.value.content && dcel.value.content[0] || dcel.value.content || dcel.value;
                                                }
                                                if (dc[elName] && Array.isArray(dc[elName])) {
                                                    dc[elName].push(finalEl);
                                                } else if (dc[elName]) {
                                                    dc[elName] = [dc[elName], finalEl];
                                                } else {
                                                    dc[elName] = finalEl;
                                                }
                                            }
                                            obj.dc = dc;
                                        }
                                        records.push(obj);
                                    }
                                }
                                result.records = records;
                                return result;
                            } else if (json && json.name && json.name.localPart === "ExceptionReport") {
                                return {
                                    error: json.value.exception && json.value.exception.length && json.value.exception[0].exceptionText || 'GenericError'
                                };
                            }
                        }
                        return null;
                    }));
            });*/
        });
    },
    textSearch: function(url, page, startPosition, maxRecords, text, sortBy, groupInfo, bboxFilter) {
        return new Promise((resolve) => {
            // const {Filter} = require('../../MapStore2/web/client/utils/ogc/Filter');
            // let filter = null;
            /*if (text) {
                let ops = Filter.propertyIsLike("csw:AnyText", "%" + text + "%");
                filter = Filter.filter(ops);
            }*/
            // resolve(Api.getRecords(url, startPosition, maxRecords, filter));

            /* MOCK */
            /*const hasFilter = groupInfo && head(Object.keys(groupInfo).filter(key => groupInfo[key].checked));
            const newText = text.toLowerCase();
            const records = [
                {
                    title: 'Urban Environment',
                    description: 'Tanzania Urban Environment',
                    icon: 'building',
                    caption: 'buildings',
                    bbox: [29.79, -8.46, 33.46, -3.92]
                },
                {
                    title: 'Connections',
                    description: 'Tanzania Connections',
                    icon: 'road',
                    caption: 'roads',
                    bbox: [38.69, -10.77, 40.82, -8.31]
                },
                {
                    title: 'Agriculture',
                    description: 'Tanzania Agriculture',
                    icon: 'leaf',
                    caption: 'crops',
                    bbox: [35.64, -6.21, 37.56, -4.10]
                },
                {
                    title: 'Population',
                    description: 'Tanzania Population',
                    icon: 'users',
                    caption: 'people',
                    bbox: [31.97, -7.54, 43.02, -2.75]
                }
            ].filter(rc => !newText || rc.title.toLowerCase().indexOf(newText) !== -1 || rc.description.toLowerCase().indexOf(newText) !== -1 || rc.caption.toLowerCase().indexOf(newText) !== -1)
            .filter(rc => !hasFilter || (groupInfo[rc.caption] && groupInfo[rc.caption].checked));

            const results = {
                numberOfRecordsMatched: records.length,
                numberOfRecordsReturned: records.length,
                nextRecord: 0,
                records: records.sort((a, b) => {
                    return sortBy === 'alphabeticalAToZ' ? a.title > b.title : a.title < b.title;
                })
            };*/

            // const hasFilter = groupInfo && head(Object.keys(groupInfo).filter(key => groupInfo[key].checked));

            const hasFilter = groupInfo && Object.keys(groupInfo).filter(key => groupInfo[key].checked).map(key => groupInfo[key] && groupInfo[key].code);
            const bboxObj = bboxFilter ? {bbox: bboxFilter} : { };
            const categoryObj = hasFilter ? {category: hasFilter.join(',')} : { };

            resolve(axios.get(parseUrl(url), {
                params: {
                    page: page + 1,
                    page_size: maxRecords,
                    search: text,
                    format: 'json',
                    ordering: sortBy,
                    ...categoryObj,
                    ...bboxObj
                }
            }).then((response) => {
                const records = response.data && response.data.features || null;
                const numberOfRecordsMatched = response.data && response.data.count || null;
                if (records) {
                    return {
                        numberOfRecordsMatched,
                        numberOfRecordsReturned: records.length,
                        records
                    };
                }
                /*const {total_count} = response.meta;
                const records = response.objects;
                const res = {
                    numberOfRecordsMatched: records.length,
                    numberOfRecordsReturned: records.length,
                    nextRecord: 0,
                    records: records.sort((a, b) => {
                        return sortBy === 'alphabeticalAToZ' ? a.title > b.title : a.title < b.title;
                    })
                };*/
                return null;
            })
            .catch(() => null));
        });
    }
};

module.exports = Api;
