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

"""Enumeration constants for HEV-E"""

from enum import Enum, unique


@unique
class DatasetType(Enum):
    exposure = 1
    hazard = 2

@unique
class AdministrativeDivisionLevel(Enum):
    zero = 0
    one = 1
    two = 2

