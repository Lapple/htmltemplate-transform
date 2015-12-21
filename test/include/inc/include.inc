<TMPL_BLOCK decorated_title>
    <b><TMPL_VAR title></b>
</TMPL_BLOCK>

<h1>
    <TMPL_INLINE decorated_title
        title=[% 'Included' %]>
    <TMPL_INCLUDE ./nested-include.inc
        title="Nested">
</h1>
