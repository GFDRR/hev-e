CREATE OR REPLACE FUNCTION {{ function_name }}(
    raw_taxonomy varchar,
    OUT normalized_text varchar
) AS $$
    DECLARE
        construction_date text := 'Y99';
        date_parts text[];
        material text := '{{ default_material }}';
        material_map jsonb := '{{ material_map|safe }}';
        material_x text;
        material_y text;
        normalized_date text;
        normalized_material text;
        normalized_occupancy text;
        num_parts integer;
        occupancy text := '{{ default_occupancy }}';
        occupancy_map jsonb := '{{ occupancy_map|safe }}';
        part text;
        relevant_materials text[] := ARRAY{{ materials|safe }};
        relevant_occupancies text[] := ARRAY{{ occupancies|safe }};
        simplified_part text;
        taxonomy_parts text[];
    BEGIN
        -- TODO: Enhance this function in order to account for other taxonomies
        taxonomy_parts := string_to_array(raw_taxonomy, '/');
        num_parts = array_length(taxonomy_parts, 1);
        IF num_parts > 0 AND num_parts <= 16 THEN
            FOREACH part IN ARRAY taxonomy_parts
            LOOP
                simplified_part := split_part(part, '+', 1);
                IF ARRAY[simplified_part] <@ relevant_materials THEN
                    material := simplified_part;
                ELSIF left(simplified_part, 1) = 'Y' THEN
                    construction_date := simplified_part;
                ELSIF ARRAY[simplified_part] <@ relevant_occupancies THEN
                    occupancy := simplified_part;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        normalized_material := material_map ->> material;
        normalized_occupancy := occupancy_map ->> occupancy;
        date_parts := string_to_array(construction_date, ':');
        IF date_parts[1] = 'Y99' THEN
            normalized_date = 'unknown';
        ELSIF date_parts[1] IN ('YEX', 'YPRE', 'YAPP', 'YBET') THEN
            normalized_date = date_parts[2];
        END IF;
        normalized_text := concat_ws(
                '#',
                'construction_material:' || normalized_material,
                'occupancy:' || normalized_occupancy,
                'construction_date:' || normalized_date
            ) || '#';
        RETURN;
    END;
$$ LANGUAGE plpgsql;
