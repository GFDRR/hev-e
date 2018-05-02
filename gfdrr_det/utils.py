#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import hashlib
import shlex
import subprocess
from decimal import Decimal
import logging

import django.utils
from django.conf import settings
from django.db import connections
import requests
import shutil

LOGGER = logging.getLogger(__name__)


def get_bbox_for_filename(bbox, coord_separator="_"):
    x0, x1, y0, y1 = bbox
    coords = [
        "{0}{1:3.4f}".format("E" if x0 < 0 else "W", abs(x0)),
        "{0}{1:3.4f}".format("S" if y0 < 0 else "N", abs(y0)),
        "{0}{1:3.4f}".format("E" if x1 < 0 else "W", abs(x1)),
        "{0}{1:3.4f}".format("S" if y1 < 0 else "N", abs(y1)),
    ]
    return coord_separator.join(coords)


def generate_geopackage_download_name(layer_name, bbox=None):
    if bbox is None:
        result = "{}.gpkg".format(layer_name)
    else:
        result = "{name}_{bbox}.gpkg".format(
            name=layer_name,
            bbox=get_bbox_for_filename(bbox)
        )
    return result


def get_ewkt_from_geonode_bbox(geonode_bbox):
    """Return an EWKT representation from a geonode layer bbox

    This function is suitable for translating between geonode layer's ``bbox``
    attribute and EWKT.

    """

    return get_ewkt_from_bbox(
        x0=geonode_bbox[0],
        y0=geonode_bbox[2],
        x1=geonode_bbox[1],
        y1=geonode_bbox[3],
        srid=geonode_bbox[4].split(":")[-1]
    )


def get_ewkt_from_bbox(x0, y0, x1, y1, srid=4326):
    return (
        "SRID={srid};"
        "POLYGON(("
        "{x0} {y0}, "
        "{x0} {y1}, "
        "{x1} {y1}, "
        "{x1} {y0}, "
        "{x0} {y0}"
        "))".format(srid=srid, x0=x0, y0=y0, x1=x1, y1=y1))


def get_geonode_bbox_from_ewkt(ewkt):
    srid = ewkt.replace("SRID=", "").partition(";")[0]
    coords = ewkt.partition(
        "((")[-1].replace("))", "").replace(",", "").split()
    return [
        Decimal(coords[0]),  # x0
        Decimal(coords[4]),  # x1
        Decimal(coords[1]),  # y0
        Decimal(coords[3]),  # y1
        "EPSG:{}".format(srid)
    ]


def serialize_bbox_option(stored_bbox):
    """Serializes a previously parsed bbox option"""
    renamed = stored_bbox.replace("ullon", "x0").replace(
        "lrlon", "x1").replace("ullat", "y1").replace("lrlat", "y0")
    parts = renamed.replace(":", "").split()
    names = parts[::2]
    values = parts[1::2]
    return {name: float(values[index]) for index, name in enumerate(names)}


def parse_bbox_option(value):
    """Parses a gml:boundingBox into a string"""
    nsmap = {"gml": "http://www.opengis.net/gml"}
    lower_corner = value.xpath(
        "gml:boundingBox/gml:lowerCorner/text()",
        namespaces=nsmap)[0].split()
    upper_corner = value.xpath(
        "gml:boundingBox/gml:upperCorner/text()",
        namespaces=nsmap)[0].split()
    try:
        crs = value.xpath("gml:boundingBox/@srsName", namespaces=nsmap)[0]
    except IndexError:
        crs = "EPSG:4326"
    lower_lon, lower_lat = _order_coordinates(lower_corner, crs)
    upper_lon, upper_lat = _order_coordinates(upper_corner, crs)
    LOGGER.debug("lower_lon: {}".format(lower_lon))
    LOGGER.debug("upper_lon: {}".format(upper_lon))
    left_lon, right_lon = (
        (lower_lon, upper_lon) if lower_lon < upper_lon else
        (upper_lon, lower_lon)
    )
    result = "ullon: {} ullat: {} lrlon: {} lrlat: {}".format(
        left_lon, upper_lat, right_lon, lower_lat)
    LOGGER.debug("result: {}".format(result))
    return result


def _order_coordinates(coordinate_pair, crs):
    code = crs.rpartition(":")[-1]
    if code == "4326":
        y, x = coordinate_pair
    elif code == "CRS84":
        x, y = coordinate_pair
    else:  # fallback to Y X
        y, x = coordinate_pair
    return x, y


def get_dict_str(mapping):
    result = []
    for k, v in mapping.items():
        if isinstance(v, dict):
            stringified_dict = get_dict_str(v)
            result.append("{}:{}".format(k, stringified_dict))
        else:
            result.append("{}:{}".format(k, v))
    return ",".join(sorted(result))


def get_layer_hash(name, **kwargs):
    extra_contents = []
    for extra_list in [str(v) for v in kwargs.values() if v is not None]:
        extra_contents += extra_list
    hash_contents = [name] + extra_contents
    return hashlib.md5("".join(sorted(hash_contents))).hexdigest()


def run_process(command_str):
    process = subprocess.Popen(
        args=shlex.split(command_str),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


def prepare_ogr2ogr_command(query, target_path, name):
    connection_params = connections["hev_e"].get_connection_params()
    db_connection_string = (
        'PG:"dbname={database} host={host} port={port} user={user} '
        'password={password}"'.format(**connection_params)
    )
    command_str = (
        "ogr2ogr -gt unlimited -f GPKG -append "
        "-sql \"{query}\" {target_path} {db} -nln {name}".format(
            query=query,
            target_path=target_path,
            db=db_connection_string,
            name=name
        )
    )
    return command_str


def get_view_name(model_id, model_name, category, prefix="", suffix="",
                  separator="_"):
    """Return a name for a view that is also a valid GeoServer layer name"""
    slug_pattern = "{prefix}{name}{sep}{category}"
    final_prefix = "{prefix}{sep}".format(
        prefix=prefix, sep=separator) if prefix != "" else prefix
    final_suffix = "{sep}{suffix}".format(
        suffix=suffix, sep=separator) if suffix != "" else suffix
    slugged = django.utils.text.slugify(
        slug_pattern.format(
            prefix=final_prefix,
            sep=separator,
            name=model_name,
            category=category,
        )
    )
    return "{slugged}{sep}{id}{suffix}".format(
        slugged=slugged,
        sep=separator,
        id=model_id,
        suffix=final_suffix
    ).replace("-", separator)


def generate_shapefile(layer_name, target_path, bbox_wkt=None,
                       additional_cql_conditions=None):
    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typename": "hev-e:{}".format(layer_name),
        "outputFormat": "shape-zip",
        "format_options": "charset:UTF-8",
    }
    cql_conditions = []
    if bbox_wkt is not None:
        cql_conditions.append("INTERSECTS(geom, {})".format(bbox_wkt))
    if additional_cql_conditions:
        cql_conditions += list(additional_cql_conditions)
    if cql_conditions:
        params["cql_filter"] = " AND ".join(cql_conditions)
    LOGGER.debug("generate_shapefile request params: %s", params)
    response = requests.get(
        "{}wfs".format(settings.OGC_SERVER["default"]["PUBLIC_LOCATION"]),
        params=params,
        stream=True
    )
    response.raise_for_status()
    if "xml" in response.headers.get("Content-Type"):  # there was an error
        raise RuntimeError("Could not get shapefile from "
                           "geoserver: {}".format(response.content))
    with open(target_path, "wb") as file_handler:
        response.raw.decode_content = True
        shutil.copyfileobj(response.raw, file_handler)
