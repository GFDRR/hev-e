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

from django.apps import AppConfig
from django.conf import settings


class GfdrrdetConfig(AppConfig):
    name = "gfdrr_det"

    def ready(self):
        if settings.USE_NATIVE_JSONFIELD:
            from jsonfield_compat import register_app
            register_app(self)
