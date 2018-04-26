#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from django_filters import STRICTNESS
from django_filters import rest_framework as django_filters

from ..models import HeveDetails
from .. import filters as general_filters


class HazardLayerListFilterSet(django_filters.FilterSet):
    hazard_type = general_filters.CategoryInFilter(
        name="details__hazard_type",
        lookup_expr="eq",
        method=general_filters.filter_category
    )

    class Meta:
        model = HeveDetails
        fields = (
            "hazard_type",
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
