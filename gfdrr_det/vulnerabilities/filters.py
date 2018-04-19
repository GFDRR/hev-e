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

from django.db.models import Q
from django_filters import rest_framework as django_filters
from django_filters import STRICTNESS
from rest_framework_gis.filters import InBBoxFilter

from .. import filters as general_filters
from ..models import HeveDetails


class HeveInBboxFilter(InBBoxFilter):
    bbox_param = "bbox"

    def filter_queryset(self, request, queryset, view):
        filter_field = getattr(view, "bbox_filter_field", None)
        if not filter_field:
            raise RuntimeError("Define the `bbox_filter_field` parameter")
        geodjango_filter = "intersects"
        bbox = self.get_filter_bbox(request)
        if not bbox:
            return queryset
        return queryset.filter(
            Q(**{'%s__%s' % (filter_field, geodjango_filter): bbox}))


class VulnerabilityLayerListFilterSet(django_filters.FilterSet):
    vulnerability_type = django_filters.ChoiceFilter(
        name="details__vulnerability_type",
        empty_label="",
        choices=[
            ("vulnerability_function", "vulnerability_function"),
            ("fragility_function", "fragility_function"),
            ("damage_to_loss_function", "damage_to_loss_function"),
        ],
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


