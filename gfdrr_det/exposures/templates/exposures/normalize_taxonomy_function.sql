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
        simplified_parts text[];
        taxonomy_parts text[];
    BEGIN
        -- TODO: Enhance this function in order to account for other taxonomies
        taxonomy_parts := string_to_array(raw_taxonomy, '/');
        FOREACH part IN ARRAY taxonomy_parts
        LOOP
            simplified_parts := array_append(simplified_parts, split_part(part, '+', 1));
        END LOOP;
        num_parts = array_length(simplified_parts, 1);
        IF num_parts > 0 AND num_parts <= 16 THEN
            FOREACH part IN ARRAY simplified_parts
            LOOP
                IF ARRAY[part] <@ relevant_materials THEN
                    material := part;
                    RAISE NOTICE 'found material: %', material;
                ELSIF left(part, 1) = 'Y' THEN
                    construction_date := part;
                    RAISE NOTICE 'found construction_date: %', construction_date;
                ELSIF ARRAY[part] <@ relevant_occupancies THEN
                    occupancy := part;
                    RAISE NOTICE 'found occupancy: %', occupancy;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        date_parts := string_to_array(construction_date, ':');
        normalized_material := material_map ->> material;
        normalized_occupancy := occupancy_map ->> occupancy;
        IF date_parts[1] = 'Y99' THEN
            normalized_date = 'unknown';
        ELSIF date_parts[1] IN ('YEX', 'YPRE', 'YAPP', 'YBET') THEN
            normalized_date = date_parts[2];
        END IF;
        normalized_text := concat_ws(
                '#',
                'material:' || normalized_material,
                'occupancy:' || normalized_occupancy,
                'construction_date:' || normalized_date
            );
        RETURN;
    END;
$$ LANGUAGE plpgsql;
