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

from django.db.models import Q
from django.conf import settings
from django_filters import STRICTNESS
from django_filters import rest_framework as django_filters
from django_filters.filters import BaseInFilter
from geonode.layers.models import Layer
from rest_framework.exceptions import ParseError
from rest_framework_gis.filters import InBBoxFilter


def get_filter_bbox(bbox_string):
    try:
        return tuple(float(i) for i in bbox_string.split(","))
    except ValueError:
        raise ParseError("Invalid bbox string")


# This class is inspired by django-rest-framework-gis' InBBoxFilter, with
# some modifications to make it suitable for a Geonode layer, which does
# not store bbox information on a geodjango field
class GeonodeLayerInBBoxFilterBackend(InBBoxFilter):
    bbox_param = "bbox"  # URL query param which contains the BBOX

    def get_filter_bbox(self, request):
        bbox_string = request.query_params.get(self.bbox_param, None)
        if bbox_string is not None:
            try:
                result = get_filter_bbox(bbox_string)
            except ValueError:
                raise ParseError("Invalid bbox string supplied for "
                                 "parameter {0}".format(self.bbox_param))
        else:
            result = None
        return result

    def filter_queryset(self, request, queryset, view):
        result = queryset
        bbox = self.get_filter_bbox(request)
        if bbox is not None:
            x0, y0, x1, y1 = bbox
            # this expression was taken from geonode's
            # geonode.api.resourcebase_api.CommonModelApi.filter_bbox()
            # method
            intersects = ~(Q(bbox_x0__gt=x1) | Q(bbox_x1__lt=x0) |
                           Q(bbox_y0__gt=y1) | Q(bbox_y1__lt=y0))
            result = queryset.filter(intersects)
        return result


class CategoryInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


def filter_category(queryset, name, value):
    """Filter by category

    This function exists because the current django version does not
    support using the ``in`` lookup expression in fields of type
    ``JSONField``.

    We work around this limitation by creating a Q object and OR'ing all
    of the input values

    """

    lookup_expression = "__".join((name, "exact"))
    if len(value) > 1:
        q_obj = Q(**{name: value[0]})
        for category in value[1:]:
            q_obj = q_obj | Q(**{lookup_expression: category})
        qs = queryset.filter(q_obj)
    elif len(value) == 1:
        qs = queryset.filter(**{lookup_expression:value[0]})
    else:
        qs = queryset
    return qs


class ExposureLayerListFilterSet(django_filters.FilterSet):
    aggregation_type = django_filters.ChoiceFilter(
        name="hevedetails__details__area_type",
        empty_label="",
        choices=[
            (v, v) for v in settings.HEV_E[
                "EXPOSURES"]["area_type_mappings"].keys()
        ],
    )
    category = CategoryInFilter(
        name="hevedetails__details__category",
        lookup_expr="eq",
        method=filter_category
    )

    class Meta:
        model = Layer
        fields = (
            "category",
            "aggregation_type",
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
