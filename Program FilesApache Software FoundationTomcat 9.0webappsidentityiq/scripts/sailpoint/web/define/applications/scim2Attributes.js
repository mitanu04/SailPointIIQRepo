
helpKey = 'APPLICATION';

function getFieldValue(field) {
    var val = null;
    var fieldName = Ext.getDom(field);
    if ( fieldName ) {
        val = fieldName.value;
    }
    return val;
}

function toggleCredentials() {
    var oauth2 = document.getElementById("editForm:authType:0").checked;
    var apiToken = document.getElementById("editForm:authType:1").checked;
    var basic = document.getElementById("editForm:authType:2").checked;
    var noAuth = false;
    var noAuthElement = document.getElementById("editForm:authType:3");
    if (noAuthElement) {
        noAuth = noAuthElement.checked;
    }

    if (!apiToken && !oauth2 && !basic && !noAuth) {
        oauth2 = true;
        document.getElementById("editForm:authType:0").checked = true;
    }
    if (basic == true){
        document.getElementById('usernameTr').style.display = "";
        document.getElementById("passwordTr").style.display = "";
        document.getElementById("apiTokenTr").style.display = 'none';
        document.getElementById("oauthInfo").style.display = 'none';
    } else if (oauth2 == true){
        document.getElementById('usernameTr').style.display = 'none';
        document.getElementById("passwordTr").style.display = 'none';
        document.getElementById("apiTokenTr").style.display = 'none';
        document.getElementById("oauthInfo").style.display = "";
    } else if (apiToken == true){
        document.getElementById('usernameTr').style.display = 'none';
        document.getElementById("passwordTr").style.display = 'none';
        document.getElementById("oauthInfo").style.display = 'none';
        document.getElementById("apiTokenTr").style.display = "";
    } else if (noAuth == true){
        document.getElementById('usernameTr').style.display = 'none';
        document.getElementById("passwordTr").style.display = 'none';
        document.getElementById("oauthInfo").style.display = 'none';
        document.getElementById("apiTokenTr").style.display = 'none';
    }
}

//Function to show and hide OAuth2 parameters based on grant type
function toggleGrantType(){
    var x = document.getElementById("editForm:grant_type").value;
    if (x == "REFRESH_TOKEN") {
        document.getElementById("oauthHostTr").style.display = "";
        document.getElementById("clientIdTr").style.display = "";
        document.getElementById("clientSecretTr").style.display = "";
        document.getElementById("refreshTokenTr").style.display = "";
        document.getElementById("headerTr").style.display = 'none';
        document.getElementById("IssuerTr").style.display = 'none';
        document.getElementById("SubjectTr").style.display = 'none';
        document.getElementById("AudienceTr").style.display = 'none';
        document.getElementById("AdditionalPayloadTr").style.display = 'none';
        document.getElementById("privateKeyTr").style.display = 'none';
        document.getElementById("privateKeyPasswordTr").style.display = 'none';
		document.getElementById("oauth2usernameTr").style.display = 'none';
		document.getElementById("oauth2passwordTr").style.display = 'none';
    } else if (x == "CLIENT_CREDENTIALS") {
        document.getElementById("oauthHostTr").style.display = "";
        document.getElementById("clientIdTr").style.display = "";
        document.getElementById("clientSecretTr").style.display = "";
        document.getElementById("refreshTokenTr").style.display = 'none';
        document.getElementById("headerTr").style.display = 'none';
        document.getElementById("IssuerTr").style.display = 'none';
        document.getElementById("SubjectTr").style.display = 'none';
        document.getElementById("AudienceTr").style.display = 'none';
        document.getElementById("AdditionalPayloadTr").style.display = 'none';
        document.getElementById("privateKeyTr").style.display = 'none';
        document.getElementById("privateKeyPasswordTr").style.display = 'none';
		document.getElementById("oauth2usernameTr").style.display = 'none';
		document.getElementById("oauth2passwordTr").style.display = 'none';
    } else if (x == "JWT_BEARER") {
        document.getElementById("oauthHostTr").style.display = "";
        document.getElementById("clientIdTr").style.display = 'none';
        document.getElementById("clientSecretTr").style.display = 'none';
        document.getElementById("refreshTokenTr").style.display = 'none';
        document.getElementById("headerTr").style.display = "";
        document.getElementById("IssuerTr").style.display = "";
        document.getElementById("SubjectTr").style.display = "";
        document.getElementById("AudienceTr").style.display = "";
        document.getElementById("AdditionalPayloadTr").style.display = "";
        document.getElementById("privateKeyTr").style.display = "";
        document.getElementById("privateKeyPasswordTr").style.display = "";
		document.getElementById("oauth2usernameTr").style.display = 'none';
		document.getElementById("oauth2passwordTr").style.display = 'none';
    } else if (x == "PASSWORD") {
        document.getElementById("oauthHostTr").style.display = "";
        document.getElementById("clientIdTr").style.display = 'none';
        document.getElementById("clientSecretTr").style.display = 'none';
        document.getElementById("refreshTokenTr").style.display = 'none';
        document.getElementById("headerTr").style.display = 'none';
        document.getElementById("IssuerTr").style.display = 'none';
        document.getElementById("SubjectTr").style.display = 'none';
        document.getElementById("AudienceTr").style.display = 'none';
        document.getElementById("AdditionalPayloadTr").style.display = "";
        document.getElementById("privateKeyTr").style.display = 'none';
        document.getElementById("privateKeyPasswordTr").style.display = 'none';
		document.getElementById("oauth2usernameTr").style.display = "";
		document.getElementById("oauth2passwordTr").style.display = "";
    }
}

