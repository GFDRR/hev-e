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

from rest_framework import serializers


class VulnerabilitySerializer(serializers.BaseSerializer):
    """Serializer for the Vulnerabilities list endpoint"""

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "vulnerability_type": instance.details["vulnerability_type"],
            "hazard": instance.details.get("hazard"),
            "exposure": instance.details.get("asset"),
            "countries": instance.details.get("countries"),
            "reference": instance.details.get("reference"),
        }
