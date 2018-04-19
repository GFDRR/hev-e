SELECT
  d.dm_states_name AS damage_scale_dm_states_name,
  d.dm_scale_reference AS damage_scale_reference,
  dtl.asset,
  dtl.country_iso,
  dtl.damage_scale_name,
  dtl.dtl_parameters,
  dtl.dtl_parameters_values,
  dtl.dtl_pdf_type,
  dtl.hazard,
  dtl.id,
  dtl.reference,
  dtl.scale_applicability,
  dtl.dm_scale_type,
  dtl.sub_asset,
  dtl.taxonomy,
  r.title AS reference_title,
  r.author_year AS reference_author_year
FROM vulnerabilities.dtl_table AS dtl
  LEFT OUTER JOIN vulnerabilities.damage_scale AS d ON (d.damage_scale_name = dtl.damage_scale_name)
  LEFT OUTER JOIN vulnerabilities.reference_table AS r ON (r.author_year = dtl.reference)
WHERE dtl.id = %(pk)s
