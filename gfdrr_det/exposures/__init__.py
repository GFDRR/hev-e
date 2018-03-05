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

DATABASES = {
    'exposures': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'ged4all',
        'USER': 'geonode',
        'PASSWORD': 'geonode',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_TOUT': 900,
    }
}
