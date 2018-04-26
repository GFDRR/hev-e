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

from rest_framework import serializers

LOGGER = logging.getLogger(__name__)


class VulnerabilityListSerializer(serializers.BaseSerializer):
    """Serializer for the Vulnerabilities list endpoint"""

    url_field = serializers.HyperlinkedIdentityField(
        view_name="vulnerabilities-detail",
        lookup_field="id",
        lookup_url_kwarg="pk",
    )

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "url": self.url_field.get_url(
                instance,
                "vulnerabilities-detail",
                self.context["request"],
                None
            ),
            "vulnerability_type": instance.details["vulnerability_type"],
            "hazard": instance.details.get("hazard"),
            "exposure": instance.details.get("asset"),
            "countries": instance.details.get("countries"),
            "reference": instance.details.get("reference"),
            "name": instance.details.get("reference"),
        }


class VulnerabilityDetailSerializer(VulnerabilityListSerializer):
    """Serializer for vulnerability detail endpoint"""

    def to_representation(self, instance):
        record = instance["record"]
        heve_details = instance["heve_details"]
        return {
            "vulnerability_type": heve_details.details["vulnerability_type"],
            "url": self.url_field.get_url(
                heve_details,
                "vulnerabilities-detail",
                self.context.get("request"),
                None
            ),
            "id": heve_details.id,
            "table_id": record.id,
            "hazard": record.hazard,
            "exposure": record.asset,
            "geographical_applicability": heve_details.details["countries"],
            "scale_applicability": record.scale_applicability,
            "reference": record.reference,
            "name": record.reference,
            "taxonomy": record.taxonomy,  # TODO: normalize taxonomies
            "vf_relationship": record.vf_relationship,
            "vf_math": record.vf_math,
            "vf_math_model": record.vf_math_model,
            "function_parameters": record.function_parameters,
            "im_data_source": record.im_data_source,
            "im_name_f": record.im_name_f,
            "im_definition": record.im_table_definition,
            "im_units": record.im_table_units,
            "im_table_range": record.im_table_range,
            "loss_parameter_name": record.lp_name,
            "loss_parameter_description": record.lp_description,
            "loss_parameter_units": record.lp_units,
        }


class FragilityDetailSerializer(VulnerabilityListSerializer):

    def to_representation(self, instance):
        record = instance["record"]
        heve_details = instance["heve_details"]
        return {
            "vulnerability_type": heve_details.details["vulnerability_type"],
            "url": self.url_field.get_url(
                heve_details,
                "vulnerabilities-detail",
                self.context["request"],
                None
            ),
            "id": heve_details.id,
            "table_id": record.id,
            "name": record.reference,
            "hazard": record.hazard,
            "exposure": record.asset,
            "geographical_applicability": heve_details.details["countries"],
            "scale_applicability": record.scale_applicability,
            "reference": record.reference,
            "ff_math_modelf": record.ff_math_modelf,
            "ff_relationship": record.ff_relationship,
            "ff_math": record.ff_math,
            "function_parameters": record.function_parameters,
            "im_name_f": record.im_name_f,
            "im_definition": record.im_table_definition,
            "im_units": record.im_table_units,
            "im_table_range": record.im_table_range,
            "im_data_source": record.im_data_source,
            "damage_scale_name": record.damage_scale_name,
            "damage_scale_dm_states_name": record.damage_scale_dm_states_name,
            "damage_scale_reference": record.damage_scale_reference,
            "dm_states_name": record.dm_states_name,
            "dm_scale_reference": record.dm_scale_reference,
            "reference_title": record.reference_title,
            "reference_author_year": record.reference_author_year,
            "edp_name_all": record.edp_name_all,
            "edp_units": record.edp_units,
        }


class DamageToLossDetailSerializer(VulnerabilityListSerializer):

    def to_representation(self, instance):
        record = instance["record"]
        heve_details = instance["heve_details"]
        return {
            "vulnerability_type": heve_details.details["vulnerability_type"],
            "url": self.url_field.get_url(
                heve_details,
                "vulnerabilities-detail",
                self.context["request"],
                None
            ),
            "id": heve_details.id,
            "table_id": record.id,
            "hazard": record.hazard,
            "exposure": record.asset,
            "taxonomy": record.taxonomy,  # TODO: normalize taxonomies
            "geographical_applicability": heve_details.details["countries"],
            "scale_applicability": record.scale_applicability,
            "name": record.reference,
            "reference_author_year": record.reference_author_year,
            "reference_title": record.reference_title,
            "dtl_pdf_type": record.dtl_pdf_type,
            "function_parameters": record.function_parameters,
            "damage_scale_name": record.damage_scale_name,
            "damage_scale_dm_states_name": record.damage_scale_dm_states_name,
            "damage_scale_reference": record.damage_scale_reference,
        }
