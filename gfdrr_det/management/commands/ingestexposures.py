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

"""Django management command for integrating the GED4All exposures DB"""

from __future__ import print_function
from __future__ import unicode_literals
from collections import namedtuple
import json
import subprocess

from django.db import connections
from django.db import ProgrammingError
from django.conf import settings
from django.core import management
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.template.loader import get_template
from geonode.layers.models import Layer
from geonode.base.models import SpatialRepresentationType
from geonode.base.models import TopicCategory
from geoserver.catalog import Catalog

from gfdrr_det import models
from gfdrr_det import utils as general_utils
from gfdrr_det.constants import DatasetType
from gfdrr_det.exposures import utils

from . import _utils


class Command(BaseCommand):
    help = "Integrate with the GED4All exposures database"

    def add_arguments(self, parser):
        parser.add_argument(
            "-a",
            "--do_not_vacuum",
            action="store_true",
            help="Whether to VACUUM ANALYZE the database when new views are "
                 "added. Defaults to %(default)s. This option is only useful "
                 "while in development"
        )
        parser.add_argument(
            "-c",
            "--database_connection",
            default="hev_e",
            help="Name of the django DATABASES key that has the connection "
                 "details for the destination of the GED4All import. Defaults "
                 "to %(default)s"
        )
        parser.add_argument(
            "-d",
            "--ddl_file_path",
            help="Path to the file that has the SQL CREATE commands of the "
                 "GED4All database tables. If this path is supplied, the "
                 "database tables will be created"
        )
        parser.add_argument(
            "-f",
            "--data_file_path",
            help="Path to the file that has the data for the GED4All database "
                 "tables. If supplied, the data will be loaded into the "
                 "database and the HEV-E materialized views will be created "
                 "or refreshed (in case they already exist)"
        )
        parser.add_argument(
            "-g",
            "--geoserver_store_name",
            default="exposures",
            help="Name of the GeoServer store that will be used. Defaults to "
                 "%(default)s"
        )
        parser.add_argument(
            "-m",
            "--exposure_model_id",
            action="append",
            help="Limit processing of views to the supplied exposure model "
                 "id. This option can be specified multiple times. If not "
                 "specified, all exposure models will be processed"
        )
        parser.add_argument(
            "-n",
            "--sql_dry_run",
            action="store_true",
            help="Do not run any command, just output the commands SQL "
                 "commands that would get executed"
        )
        parser.add_argument(
            "-r",
            "--force_materialized_views_creation",
            action="store_true",
            help="Whether to DROP existing materialized views and recreate "
                 "them"
        )
        parser.add_argument(
            "-s",
            "--database_schema",
            default="exposures",
            help="Name of the database schema where data will be put. "
                 "Defaults to %(default)s"
        )
        parser.add_argument(
            "-u",
            "--username",
            help="Name of the user that will be the owner of the exposure "
                 "layers in geonode. Defaults to the first admin user "
                 "available"
        )
        parser.add_argument(
            "-x",
            "--force_schema_creation",
            action="store_true",
            help="Whether to import the DDL file path even if the target "
                 "schema already exists in the database"
        )

    def handle(self, *args, **options):
        db_connection = connections[options["database_connection"]]
        db_params = db_connection.get_connection_params()
        restricted = [int(i) for i in options["exposure_model_id"] or []]
        with db_connection.cursor() as db_cursor:
            exposure_models = get_exposure_models(db_cursor)  # does not need dry_run
            if any(restricted):
                models_to_use = [
                    m for m in exposure_models if m.id in restricted]
            else:
                models_to_use = exposure_models
            existing_views = handle_database_tasks(
                db_cursor,
                db_params,
                options["database_schema"],
                models_to_use,
                ddl_file_path=options["ddl_file_path"],
                data_file_path=options["data_file_path"],
                force_ddl=options["force_schema_creation"],
                force_views=options["force_materialized_views_creation"],
                perform_vacuum=not options["do_not_vacuum"],
                dry_run=options["sql_dry_run"],
                logger=self.stdout.write
            )
            taxonomy_details = {}
            if not options["sql_dry_run"]:
                for model in models_to_use:
                    view_name = general_utils.get_view_name(
                        model.id, model.name, model.category)
                    self.stdout.write(
                        "Gathering details for view {!r}...".format(view_name))
                    taxonomy_details[view_name] = {
                        "counts": utils.calculate_taxonomic_counts(
                            db_cursor, view_name,
                            schema_name=options["database_schema"]
                        )
                    }
        if not options["sql_dry_run"]:
            geoserver_layers = handle_geoserver_layers(
                existing_views,
                store_name=options["geoserver_store_name"],
                db_params=db_params,
                schema_name=options["database_schema"],
                logger=self.stdout.write
            )
            user = get_user(options["username"])
            self.stdout.write("Importing geoserver layers into geonode...")
            import_layers_to_geonode(
                workspace_name=geoserver_layers[0].workspace.name,
                store_name=geoserver_layers[0].store.name,
                user_name=user.username,
                stdout=self.stdout,
                stderr=self.stderr,
            )
            for model in models_to_use:
                complete_geonode_layer_import(
                    model, taxonomy_details, logger=self.stdout.write)


