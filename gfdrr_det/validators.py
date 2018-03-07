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

"""Custom validators for HEV-E"""

from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _

from . import constants


def validate_dataset_type(value):
    if value not in [name for name in constants.DatasetType.__members__]:
        raise ValidationError(
            _("%(value)s is not a valid dataset type"),
            params={"value": value}
        )
