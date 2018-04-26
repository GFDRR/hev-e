/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {head} = require('lodash');

const getFilter = (name, groupInfo) => {
    if (groupInfo[name]) {
        return groupInfo[name];
    }
    const value = head(Object.keys(groupInfo).filter(key => groupInfo[key].values && head(groupInfo[key].values.filter(val => val.code === name))));
    const filterData = groupInfo[value] && groupInfo[value].values && head(groupInfo[value].values.filter(val => val.code === name));
    return filterData && {
        ...groupInfo[value],
        name: filterData.name
    } || null;
};

const getName = (name, groupInfo) => {
    const filter = getFilter(name, groupInfo);
    return filter && filter.name;
};

const getIcon = (name, groupInfo) => {
    const filter = getFilter(name, groupInfo);
    return filter && filter.icon && filter.icon.indexOf('icon-') !== -1 && filter.icon
    || filter && filter.icon && 'fa-' + filter.icon;
};

const getItem = {
    exposures: (item, groupInfo) => ({
        id: item.id,
        type: item.properties && item.properties.category,
        name: item.properties && item.properties.name,
        title: item.properties && item.properties.name,
        description: item.properties && item.properties.description,
        caption: item.properties && item.properties.category,
        icon: item.properties && groupInfo[item.properties.category] && groupInfo[item.properties.category].icon && 'fa-' + groupInfo[item.properties.category].icon || 'database'
    }),
    vulnerabilities: (item, groupInfo) => ({
        id: item.id,
        type: item.vulnerability_type,
        name: item.name,
        title: item.name,
        icon: getIcon(item.vulnerability_type && item.vulnerability_type.toLowerCase(), groupInfo),
        exposureIcon: getIcon(item.exposure && item.exposure.toLowerCase(), groupInfo),
        hazardIcon: getIcon(item.hazard && item.hazard.toLowerCase(), groupInfo),
        exposure: getName(item.exposure && item.exposure.toLowerCase(), groupInfo),
        hazard: getName(item.hazard && item.hazard.toLowerCase(), groupInfo),
        caption: getName(item.vulnerability_type && item.vulnerability_type.toLowerCase(), groupInfo)
    })
};

module.exports = {
    getFilter,
    getName,
    getIcon,
    getItem
};
