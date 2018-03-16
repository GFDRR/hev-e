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
from rest_framework.schemas import get_schema_view

from geonode.urls import urlpatterns

from . import views
from .exposures import views as exposure_views

router = DefaultRouter()
router.register(
    r"administrativedivision",
    views.AdministrativeDivisionViewSet,
    base_name="administrativedivision"
)
router.register(
    r"country",
    views.CountryViewSet,
    base_name="country"
)
router.register(
    r"relevantcountry",
    views.RelevantCountryViewSet,
    base_name="relevantcountry"
)
router.register(
    r"datasetrepresentation",
    views.DatasetRepresentationViewSet,
    base_name="datasetrepresentation"
)
router.register(r"region", views.RegionViewSet)
router.register(
    r"exposures",
    exposure_views.ExposureLayerListViewSet,
    base_name="exposures"
)
schema_view = get_schema_view("HEV-E API")

API_PREFIX = r"^gfdrr_det/api/v(?P<version>\d+)/"

# geonode patterns must come last so that the regexp for our index page is not
# overridden
urlpatterns = [
    url(
        r'^$',
        TemplateView.as_view(template_name='site_index.html'),
        name='home'
    ),
    url(API_PREFIX, include(router.urls)),
    url("{}schema/$".format(API_PREFIX), schema_view),
] + urlpatterns
