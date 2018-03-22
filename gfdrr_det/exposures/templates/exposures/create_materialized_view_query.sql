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
        occ.period,
        occ.occupants,
        c.value AS cost_value,
        mct.cost_type_name AS cost_type,
        mct.aggregation_type AS cost_aggregation_type,
        mct.unit AS cost_unit,
        {{ schema }}.normalize_taxonomy(a.taxonomy) AS hev_e_taxonomy,
        ST_CollectionExtract(
            a.{{ geometry_column }},
            {{ numeric_type }}
        )::geometry({{ geometry_type }}, 4326) AS geom
    FROM {{ schema }}.asset AS a
        JOIN {{ schema }}.exposure_model as m ON m.id = a.exposure_model_id
        LEFT JOIN {{ schema }}.cost AS c ON c.asset_id = a.id
        LEFT JOIN {{ schema }}.model_cost_type AS mct ON (
            mct.id = c.cost_type_id
        )
        LEFT JOIN {{ schema }}.occupancy AS occ ON occ.asset_id = a.id
    WHERE m.id = %(exposure_model_id)s
WITH NO DATA
