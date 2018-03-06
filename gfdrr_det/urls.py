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

from django.conf.urls import url, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter

from geonode.urls import urlpatterns

from . import views

router = DefaultRouter()
router.register(r"administrativedivision", views.AdministrativeDivisionViewSet)
router.register(r"region", views.RegionViewSet)

API_PREFIX = r"^gfdrr_det/api/v(?P<version>\d+)/"


urlpatterns = [
    url(
        r'^$',
        TemplateView.as_view(template_name='site_index.html'),
        name='home'
    ),
    url(API_PREFIX, include(router.urls)),
] + urlpatterns
