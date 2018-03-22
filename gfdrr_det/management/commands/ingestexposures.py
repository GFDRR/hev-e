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
import django.utils.text
from geonode.layers.models import Layer
from geonode.base.models import SpatialRepresentationType
from geonode.base.models import TopicCategory
from geoserver.catalog import Catalog


class Command(BaseCommand):
    help = "Integrate with the GED4All exposures database"

    def add_arguments(self, parser):
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
            "-x",
            "--force_schema_creation",
            action="store_true",
            help="Whether to import the DDL file path even if the target "
                 "schema already exists in the database"
        )
        parser.add_argument(
            "-r",
            "--force_materialized_views_creation",
            action="store_true",
            help="Whether to DROP existing materialized views and recreate "
                 "them"
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
            "-g",
            "--geoserver_store_name",
            default="exposures",
            help="Name of the GeoServer store that will be used. Defaults to "
                 "%(default)s"
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
            "-m",
            "--exposure_model_id",
            action="append",
            help="Limit processing of views to the supplied exposure model "
                 "id. This option can be specified multiple times. If not "
                 "specified, all exposure models will be processed"
        )

    def handle(self, *args, **options):
        db_connection = connections[options["database_connection"]]
        db_params = db_connection.get_connection_params()
        restricted = [int(i) for i in options["exposure_model_id"] or []]
        with db_connection.cursor() as db_cursor:
            exposure_models = get_exposure_models(db_cursor)
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
                logger=self.stdout.write
            )
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
            filter_="coarse"
        )
        for model in models_to_use:
            complete_geonode_layer_import(
                model, name_suffix="coarse", logger=self.stdout.write)


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


def _unfold_mapping(mapping):
    result = {}
    for key, values_list in mapping.items():
        for value in values_list:
            result[value] = key
    return result


def install_normalize_gem_taxonomy_function(db_cursor, schema_name,
                                            logger=print):
    """Installs PL/pgSQL function in the database for normalizing taxonomies"""
    function_name = "{}.normalize_taxonomy".format(schema_name)
    query_template = get_template("exposures/normalize_taxonomy_function.sql")
    occupancy_map = settings.HEV_E[
        "EXPOSURES"]["taxonomy_mappings"]["GEM"]["occupancy"]
    material_map = settings.HEV_E[
        "EXPOSURES"]["taxonomy_mappings"]["GEM"]["material"]
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
    db_cursor.execute(query)


def get_hev_e_category(model_category, category_maps):
    """Map the exposure model category to the naming used in HEV-E"""
    for hev_e_category, maps in category_maps.items():
        if model_category.lower() in maps["exposure_model_categories"]:
            result = hev_e_category
            break
    else:
        raise RuntimeError("Could not determine the HEV-E category to map "
                           "with {!r}".format(model_category))
    return result


def get_hev_e_area_type(model_area_type, area_types_mapping):
    """Map the exposure model category to the naming used in HEV-E"""
    for hev_e_area_type, aliases in area_types_mapping.items():
        if model_area_type.lower() in aliases:
            result = hev_e_area_type
            break
    else:
        raise RuntimeError("Could not determine the HEV-E area type to map "
                           "with {!r}".format(model_area_type))
    return result


# TODO: improve region detection (#40)
# TODO: add license
def complete_geonode_layer_import(exposure_model, name_suffix="",
                                  logger=print):
    category_maps = settings.HEV_E["EXPOSURES"]["category_mappings"]
    mapped_category = get_hev_e_category(
        exposure_model.category, category_maps)
    iso_19115_topic_category = category_maps[mapped_category]["topic_category"]
    topic_category = TopicCategory.objects.get(
        identifier=iso_19115_topic_category)
    layer_name = get_view_name(
        model_id=exposure_model.id,
        model_name=exposure_model.name,
        category=exposure_model.category,
        suffix=name_suffix
    )
    logger("layer_name: {}".format(layer_name))
    layer = Layer.objects.get(name=layer_name)
    layer.title = get_humanized_view_name(
        exposure_model.id, exposure_model.name, exposure_model.category,
        suffix=name_suffix
    )
    layer.abstract = exposure_model.description
    layer.category = topic_category
    layer.is_approved = True
    layer.spatial_representation_type = SpatialRepresentationType.objects.get(
        identifier="vector")
    area_types_mapping = settings.HEV_E["EXPOSURES"]["area_type_mappings"]
    keywords = [
        mapped_category,
        exposure_model.taxonomy_source,
        "exposure",
        "HEV-E",
    ]
    if exposure_model.tag_names is not None:
        keywords.extend(exposure_model.tag_names.split(" "))
    if exposure_model.area_type is not None:
        mapped_area_type = get_hev_e_area_type(
            exposure_model.area_type, area_types_mapping)
        keywords.append(mapped_area_type)
    for keyword in keywords:
        layer.keywords.add(keyword)
    layer.save()


