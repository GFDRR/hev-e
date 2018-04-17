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

from rest_framework import viewsets

from . import serializers
from ..constants import DatasetType
from ..models import HeveDetails


LOGGER = logging.getLogger(__name__)


class VulnerabilityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeveDetails.objects.filter(
        dataset_type=DatasetType.vulnerability.name)
    serializer_class = serializers.VulnerabilitySerializer
