/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    getTOCLayerObject: (item, bbox, prefix = '') => ({
        type: 'wms',
        url: item.properties.wms_url,
        visibility: true,
        name: item.properties.name,
        title: item.properties.title,
        description: item.properties.description,
        group: 'toc_layers',
        bbox: {
            crs: 'EPSG:4326',
            bounds: {
                minx: bbox[0],
                miny: bbox[1],
                maxx: bbox[2],
                maxy: bbox[3]
            }
        },
        id: prefix + item.properties.name,
        record: {...item}
    })
};
