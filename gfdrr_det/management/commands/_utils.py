#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from __future__ import print_function

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import management
from geoserver.catalog import Catalog

from gfdrr_det.constants import DatasetType


def handle_geoserver_layer(table_name, store_name, db_params, schema_name,
                           default_style_name="", logger=print):
    """Publish a database table/view as a GeoServer layer

    Parameters
    ----------
    store_name: str
        Name of the GeoServer store to use. This store will be created in case
        it does not exist
    db_params: dict
        A mapping with parameters used for connecting to the database
    schema_name: str
        Name of the database schema where the views to publish reside
    logger: function, optional
        A function that is used to output information.

    Returns
    -------
    list
        An iterable with the geoserver layers that have been published

    """

    logger("inside handle_geoserver_layer: {}".format(locals()))

    gs_catalog = Catalog(
        service_url=settings.OGC_SERVER["default"]["LOCATION"] + "rest",
        username=settings.OGC_SERVER["default"]["USER"],
        password=settings.OGC_SERVER["default"]["PASSWORD"]
    )
    logger("Retrieving geoserver workspace...")
    workspace = get_geoserver_workspace(gs_catalog)
    store = gs_catalog.get_store(store_name, workspace=workspace)
    if store is None:
        logger("Creating geoserver store...")
        store = get_postgis_store(gs_catalog, store_name, workspace, db_params,
                                  schema_name)
    logger("Adding {!r} as a geoserver layer...".format(table_name))
    featuretype = gs_catalog.publish_featuretype(
        table_name, store, "EPSG:4326", srs="EPSG:4326")
    logger("dir(featuretype): {}".format(dir(featuretype)))
    layer = gs_catalog.get_layer(featuretype.name)
    if default_style_name != "":
        logger("Setting default style for layer...")
        layer._set_default_style(default_style_name)
    gs_catalog.save(featuretype)
    gs_catalog.save(layer)
    return featuretype


def import_layers_to_geonode(workspace_name, store_name, user_name,
                             stdout, stderr, filter_=None):
    management.call_command(
        "updatelayers",
        store=store_name,
        workspace=workspace_name,
        user=user_name,
        skip_unadvertised=True,
        skip_geonode_registered=True,
        filter=filter_,
        stdout=stdout,
        stderr=stderr
    )


def get_postgis_store(geoserver_catalogue, store_name, workspace, db_params,
                      schema_name):
    """Create a new GeoServer datastore suitable for a PostGIS database"""
    store = geoserver_catalogue.create_datastore(
        name=store_name,
        workspace=workspace,
    )
    store.connection_parameters.update({
        "host": db_params["host"],
        "port": db_params["port"],
        "database": db_params["database"],
        "user": db_params["user"],
        "passwd": db_params["password"],
        "dbtype": "postgis",
        "schema": schema_name,
    })
    geoserver_catalogue.save(store)
    return store


def get_geoserver_workspace(geoserver_catalogue, create=True):
    """Get or create a GeoServer workspace"""
    name = getattr(settings, "GEOSERVER_HEV_E_WORKSPACE", "hev-e")
    workspace = geoserver_catalogue.get_workspace(name)
    if workspace is None and create:
        uri = "http://www.geo-solutions.it/{}".format(name)
        workspace = geoserver_catalogue.create_workspace(name, uri)
    return workspace


def get_user(name=None):
    user_model = get_user_model()
    if name is None:
        user = user_model.objects.filter(is_superuser=True).first()
    else:
        user = user_model.objects.get(username=name)
    return user


def drop_materialized_view(db_cursor, view_name, dry_run=False, logger=print):
    logger("Dropping materialized view {}...".format(view_name))
    drop_query = "DROP MATERIALIZED VIEW IF EXISTS {} CASCADE".format(
        view_name)
    if dry_run:
        logger(drop_query)
    else:
        db_cursor.execute(drop_query)


def refresh_view(db_cursor, view_name, dry_run=False, logger=print):
    query = "REFRESH MATERIALIZED VIEW {} WITH DATA".format(view_name)
    if dry_run:
        logger(query)
    else:
        db_cursor.execute(query)


def get_mapped_category(category, dataset_type):
    """Map the input category to the naming used in HEV-E"""
    mapping = {
        DatasetType.exposure: settings.HEV_E["EXPOSURES"]["category_mappings"],
        DatasetType.hazard: settings.HEV_E["HAZARDS"]["category_mappings"],
    }[dataset_type]
    for hev_e_category, maps in mapping.items():
        if category.lower() in maps["categories"]:
            result = hev_e_category
            break
    else:
        raise RuntimeError("Could not determine the HEV-E category to map "
                           "with {!r}".format(category))
    return result