def handle_geoserver_layers(view_pairs, store_name, db_params, schema_name,
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
    for view_pair in view_pairs:
        for item in view_pair:
            logger("Adding {!r} as a geoserver layer...".format(item))
            featuretype = gs_catalog.publish_featuretype(
                item, store, "EPSG:4326", srs="EPSG:4326")
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
                          force_ddl=False, force_views=False, logger=print):
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
        db_cursor, schema_name, logger=logger)
    logger("Handling materialized views...")
    existing_views, created = handle_views(
        db_cursor, schema_name, models_to_use,
        force_views=force_views, logger=logger)
    if created:
        logger("VACUUMing the database...")
        db_cursor.execute("VACUUM ANALYZE")
    return existing_views


def handle_views(db_cursor, schema_name, models_to_use,
                 force_views=False, logger=print):
    """Handle ingestion aspects that deal with database views

    This function will create two materialized views for each exposure model:

    * coarse view - uses the simple geometry that is in the model's assets
    * detail view - uses the full geometry of each asset, if it exists. if
    there is no full geometry it uses the same geometry as the coarse view.

    Views are created, indexed and registered in postgis' catalogue.

    """

    models_with_full_geom = get_models_with_geom(
        db_cursor, schema_name, "full_geom")
    existing_detail = get_materialized_views(db_cursor, "%_detail")
    existing_coarse = get_materialized_views(db_cursor, "%_coarse")
    cat_mappings = settings.HEV_E["EXPOSURES"]["category_mappings"]
    created = False
    result = []
    for model in models_to_use:
        detail_name = get_view_name(
            model.id, model.name, model.category, suffix="detail")
        coarse_name = get_view_name(
            model.id, model.name, model.category, suffix="coarse")
        mapped_category = get_hev_e_category(model.category, cat_mappings)
        view_mappings = cat_mappings[mapped_category]["view_geometries"]
        coarse_geom_column = view_mappings["coarse_geometry_column"]
        coarse_geom_type = view_mappings["coarse_geometry_type"]
        result.append((coarse_name, detail_name))
        if not (coarse_name in existing_coarse) or force_views:
            logger("Creating coarse view {!r}...".format(coarse_name))
            coarse_qualified_name = "{schema}.{name}".format(
                schema=schema_name, name=coarse_name)
            create_coarse_view(
                db_cursor,
                coarse_qualified_name,
                model.id,
                coarse_geom_column,
                coarse_geom_type,
                logger=logger)
            logger("Refreshing view {!r}...".format(coarse_name))
            refresh_view(db_cursor, coarse_qualified_name)
            created = True
        if not (detail_name in existing_detail) or force_views:
            logger("Creating detail view {!r}...".format(detail_name))
            detail_qualified_name = "{schema}.{name}".format(
                schema=schema_name, name=detail_name)
            create_detail_view(
                db_cursor,
                detail_qualified_name,
                model.id,
                has_full_geom=model.id in models_with_full_geom,
                coarse_geom_col=coarse_geom_column,
                coarse_geom_type=coarse_geom_type,
                detail_geom_col=view_mappings["detail_geometry_column"],
                detail_geom_type=view_mappings["detail_geometry_type"],
                logger=logger
            )
            logger("Refreshing view {!r}...".format(detail_name))
            refresh_view(db_cursor, detail_qualified_name)
            created = True
    return result, created


def create_coarse_view(db_cursor, name, model_id, geom_col, geom_type,
                       logger=print):
    drop_materialized_view(db_cursor, name)
    create_materialized_view(db_cursor, name, model_id, geom_col, geom_type,
                             logger=logger)


def create_detail_view(db_cursor, name, model_id, has_full_geom,
                       coarse_geom_col, coarse_geom_type,
                       detail_geom_col, detail_geom_type,
                       logger=print):
    drop_materialized_view(db_cursor, name)
    if has_full_geom:
        geom_col_detail = detail_geom_col
        geom_type_detail = detail_geom_type
    else:
        geom_col_detail = coarse_geom_col
        geom_type_detail = coarse_geom_type
    create_materialized_view(db_cursor, name, model_id, geom_col_detail,
                             geom_type_detail, logger=logger)


def get_models_with_geom(db_cursor, schema_name, geom_column_name):
    query = """
    SELECT DISTINCT exposure_model_id
    FROM {schema}.asset
    WHERE {geom} IS NOT NULL
    """.format(schema=schema_name, geom=geom_column_name)
    db_cursor.execute(query)
    return [row[0] for row in db_cursor.fetchall()]


def get_humanized_view_name(model_id, model_name, category, prefix="",
                            suffix="", separator="_"):
    view_name = get_view_name(
        model_id,
        model_name,
        category,
        prefix=prefix,
        suffix=suffix,
        separator=separator
    )
    return view_name.replace(separator, " ").capitalize()


