CREATE MATERIALIZED VIEW {{ name }} AS
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
        {{ schema }}.normalize_taxonomy(a.taxonomy) AS parsed_taxonomy,
        ST_CollectionExtract(
            ST_Multi({{ coarse_geometry_column }}),
            {{ coarse_numeric_type }}
        )::geometry({{ coarse_geometry_type }}, 4326) AS geom,
        ST_CollectionExtract(
            ST_Multi({{ detail_geometry_column }}),
            {{ detail_numeric_type }}
        )::geometry({{ detail_geometry_type }}, 4326) AS full_geom
    FROM {{ schema }}.asset AS a
        JOIN {{ schema }}.exposure_model as m ON m.id = a.exposure_model_id
    WHERE m.id = {{ exposure_model_id }}
WITH NO DATA
