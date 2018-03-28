# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from rest_framework.renderers import BaseRenderer


class GeoPackageRenderer(BaseRenderer):
    # GeoPackage media type, as mentioned on
    # https://github.com/opengeospatial/geopackage/issues/381#issuecomment-365356049
    media_type = "application/vnd.opengeospatial.geopackage+sqlite3"
    format = "gpkg"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data["path"].read_bytes()