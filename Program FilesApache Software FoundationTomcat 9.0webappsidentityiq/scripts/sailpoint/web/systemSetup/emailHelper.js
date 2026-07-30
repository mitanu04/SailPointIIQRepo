/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/web/systemSetup/EmailHelper.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.web.systemSetup");


Ext.define('sailpoint.web.systemSetup.NotifierType', {

    statics : {
    	HTTP: 0
        , Smtp: 1
        , RedirectToEmail: 2
        , RedirectToFile: 3
    }
});


Ext.define('sailpoint.web.systemSetup.EncryptionType', {

    statics : {
        NONE: 0
        , SSL: 1
        , TLS: 2
    }
});

Ext.define('sailpoint.web.systemSetup.EmailHelper', {
    constructor : function () {
        this.notifierTypeElement = Ext.get("editForm:emailNotifierType");
        this.redirectingEmailAddressRowElement = Ext.get("redirectingEmailAddressRow");
        this.redirectingEmailAddressRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.redirectingFilenameRowElement = Ext.get("redirectingFilenameRow");
        this.redirectingFilenameRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpEncryptionTypeElement = Ext.get("editForm:smtpEncryptionType");
        this.smtpHostRowElement = Ext.get("smtpHostRow");
        this.smtpHostRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpPortRowElement = Ext.get("smtpPortRow");
        this.smtpPortRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpFromAddressRowElement = Ext.get("smtpFromAddressRow");
        this.smtpFromAddressRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpEncryptionTypeRowElement = Ext.get("smtpEncryptionTypeRow");
        this.smtpEncryptionTypeRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpUsernameRow = Ext.get("smtpUsernameRow");
        this.smtpUsernameRow.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpPasswordRow = Ext.get("smtpPasswordRow");
        this.smtpPasswordRow.setVisibilityMode(Ext.Element.DISPLAY);
        this.smtpConfirmPasswordRow = Ext.get("smtpConfirmPasswordRow");
        this.smtpConfirmPasswordRow.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailServiceEndpointRowElement = Ext.get("emailServiceEndpointRow");
        this.emailServiceEndpointRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailTokenEndpointRowElement = Ext.get("emailTokenEndpointRow");
        this.emailTokenEndpointRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailRefreshTokenEndpointRowElement = Ext.get("emailRefreshTokenEndpointRow");
        this.emailRefreshTokenEndpointRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailScopeRowElement = Ext.get("emailScopeRow");
        this.emailScopeRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailClientIdRowElement = Ext.get("emailClientIdRow");
        this.emailClientIdRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailClientSecretRowElement = Ext.get("emailClientSecretRow");
        this.emailClientSecretRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailConnectionTimeoutRowElement = Ext.get("emailConnectionTimeoutRow");
        this.emailConnectionTimeoutRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.emailReadTimeoutRowElement = Ext.get("emailReadTimeoutRow");
        this.emailReadTimeoutRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this.testEmailConnectionRowElement = Ext.get("testEmailConnectionRow");
        this.testEmailConnectionRowElement.setVisibilityMode(Ext.Element.DISPLAY);
        this._debug = false;
    }

    , notifierTypeElement : null
    , redirectingEmailAddressRowElement : null
    , redirectingFilenameRowElement : null
    , smtpEncryptionTypeElement : null
    , smtpHostRowElement : null
    , smtpPortRowElement : null
    , smtpFromAddressRowElement : null
    , smtpEncryptionTypeRowElement : null
    , smtpUsernameRow : null
    , smtpPasswordRow : null
    , smtpConfirmPasswordRow : null
    , emailServiceEndpointRowElement : null
    , emailTokenEndpointRowElement : null
    , emailRefreshTokenEndpointRowElement : null
    , emailScopeRowElement : null
    , emailClientIdRowElement : null
    , emailClientSecretRowElement : null
    , emailConnectionTimeoutRowElement : null
    , emailReadTimeoutRowElement : null
    , testEmailConnectionRowElement : null
    , _debug : false
    , initialize : function () {
        this.debug("initialize()");
        this.onNotifierTypeChange();
    }
    , findNotifierType : function () {
        this.debug("findNotifierType()");
        return this.notifierTypeElement.dom.selectedIndex;
    }
    , findSmtpEncryptionType : function () {
        this.debug("findSmtpEncryptionType()");
        return this.smtpEncryptionTypeElement.dom.selectedIndex;
    }
    , debug : function (msg) {
        if (this._debug == true) {
        console.warn(msg);
        }
    }
    , onNotifierTypeChange : function () {
        this.debug("onNotifierTypeChange()");
        var notifierType = this.findNotifierType();
        this.debug("notifierType: " + notifierType);
        if (notifierType == sailpoint.web.systemSetup.NotifierType.HTTP) {
            this.redirectingEmailAddressRowElement.hide();
            this.redirectingFilenameRowElement.hide();
            this.smtpHostRowElement.hide();
            this.smtpPortRowElement.hide();
            this.smtpFromAddressRowElement.hide();
            this.smtpUsernameRow.hide();
            this.smtpPasswordRow.hide();
            this.smtpConfirmPasswordRow.hide();
            this.smtpEncryptionTypeRowElement.hide();
            this.emailServiceEndpointRowElement.show();
            this.emailTokenEndpointRowElement.show();
            this.emailRefreshTokenEndpointRowElement.show();
            this.emailScopeRowElement.show();
            this.emailClientIdRowElement.show();
            this.emailClientSecretRowElement.show();
            this.emailConnectionTimeoutRowElement.hide();
            this.emailReadTimeoutRowElement.hide();
            this.testEmailConnectionRowElement.show();
        } else if (notifierType == sailpoint.web.systemSetup.NotifierType.Smtp) {
            this.redirectingEmailAddressRowElement.hide();
            this.redirectingFilenameRowElement.hide();
            this.smtpHostRowElement.show();
            this.smtpPortRowElement.show();
            this.smtpFromAddressRowElement.show();
            this.smtpUsernameRow.show();
            this.smtpPasswordRow.show();
            this.smtpConfirmPasswordRow.show();
            this.smtpEncryptionTypeRowElement.show();
            this.emailServiceEndpointRowElement.hide();
            this.emailTokenEndpointRowElement.hide();
            this.emailRefreshTokenEndpointRowElement.hide();
            this.emailScopeRowElement.hide();
            this.emailClientIdRowElement.hide();
            this.emailClientSecretRowElement.hide();
            this.emailConnectionTimeoutRowElement.show();
            this.emailReadTimeoutRowElement.show();
            this.testEmailConnectionRowElement.hide();
        } else if (notifierType == sailpoint.web.systemSetup.NotifierType.RedirectToEmail) {
            this.redirectingEmailAddressRowElement.show();
            this.redirectingFilenameRowElement.hide();
            this.smtpHostRowElement.show();
            this.smtpPortRowElement.show();
            this.smtpFromAddressRowElement.show();
            this.smtpUsernameRow.show();
            this.smtpPasswordRow.show();
            this.smtpConfirmPasswordRow.show();
            this.smtpEncryptionTypeRowElement.show();
            this.smtpUsernameRow.show();
            this.smtpPasswordRow.show();
            this.smtpConfirmPasswordRow.show();
            this.smtpEncryptionTypeRowElement.show();
            this.emailServiceEndpointRowElement.hide();
            this.emailTokenEndpointRowElement.hide();
            this.emailRefreshTokenEndpointRowElement.hide();
            this.emailScopeRowElement.hide();
            this.emailClientIdRowElement.hide();
            this.emailClientSecretRowElement.hide();
            this.emailConnectionTimeoutRowElement.show();
            this.emailReadTimeoutRowElement.show();
            this.testEmailConnectionRowElement.hide();
        } else {
            this.redirectingFilenameRowElement.show();
            this.redirectingEmailAddressRowElement.hide();
            this.smtpHostRowElement.hide();
            this.smtpPortRowElement.hide();
            this.smtpFromAddressRowElement.show();
            this.smtpEncryptionTypeRowElement.hide();
            this.smtpUsernameRow.hide();
            this.smtpPasswordRow.hide();
            this.smtpConfirmPasswordRow.hide();
            this.emailServiceEndpointRowElement.hide();
            this.emailTokenEndpointRowElement.hide();
            this.emailRefreshTokenEndpointRowElement.hide();
            this.emailScopeRowElement.hide();
            this.emailClientIdRowElement.hide();
            this.emailClientSecretRowElement.hide();
            this.emailConnectionTimeoutRowElement.hide();
            this.emailReadTimeoutRowElement.hide();
            this.testEmailConnectionRowElement.hide();
        }
        if (this.getTabPanel() != null) {
            this.getTabPanel().updateLayout();
        }
    }
    , getTabPanel : function () {
        return Ext.getCmp("identitySettingsTabPan");
    }
});
var emailHelper;
Ext.onReady(function() {
emailHelper = Ext.create('sailpoint.web.systemSetup.EmailHelper');
emailHelper.initialize();
});