function validateOauth2Params(){
    var selectedOauthType = document.getElementById("editForm:grant_type").value;
    if (selectedOauthType == "REFRESH_TOKEN" && !hasCredentialConfiguration()) {

        var clietId = document.getElementById("editForm:client_id").value;
        Validator.validateNonBlankString(clietId, '#{msgs.err_oauth_client_id}');
        var clientSecret = document.getElementById("editForm:client_secret").value;
        Validator.validateNonBlankString(clientSecret, '#{msgs.err_oauth_client_secret}');
        var url = document.getElementById("editForm:token_url").value;
        Validator.validateNonBlankString(url, '#{msgs.err_oauth_token_url}');
        var refTok = document.getElementById("editForm:refresh_token").value;
        Validator.validateNonBlankString(refTok, '#{msgs.err_oauth_refresh_token}');
    } else if (selectedOauthType == "JWT_BEARER"){
        var url = document.getElementById("editForm:token_url").value;
        Validator.validateNonBlankString(url, '#{msgs.err_oauth_token_url}');
        var header = document.getElementById("editForm:oAuthJwtHeader").value;
        Validator.validateNonBlankString(header, '#{msgs.err_oauth_header}');
        var issuer = document.getElementById("editForm:iss").value;
        Validator.validateNonBlankString(issuer, '#{msgs.err_oauth_issuer}');
        var subject = document.getElementById("editForm:sub").value;
        Validator.validateNonBlankString(subject, '#{msgs.err_oauth_subject}');
        var audience = document.getElementById("editForm:aud").value;
        Validator.validateNonBlankString(audience, '#{msgs.err_oauth_audience}');
        var privateKeyExists = getFieldValue('editForm:privateKeyExists');
        if (!privateKeyExists) {
            var privateKey = document.getElementById("editForm:private_key").value;
            Validator.validateNonBlankString(privateKey,
                    '#{msgs.err_oauth_private_key_empty}');
        }
        var privateKeyPassword = document.getElementById("editForm:private_key_password").value;
        Validator.validateNonBlankString(privateKeyPassword, '#{msgs.err_oauth_private_key_password_empty}');
    } else if (selectedOauthType == "PASSWORD"){
        var url = document.getElementById("editForm:token_url").value;
        Validator.validateNonBlankString(url, '#{msgs.err_oauth_token_url}');
        var oauth2username = getFieldValue('editForm:oauth2username');
        Validator.validateNonBlankString(oauth2username, "#{msgs.con_form_scim_err_message_oauth2username_null}");
        var oauth2password = getFieldValue('editForm:oauth2password');
        Validator.validateNonBlankString(oauth2password, "#{msgs.con_form_scim_err_message_oauth2password_null}");        
    }
}

Ext.onReady(function () {
    Ext.QuickTips.init();

    // Make sure the correct fields are enabled/disabled.
    toggleCredentials();

    //For OAuth2//
    toggleGrantType();

    // This is our validation hook
    Page.on('beforeSave', function() {

        if(!hasCredentialConfiguration()) {
            var host = getFieldValue('editForm:host');
            Validator.validateNonBlankString(host, "#{msgs.con_form_scim_error_host_required}");
    
            if (document.getElementById("editForm:authType:2").checked == true) {
                var userName = getFieldValue('editForm:user');
                Validator.validateNonBlankString(userName, "#{msgs.con_form_scim_err_message_username_null}");
                var password = getFieldValue('editForm:password');
                Validator.validateNonBlankString(password, "#{msgs.con_form_scim_err_message_password_null}");
            } else if (document.getElementById("editForm:authType:0").checked == true) {
                validateOauth2Params();
            } else if(document.getElementById("editForm:authType:1").checked == true) {
                var apiToken = getFieldValue('editForm:oauthBearerToken');
                Validator.validateNonBlankString(apiToken, "#{msgs.con_form_scim_error_apitoken_required}");
            }
    
            var errors = Validator.getErrors();
            if (errors && errors.length > 0) {
                Validator.displayErrors('appErrorsTop');
                return false;
            }
        }
        //return false will kill cancel the save
        return true;
    });

});
