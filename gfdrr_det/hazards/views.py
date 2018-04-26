#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from django_filters.views import FilterMixin
from django_filters import rest_framework as django_filters
from rest_framework import viewsets
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.renderers import JSONRenderer
from rest_framework_gis.filters import InBBoxFilter
from rest_framework_gis.pagination import GeoJsonPagination

from ..models import HeveDetails
from ..constants import DatasetType
from . import filters
from . import serializers

InBBoxFilter.bbox_param = "bbox"


class HazardLayerViewSet(FilterMixin, viewsets.ReadOnlyModelViewSet):
    pagination_class = GeoJsonPagination
    queryset = HeveDetails.objects.filter(dataset_type=DatasetType.hazard.name)
    renderer_classes = (
        JSONRenderer,
        BrowsableAPIRenderer,
    )
    serializer_class = serializers.HazardLayerListSerializer
    filter_backends = (
        django_filters.DjangoFilterBackend,
        InBBoxFilter,
    )
    bbox_filter_field = "envelope"
    bbox_filter_include_overlapping = True
    filter_class = filters.HazardLayerListFilterSet

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.HazardLayerListSerializer
        else:
            result = serializers.HazardLayerDetailSerializer
        return result
