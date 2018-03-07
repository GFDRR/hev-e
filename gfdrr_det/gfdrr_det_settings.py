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

from gfdrr_det.settings.development import *

# Enabling Ged4All Exposures
GFDRR_DET_EXPOSURES_ENABLED = True

if GFDRR_DET_EXPOSURES_ENABLED:
    from . import exposures
    if 'gfdrr_det.exposures' not in INSTALLED_APPS:
        INSTALLED_APPS += ('gfdrr_det.exposures',)

    DATABASES.update(exposures.DATABASES)
    DATABASES["exposures"].update({
        'NAME': 'ged4all',
        "USER": get_environment_variable("GFDRR_DET_DB_USER"),
        "PASSWORD": get_environment_variable("GFDRR_DET_DB_PASSWORD"),
    })
