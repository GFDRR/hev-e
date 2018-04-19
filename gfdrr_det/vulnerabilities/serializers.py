#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Serializers for HEV-E vulnerabilities"""

import logging

from django.db import connections
from rest_framework import serializers

from . import utils

LOGGER = logging.getLogger(__name__)


class VulnerabilityListSerializer(serializers.BaseSerializer):
    """Serializer for the Vulnerabilities list endpoint"""

    def to_representation(self, instance):
        url_field = serializers.HyperlinkedIdentityField(
            view_name="vulnerabilities-detail",
            lookup_field="id",
            lookup_url_kwarg="pk",
        )
        list_representation = get_vulnerability_list_representation(instance)
        list_representation["url"] = url_field.get_url(
            instance,
            "vulnerabilities-detail",
            self.context["request"],
            None
        )
        return list_representation


class VulnerabilityDetailSerializer(serializers.BaseSerializer):
    """Serializer for vulnerability detail endpoint"""

    def to_representation(self, instance):
        representation_getter = {
            "vulnerability_function": get_vf_table_representation,
        }.get(instance.details["vulnerability_type"])
        with connections["hev_e"].cursor() as db_cursor:
            try:
                representation = representation_getter(
                    db_cursor,
                    instance,
                )
            except TypeError:
                representation = get_vulnerability_list_representation(
                    instance)
        return representation


def get_vulnerability_list_representation(instance):
    return {
        "vulnerability_type": instance.details["vulnerability_type"],
        "hazard": instance.details.get("hazard"),
        "exposure": instance.details.get("asset"),
        "countries": instance.details.get("countries"),
        "reference": instance.details.get("reference"),
    }


def get_vf_table_representation(db_cursor, instance):
    vf_record = utils.get_extended_vulnerability_record(
        db_cursor,
        instance.details["record_id"]
    )
    return {
        "vulnerability_type": instance.details["vulnerability_type"],
        "id": vf_record.id,
        "hazard": vf_record.hazard,
        "exposure": vf_record.asset,
        "geographical_applicability": instance.details["countries"],
        "reference": vf_record.reference,
        "taxonomy": vf_record.taxonomy,  # TODO: normalize taxonomies
        "vf_relationship": vf_record.vf_relationship,
        "vf_math": vf_record.vf_math,
        "vf_math_model": vf_record.vf_math_model,
        "function_parameters": vf_record.function_parameters,
        "im_data_source": vf_record.im_data_source,
        "im_name_f": vf_record.im_name_f,
        "im_definition": vf_record.im_table_definition,
        "im_units": vf_record.im_table_units,
        "im_range": vf_record.im_table_range,
        "loss_parameter_name": vf_record.lp_name,
        "loss_parameter_description": vf_record.lp_description,
        "loss_parameter_units": vf_record.lp_units,
    }