def get_view_name(model_id, model_name, category, prefix="", suffix="",
                  separator="_"):
    """Return a name for a view that is also a valid GeoServer layer name"""
    pattern = "{prefix}{name}{sep}{category}{sep}{id}{suffix}"
    final_prefix = "{prefix}{sep}".format(
        prefix=prefix, sep=separator) if prefix != "" else prefix
    final_suffix = "{sep}{suffix}".format(
        suffix=suffix, sep=separator) if suffix != "" else suffix
    return django.utils.text.slugify(
        pattern.format(
            prefix=final_prefix,
            sep=separator,
            id=model_id,
            name=model_name,
            category=category,
            suffix=final_suffix
        )
    ).replace("-", separator)


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


def drop_materialized_view(db_cursor, view_name):
    db_cursor.execute(
        "DROP MATERIALIZED VIEW IF EXISTS {} CASCADE".format(view_name))


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


def create_materialized_view(db_cursor, view_name,
                             exposure_model_id, geometry_column,
                             geometry_type, logger=print):
    schema_name, base_name = view_name.partition(".")[::2]
    query_template = get_template(
        "exposures/create_materialized_view_query.sql")
    query = query_template.render(context={
        "name": view_name,
        "schema": schema_name,
        "geometry_column": geometry_column,
        "numeric_type": (1 if "Point" in geometry_type else
                         2 if "Line" in geometry_type else 3),
        "geometry_type": geometry_type,
    })
    db_cursor.execute(query, {"exposure_model_id": exposure_model_id})
    db_cursor.execute(
        "SELECT Populate_Geometry_Columns(%(name)s::regclass)",
        {"name": view_name}
    )
    indexes = {
        "id": "btree",
        "geom": "gist",
        "hev_e_taxonomy": "btree",
    }
    for index_column, index_type in indexes.items():
        index_name = "{}_{}_idx".format(base_name, index_column)
        logger("Creating index {!r}...".format(index_name))
        db_cursor.execute("DROP INDEX IF EXISTS {} CASCADE".format(index_name))
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
        db_cursor.execute(index_query)


def old_create_materialized_view(db_cursor, view_name, schema_name,
                                 exposure_model_id, category, logger=print):
    qualified_name = "{}.{}".format(schema_name, view_name)
    query = """
    CREATE MATERIALIZED VIEW {name} AS
        SELECT
            a.id,
            m.name AS model_name,
            m.description AS model_description,
            m.category,
            a.taxonomy,
            m.taxonomy_source,
            a.number_of_units,
            a.area,
            m.area_type,
            m.area_unit,
            m.tag_names,
            occ.period,
            occ.occupants,
            c.value AS cost_value,
            mct.cost_type_name AS cost_type,
            mct.aggregation_type AS cost_aggregation_type,
            mct.unit AS cost_unit,
            a.the_geom,
            a.full_geom
        FROM {schema}.asset AS a
            JOIN {schema}.exposure_model as m ON m.id = a.exposure_model_id
            LEFT JOIN {schema}.cost AS c ON c.asset_id = a.id
            LEFT JOIN {schema}.model_cost_type AS mct ON (
                mct.id = c.cost_type_id
            )
            LEFT JOIN {schema}.occupancy AS occ ON occ.asset_id = a.id
        WHERE m.id = %(exposure_model_id)s
            AND m.category = %(category)s
    WITH NO DATA
    """.format(schema=schema_name, name=qualified_name)
    db_cursor.execute(query, {
        "exposure_model_id": exposure_model_id,
        "category": category
    })
    db_cursor.execute(
        "SELECT Populate_Geometry_Columns(%(name)s::regclass)",
        {"name": qualified_name}
    )
    indexes = {
        "id": "btree",
        "the_geom": "gist",
        "full_geom": "gist",
    }
    for index_column, index_type in indexes.items():
        index_name = "{}_{}_idx".format(view_name, index_column)
        logger("Creating index {!r}...".format(index_name))
        db_cursor.execute("DROP INDEX IF EXISTS {} CASCADE".format(index_name))
        index_query = """
        CREATE index {index_name} ON {table} USING {index_type} ({column})
        """.format(
            index_name=index_name,
            table=view_name,
            index_type=index_type,
            column=index_column,
        )
        db_cursor.execute(index_query)


def refresh_view(db_cursor, view_name):
    db_cursor.execute(
        "REFRESH MATERIALIZED VIEW {} WITH DATA".format(view_name))


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
    category_maps = settings.HEV_E["EXPOSURES"]["category_mappings"]
    result = []
    for row in db_cursor.fetchall():
        exposure_model = ResultTuple(*row)
        try:
            get_hev_e_category(exposure_model.category, category_maps)
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