def get_user(name=None):
    user_model = get_user_model()
    if name is None:
        user = user_model.objects.filter(is_superuser=True).first()
    else:
        user = user_model.objects.get(username=name)
    return user


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


# TODO: Generalize this and the SQL function to handle other taxonomies
def install_normalize_gem_taxonomy_function(db_cursor, schema_name,
                                            dry_run=False, logger=print):
    """Installs PL/pgSQL function in the database for normalizing taxonomies"""
    function_name = "{}.normalize_taxonomy".format(schema_name)
    query_template = get_template("exposures/normalize_taxonomy_function.sql")
    occupancy_map = _get_gem_pairs("occupancy")
    material_map = _get_gem_pairs("construction_material")
    unfolded_material_map = _unfold_mapping(material_map)
    unfolded_occupancy_map = _unfold_mapping(occupancy_map)
    query = query_template.render(context={
        "function_name": function_name,
        "material_map": json.dumps(unfolded_material_map),
        "materials": [str(i) for i in unfolded_material_map.keys()],
        "default_material": material_map["unknown"][0],
        "occupancy_map": json.dumps(_unfold_mapping(occupancy_map)),
        "occupancies": [str(i) for i in unfolded_occupancy_map.keys()],
        "default_occupancy": occupancy_map["unknown"][0],
    })
    if dry_run:
        logger(query)
    else:
        db_cursor.execute(query)


# TODO: improve region detection (#40)
# TODO: add license
def complete_geonode_layer_import(exposure_model, taxonomy_details,
                                  logger=print):
    mapped_category = _utils.get_mapped_category(
        exposure_model.category)
    iso_19115_topic_category = settings.HEV_E["EXPOSURES"][
        "category_mappings"][mapped_category]["topic_category"]
    topic_category = TopicCategory.objects.get(
        identifier=iso_19115_topic_category)
    layer_name = general_utils.get_view_name(
        model_id=exposure_model.id,
        model_name=exposure_model.name,
        category=exposure_model.category,
    )
    logger("layer_name: {}".format(layer_name))
    layer = Layer.objects.get(name=layer_name)
    layer.title = layer_name.replace("_", " ").capitalize()
    layer.abstract = exposure_model.description
    layer.category = topic_category
    layer.is_approved = True
    layer.spatial_representation_type = SpatialRepresentationType.objects.get(
        identifier="vector")
    keywords = [
        mapped_category,
        exposure_model.taxonomy_source,
        DatasetType.exposure.name,
        "HEV-E",
    ]
    if exposure_model.tag_names is not None:
        keywords.extend(exposure_model.tag_names.split(" "))
    if exposure_model.area_type is not None:
        mapped_area_type = utils.get_mapped_area_type(exposure_model.area_type)
        keywords.append(mapped_area_type)
    else:
        mapped_area_type = None
    for keyword in keywords:
        layer.keywords.add(keyword)
    layer.save()
    det, created = models.HeveDetails.objects.get_or_create(layer=layer)
    det.dataset_type = DatasetType.exposure.name
    det.details = {
            "category": mapped_category,
            "taxonomy_source": exposure_model.taxonomy_source,
            "area_type": mapped_area_type,
            "taxonomic_categories": taxonomy_details.get(layer_name)
    }
    det.save()


