#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""View classes for HEV-e Vulnerabilities"""

import logging

from django_filters import rest_framework as django_filters
from rest_framework import viewsets

from . import serializers
from . import filters
from ..constants import DatasetType
from ..models import HeveDetails
from ..pagination import HevePagination


LOGGER = logging.getLogger(__name__)


class VulnerabilityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeveDetails.objects.filter(
        dataset_type=DatasetType.vulnerability.name)
    filter_backends = (
        filters.HeveInBboxFilter,
        django_filters.DjangoFilterBackend,
    )
    filter_class = filters.VulnerabilityLayerListFilterSet
    bbox_filter_include_overlapping = True
    bbox_filter_field = "envelope"
    pagination_class = HevePagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            result = serializers.VulnerabilityDetailSerializer
        else:
            result = serializers.VulnerabilityListSerializer
        return result
