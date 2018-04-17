#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Serializers for HEV-e vulnerabilities"""

from rest_framework import serializers


class VulnerabilitySerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "type": instance.details["type_"],
            "hazard": instance.details.get("hazard"),
            "asset": instance.details.get("asset"),
            "countries": instance.details.get("countries"),
            "reference": instance.details.get("reference"),
        }
