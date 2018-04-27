#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Filters for vulnerabilities views"""

from django_filters import rest_framework as django_filters
from django_filters import STRICTNESS

from .. import filters as general_filters
from ..models import HeveDetails


class VulnerabilityLayerListFilterSet(django_filters.FilterSet):
    vulnerability_type = general_filters.CategoryInFilter(
        name="details__vulnerability_type",
        method=general_filters.filter_category
    )
    exposure = general_filters.CategoryInFilter(
        name="details__asset",
        method=general_filters.filter_category
    )
    hazard = general_filters.CategoryInFilter(
        name="details__hazard",
        method=general_filters.filter_category
    )

    class Meta:
        model = HeveDetails
        fields = (
            "vulnerability_type",
            "exposure",
            "hazard",
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR


