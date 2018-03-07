#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Django REST framework serializers for GFDRR-DET"""

from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework.serializers import HyperlinkedModelSerializer
from rest_framework import serializers

from . import models

class AdministrativeDivisionDetailSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="administrativedivision-detail",
        lookup_field="pk",
    )
    region = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="region-detail",
    )
    parent = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="administrativedivision-detail",
    )
    datasets = serializers.HyperlinkedRelatedField(
        read_only=True,
        source="dataset_representations",
        many=True,
        view_name="datasetrepresentation-detail",
    )

    class Meta:
        model = models.AdministrativeDivision
        geo_field = "geom"
        fields = (
            "url",
            "level",
            "iso",
            "name",
            "name_eng",
            "name_local",
            "type",
            "engtype",
            "unregion",
            "population",
            "sqkm",
            "pop_sqkm",
            "region",
            "parent",
            "datasets",
        )

class AdministrativeDivisionListSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="administrativedivision-detail",
        lookup_field="pk",
    )
    region = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="region-detail",
    )
    parent = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="administrativedivision-detail",
    )
    datasets = serializers.HyperlinkedRelatedField(
        read_only=True,
        source="dataset_representations",
        many=True,
        view_name="datasetrepresentation-detail",
    )

    class Meta:
        model = models.AdministrativeDivision
        geo_field = "geom"
        fields = (
            "url",
            "level",
            "iso",
            "name",
            "type",
            "unregion",
            "region",
            "parent",
            "datasets",
        )


class RegionSerializer(HyperlinkedModelSerializer):

    class Meta:
        model = models.Region
        fields = (
            "url",
            "name",
            "level",
        )


class DatasetRepresentationSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="datasetrepresentation-detail",
        lookup_field="pk",
    )

    class Meta:
        model = models.DatasetRepresentation
        geo_field = "geom"
        fields = (
            "url",
            "name",
            "dataset_type",
        )
