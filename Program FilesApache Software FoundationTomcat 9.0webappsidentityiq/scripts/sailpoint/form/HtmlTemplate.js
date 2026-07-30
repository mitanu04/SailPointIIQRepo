/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Represents a block of content that can be added to a form. You
 * may also include parameters which will be applied to the
 * text before it's rendered. In order to use the parameters
 * you'll need to use ext XTemplate notation.
 *
 */
Ext.define('SailPoint.form.HtmlTemplate', {
	extend : 'Ext.form.field.Display',
	alias : 'widget.htmltemplate',


    /**
     * @cfg html {String} html to markup to render in this component. This may use
     * ext XTemplate notation. We'll apply the templateParameters object to this
     * html before we display.
     */
    value:'',

    /**
     * @cfg templateParameters {Object} parameters to pass into the html template string.
     */
    templateParameters : null,

    isFormField : false,

    constructor : function(config) {

        if (config.fieldLabel)
            config.isFormField = true;

        // IIQFW-1: Don't render HTML in text content by default.
        // Instead, force the user to acknowledge that HTML needs to be rendered and that any
        // dynamic content has been previously escaped.
        // If an ExtJS XTemplate is used, we escape the values rather than the template itself, since
        // the template is typically static formatting HTML and not user-entered content.
        config.html = config.value;
        if (config.templateParameters) {
            var xtemp = new Ext.XTemplate(config.value);

            if (!config.contentIsEscaped) {
                config.templateParameters = escapeValues(config.templateParameters);
            }

            config.value = config.html = xtemp.apply(config.templateParameters);
        } else if (!config.contentIsEscaped) {
            config.value = config.html = Ext.String.htmlEncode(config.value);
        }
        
        this.callParent(arguments);
    }
    
});

// Utility functions to escape the contents of templateParameter objects/arrays
function escapeValues(params) {
    if (params) {
        if (Array.isArray(params)) {
            return escapeArray(params);
        } else if (typeof params === 'object') {
            return escapeMap(params);
        } else if (typeof params === 'string') {
            return Ext.String.htmlEncode(params);
        }
    }

    return params;
}

function escapeMap(map) {
    for (var key of Object.keys(map)) {
        map[key] = escapeValues(map[key]);
    }

    return map;
}

function escapeArray(array) {
    return array.map((value) => escapeValues(value));
}