def handle_geoserver_layers(view_names, store_name, db_params, schema_name,
                            logger=print):
    """Publish database views as GeoServer layers

    Parameters
    ----------
    view_pairs: list
        An iterable of two-element tuples with the names of the
        ``coarse`` and ``detail`` database views that are to be published
        as GeoServer layers
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
    layers = []
    for view_name in view_names:
        logger("Adding {!r} as a geoserver layer...".format(view_name))
        featuretype = gs_catalog.publish_featuretype(
            view_name, store, "EPSG:4326", srs="EPSG:4326")
        gs_catalog.save(featuretype)
        layers.append(featuretype)
    return layers


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


# TODO: improve plpgsql functions
def handle_database_tasks(db_cursor, db_params, schema_name, models_to_use,
                          ddl_file_path=None, data_file_path=None,
                          force_ddl=False, force_views=False,
                          perform_vacuum=True, dry_run=False,
                          logger=print):
    """Perform database ingestion of the GED4All data"""
    if ddl_file_path is not None:
        handle_database_schema(
            db_cursor, ddl_file_path, schema_name, force_ddl, db_params)
    if data_file_path is not None:
        logger("Importing data...")
        stdout, stderr = _load_sql_file(
            data_file_path,
            db_params["host"],
            db_params["database"],
            db_params["user"],
            search_path="{},public".format(schema_name)
        )
        logger("stdout: {}".format(stdout))
        logger("stderr: {}".format(stderr))
    logger("Installing custom database functions...")
    install_normalize_gem_taxonomy_function(
        db_cursor, schema_name, dry_run=dry_run, logger=logger)
    logger("Handling materialized views...")
    existing_views, created = handle_views(
        db_cursor, schema_name, models_to_use,
        force_views=force_views, dry_run=dry_run, logger=logger)
    if created and not dry_run and perform_vacuum:
        logger("VACUUMing the database...")
        db_cursor.execute("VACUUM ANALYZE")
    return existing_views


def handle_views(db_cursor, schema_name, models_to_use,
                     force_views=False, dry_run=False, logger=print):
    """Handle ingestion aspects that deal with database views

    This function will create a materialized view for each exposure model.
    Views are created, indexed and registered in postgis' catalogue.

    """

    models_with_full_geom = get_models_with_geom(
        db_cursor, schema_name, "full_geom")
    existing_views = get_materialized_views(db_cursor, "%")
    created = False
    result = []
    for model in models_to_use:
        name = general_utils.get_view_name(
            model.id, model.name, model.category)
        mapped_category = _utils.get_mapped_category(model.category)
        view_mappings = settings.HEV_E["EXPOSURES"]["category_mappings"][
            mapped_category]["view_geometries"]
        coarse_geom_column = view_mappings["coarse_geometry_column"]
        coarse_geom_type = view_mappings["coarse_geometry_type"]
        result.append(name)
        if not (name in existing_views) or force_views:
            logger("Creating view {!r}...".format(name))
            detail_qualified_name = "{schema}.{name}".format(
                schema=schema_name, name=name)
            create_view(
                db_cursor,
                detail_qualified_name,
                model.id,
                has_full_geom=model.id in models_with_full_geom,
                coarse_geom_col=coarse_geom_column,
                coarse_geom_type=coarse_geom_type,
                detail_geom_col=view_mappings["detail_geometry_column"],
                detail_geom_type=view_mappings["detail_geometry_type"],
                dry_run=dry_run,
                logger=logger
            )
            logger("Refreshing view {!r}...".format(name))
            _utils.refresh_view(db_cursor, detail_qualified_name,
                                dry_run=dry_run, logger=logger)
            created = True
    return result, created


def get_models_with_geom(db_cursor, schema_name, geom_column_name):
    query = """
    SELECT DISTINCT exposure_model_id
    FROM {schema}.asset
    WHERE {geom} IS NOT NULL
    """.format(schema=schema_name, geom=geom_column_name)
    db_cursor.execute(query)
    return [row[0] for row in db_cursor.fetchall()]


def handle_database_schema(db_cursor, ddl_file_path, schema_name,
                           force_ddl, db_params, logger=print):
    schema_already_exists = schema_exists(db_cursor, schema_name)
    if schema_already_exists and not force_ddl:
        create_tables = False
        logger(
            "A schema named {!r} already exists in the target "
            "database. Ignoring DDL file...".format(schema_name)
        )
    elif schema_already_exists:
        create_tables = True
        logger("Removing pre-existing {!r} schema and all "
               "objects it contains...".format(schema_name))
        db_cursor.execute("DROP SCHEMA {} CASCADE".format(schema_name))
    else:
        create_tables = True
    if create_tables:
        logger("Creating database tables...")
        _load_sql_file(
            ddl_file_path,
            db_params["host"],
            db_params["database"],
            db_params["user"]
        )
    rename_schema(db_cursor, "level2", schema_name)


def schema_exists(db_cursor, schema_name):
    query = """
            SELECT EXISTS(
                SELECT schema_name 
                FROM information_schema.schemata 
                WHERE schema_name = %(name)s)
        """
    db_cursor.execute(query, {"name": schema_name})
    return db_cursor.fetchone()[0]


def rename_schema(db_cursor, old_name, new_name):
    try:
        db_cursor.execute("ALTER SCHEMA {old} RENAME TO {new}".format(
            old=old_name, new=new_name))
    except ProgrammingError:  # schema with old_name does not exist
        new_exists = schema_exists(db_cursor, new_name)
        if not new_exists:
            raise RuntimeError(
                "Could not rename {!r} schema but could not find an "
                "existing {!r} schema".format(old_name, new_name)
            )


def create_view(db_cursor, name, model_id, has_full_geom,
                coarse_geom_col, coarse_geom_type,
                detail_geom_col, detail_geom_type,
                dry_run=False, logger=print):
    _utils.drop_materialized_view(db_cursor, name,
                                  dry_run=dry_run, logger=logger)
    if has_full_geom:
        geom_col_detail = detail_geom_col
        geom_type_detail = detail_geom_type
    else:
        geom_col_detail = coarse_geom_col
        geom_type_detail = coarse_geom_type
    create_materialized_view(
        db_cursor,
        name,
        model_id,
        coarse_geometry_column=coarse_geom_col,
        coarse_geometry_type=coarse_geom_type,
        detail_geometry_column=geom_col_detail,
        detail_geometry_type=geom_type_detail,
        dry_run=dry_run,
        logger=logger
    )


def _get_geometry_type_clause(geometry_type, geometry_column):
    if "multi" in geometry_type.lower():
        result = "ST_Multi({})".format(geometry_column)
    else:
        result = geometry_column
    return result


def create_materialized_view(db_cursor, view_name,
                             exposure_model_id, coarse_geometry_column,
                             coarse_geometry_type, detail_geometry_column,
                             detail_geometry_type,
                             dry_run=False,
                             logger=print):
    schema_name, base_name = view_name.partition(".")[::2]
    query_template = get_template(
        "exposures/create_materialized_view_query.sql")
    coarse_clause = _get_geometry_type_clause(
        coarse_geometry_type, coarse_geometry_column)
    detail_clause = _get_geometry_type_clause(
        detail_geometry_type, detail_geometry_column)
    query = query_template.render(context={
        "name": view_name,
        "schema": schema_name,
        "coarse_geometry_column_clause": coarse_clause,
        "coarse_numeric_type": (1 if "Point" in coarse_geometry_type else
                         2 if "Line" in coarse_geometry_type else 3),
        "coarse_geometry_type": coarse_geometry_type,
        "detail_geometry_column_clause": detail_clause,
        "detail_numeric_type": (1 if "Point" in detail_geometry_type else
                                2 if "Line" in detail_geometry_type else 3),
        "detail_geometry_type": detail_geometry_type,
        "exposure_model_id": exposure_model_id,
    })
    if dry_run:
        logger(query)
    else:
        db_cursor.execute(query)
    geometry_columns_query = """
    SELECT Populate_Geometry_Columns(%(name)s::regclass)
    """
    if dry_run:
        logger(geometry_columns_query)
    else:
        db_cursor.execute(geometry_columns_query, {"name": view_name})
    indexes = {
        "id": "unique",
        "parsed_taxonomy": "btree",
        "geom": "gist",
        "full_geom": "gist",
    }
    for index_column, index_type in indexes.items():
        index_name = "{}_{}_idx".format(base_name, index_column)
        logger("Creating index {!r}...".format(index_name))
        db_cursor.execute("DROP INDEX IF EXISTS {} CASCADE".format(index_name))
        if index_type == "unique":
            index_query = """
            CREATE UNIQUE INDEX {index_name} ON {table} ({column})
            """.format(
                index_name=index_name,
                table=base_name,
                column=index_column,
            )
        else:
            index_query = """
            CREATE index {index_name} 
            ON {table} 
            USING {index_type} ({column})
            """.format(
                index_name=index_name,
                table=base_name,
                index_type=index_type,
                column=index_column,
            )
        if dry_run:
            logger(index_query)
        else:
            db_cursor.execute(index_query)


def get_exposure_models(db_cursor):
    """Retrieve relevant exposure models from GED4All DB

    Relevant exposure models are those whose ``category`` column maps to one
    of the existing categories in the
    ``settings.HEV-E["EXPOSURES"]["category_mappings"]`` mapping.

    """

    query = """
        SELECT 
            id, 
            name, 
            description,
            taxonomy_source,
            category,
            area_type,
            area_unit,
            tag_names
        FROM exposures.exposure_model
    """
    db_cursor.execute(query)
    ResultTuple = namedtuple(
        "ResultTuple", [col[0] for col in db_cursor.description])
    result = []
    for row in db_cursor.fetchall():
        exposure_model = ResultTuple(*row)
        try:
            _utils.get_mapped_category(exposure_model.category)
            result.append(exposure_model)
        except RuntimeError:
            pass  # we are not interested in using this exposure model in HEV-E
    return result


def get_materialized_views(db_cursor, view_name_pattern):
    query = """
    SELECT oid::regclass::text
    FROM pg_class
    WHERE relkind = 'm' 
        AND oid::regclass::text ILIKE %(pattern)s
    """
    db_cursor.execute(query, {"pattern": view_name_pattern})
    return [row[0] for row in db_cursor.fetchall()]


def _get_gem_pairs(taxonomic_category):
    config = settings.HEV_E[
        "EXPOSURES"]["taxonomy_mappings"]["mapping"][taxonomic_category]
    return {k: v.get("GEM") for k, v in config.items() if v.get("GEM")}


def _load_sql_file(path, host, name, user, search_path=None):
    command = [
        "psql",
        "dbname={}".format(name),
        "--single-transaction",
        "--host={}".format(host),
        "--username={}".format(user),
        "--file={}".format(path),
        "--variable=ON_ERROR_STOP=1",
    ]
    if search_path is not None:
        # this is a hacky way to set the search_path
        command[1] = "dbname={} options=--search_path={}".format(
            name, search_path)
    process_ = subprocess.Popen(
        command,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return process_.communicate()


def _unfold_mapping(mapping):
    result = {}
    for key, values_list in mapping.items():
        for value in values_list:
            result[value] = key
    return result
