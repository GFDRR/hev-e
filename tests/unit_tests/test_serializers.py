#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import pytest

from gfdrr_det import serializers

pytestmark = pytest.mark.unit


@pytest.mark.parametrize("value,grid,expected", [
    (0, [-2, -1, 0, 1, 2], 0.0),
    (-2, [-2, -1, 0, 1, 2], -2.0),
    (2, [-2, -1, 0, 1, 2], 2.0),
    (-1.7, [-2, -1, 0, 1, 2], -2.0),
    (-1.3, [-2, -1, 0, 1, 2], -1.0),
    (1.7, [-2, -1, 0, 1, 2], 2.0),
    (1.3, [-2, -1, 0, 1, 2], 1.0),
    (-0.5, [-2, -1, 0, 1, 2], -1.0),
    (0.5, [-2, -1, 0, 1, 2], 0.0),
    (-2.3, [-2, -1, 0, 1, 2], -2.0),
    (2.3, [-2, -1, 0, 1, 2], 2.0),
])
def test_snap_value(value, grid, expected):
    result = serializers.snap_value(value, grid)
    assert result == expected


@pytest.mark.parametrize("start,end,resolution,expected", [
    (-2, 2, 1, [-2, -1, 0, 1, 2]),
    (-2, 2, 0.5, [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]),
    (-2, 2, 2, [-2, 0, 2]),
])
def test_generate_1d_grid(start, end, resolution, expected):
    result = serializers.generate_1d_grid(start, end, resolution)
    assert result == expected


@pytest.mark.parametrize("value,grid,floor,expected", [
    (-2, [-2, -1, 0, 1, 2], True, -2),
    (-2, [-2, -1, 0, 1, 2], False, -2),
    (2, [-2, -1, 0, 1, 2], True, 2),
    (2, [-2, -1, 0, 1, 2], False, 2),
    (0, [-2, -1, 0, 1, 2], True, 0),
    (0, [-2, -1, 0, 1, 2], False, 0),
    (-1.4, [-2, -1, 0, 1, 2], True, -2.0),
    (-1.4, [-2, -1, 0, 1, 2], False, -1.0),
    (1.4, [-2, -1, 0, 1, 2], True, 1.0),
    (1.4, [-2, -1, 0, 1, 2], False, 2.0),
])
def test_enlarge_coordinate(value, grid, floor, expected):
    result = serializers.enlarge_coordinate(value, grid, floor=floor)
    assert result == expected


@pytest.mark.parametrize("bbox,resolution,expected", [
    (
        {
            "x0": 0,
            "y0": 0,
            "x1": 10,
            "y1": 10
        },
        1,
        {
            "x0": 0,
            "y0": 0,
            "x1": 10,
            "y1": 10
        }
    ),
    (
        {
            "x0": 0.543,
            "y0": 0.543,
            "x1": 10.543,
            "y1": 10.543
        },
        1,
        {
            "x0": 0,
            "y0": 0,
            "x1": 11,
            "y1": 11
        }
    ),
    (
        {
            "x0": -0.543,
            "y0": -32.1345,
            "x1": 10.93,
            "y1": 44.12,
        },
        1,
        {
            "x0": -1,
            "y0": -33,
            "x1": 11,
            "y1": 45
        }
    ),
    (
        {
            "x0": -0.543,
            "y0": -32.1345,
            "x1": 10.93,
            "y1": 44.12,
        },
        0.1,
        {
            "x0": -0.6,
            "y0": -32.2,
            "x1": 11,
            "y1": 44.2
        }
    ),
])
def test_snap_bbox_to_grid(bbox, resolution, expected):
    result = serializers.snap_bbox_to_grid(resolution, **bbox)
    for coord, value in result.items():
        assert abs(value - expected[coord]) < 0.00000001
