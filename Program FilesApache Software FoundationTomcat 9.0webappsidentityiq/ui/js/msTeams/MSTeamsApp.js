const MSTeamsApp = (function(){
    let instance;

    //default config with values
    const defaultConfig = {
        url : new URL(window.location.href), 
        scriptLoadTimeout: 10000, 
        teamsWrapperUrlRestName : "rest/configuration/systemconfiguration/teamsAuthWrapperAddress", 
        iiqMsteamsScriptName : "iiq_msteams.js"
    }

    // Merge only matched properties in target object.
    const mergeMatchedProperties = (target, source) => {
        if(!target || !source){
            return target || source;
        }
        if(typeof target !== "object" || typeof source !== "object") {
            return target || source;
        }
        const config = {...target};
        for(const key in source) {
            if(target.hasOwnProperty(key) && source.hasOwnProperty(key)) {
                config[key] = source[key];
            }
        }
        return config;
    }
    
    /**
     * Constructor
     * @param {*} config 
     */
    function MSTeamsApp(config){
        config = config ? mergeMatchedProperties(defaultConfig, config) : defaultConfig;

        this.url = config.url;
        this.scriptTimeout = config.scriptLoadTimeout;
        this.iiqMsteamsScriptName = config.iiqMsteamsScriptName
        this.teamsWrapperUrlRestName = config.teamsWrapperUrlRestName;
        this.wrapperUrl = '';
        this.isIIQMSTeamsScriptLoaded = false;
        this.isAuthCompleteCalled = false;
        this.MSTeamsSDKUtils = null;
        this.workItemName = null;
        instance = this;
    }

    MSTeamsApp.prototype.loadWrapperScript = (scriptName) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(scriptName, instance.wrapperUrl).toString();
    
            const timeoutId = setTimeout(() => {
                document.head.removeChild(script);
                reject(new Error("Loading script " + scriptName + ' timed out.'));
            }, instance.scriptTimeout);
    
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve(script);
            };
            script.onerror = () => {
                clearTimeout(timeoutId);
                document.head.removeChild(script);
                const errorMessage = 'Failed to load ' + scriptName + '.';
                reject(new Error(errorMessage));
            };
            // append script to document to start loading
            document.head.appendChild(script);
        });
    }
    MSTeamsApp.prototype.fetchWrapperUrl = () => {
        if (instance.wrapperUrl) {
            return Promise.resolve(instance.wrapperUrl);
        }
        const baseUrl = new URL(instance.url.pathname, instance.url.origin);
        const apiUrl = new URL(instance.teamsWrapperUrlRestName, baseUrl).toString();
    
        return fetch(apiUrl)
            .then((response) => {
                if (!response || response.status !== 200) {
                    throw new Error("Failed to fetch wrapper url ");
                }
                return response.json();
            })
            .then((wrapperUrl) => {
                instance.wrapperUrl = wrapperUrl;
                return wrapperUrl;
            })
            .catch(instance.executeWithErrorHandling((error) => {
                instance.wrapperUrl = null;
                throw error;
            }, 'FetchWrapperUrl'));
    }
    /***
     * This script loads fetchwrapper url and load dynamically as a script source
     */
    MSTeamsApp.prototype.loadIIQTeamsScript = () => {
        if (instance.isIIQMSTeamsScriptLoaded && instance.MSTeamsSDKUtils) {
            return Promise.resolve(instance.MSTeamsSDKUtils);
        }
        return instance.fetchWrapperUrl()
            .then(() => {
                return instance.loadWrapperScript(instance.iiqMsteamsScriptName);
            })
            .then(() => {
                instance.isIIQMSTeamsScriptLoaded = true;
                instance.MSTeamsSDKUtils = MSTeamsSDKUtils.getInstance();
            })
            .catch(instance.executeWithErrorHandling((error) => {
                instance.isIIQMSTeamsScriptLoaded = false;
                throw error;
            }, 'loadIIQTeamsScript'));
    };
    MSTeamsApp.prototype.getApprovalWorkItemNameFromContext = () => {
        return instance.loadIIQTeamsScript()
            .then(() => {
                return instance.MSTeamsSDKUtils.getApprovalWorkItemNameFromContext();
            }).then((workItemName) => {
                instance.workItemName = workItemName;
                return workItemName;
            })
            .catch(instance.executeWithErrorHandling((error) => {
                instance.workItemName = null;
                throw error;
            }, 'getApprovalWorkItemNameFromContext'));
    }

    /**
     * This method is used to call notifySuccess method from MS Teams
     */
    MSTeamsApp.prototype.notifySuccess = function() {
        return instance
            .loadIIQTeamsScript()
            .then(() => {
                return instance.MSTeamsSDKUtils.notifySuccess();
            })
            .catch(
                instance.executeWithErrorHandling((error) => {
                    throw error;
                }, 'notifySuccess')
            );
    };

    /**
     * This method is used to fetch content url from MS Teams
     */
    MSTeamsApp.prototype.getContentUrl = function() {
        return instance.loadIIQTeamsScript()
            .then(() => {
                return instance.MSTeamsSDKUtils.getContentUrl();
            }).then((contentUrl) => {
                instance.contentUrl = contentUrl;
                return contentUrl;
            })
            .catch(instance.executeWithErrorHandling((error) => {
                instance.contentUrl = null;
                throw error;
            }, 'contentUrl'));
    }

    // TODO: Global error handle catches the error.
    // This neeeds another task : where and how to show the message in UI.
    MSTeamsApp.prototype.handleErrors = (error, context) => {
        const errorMsg = 'Error in ' + context + ': ' + error;
        throw errorMsg;
    }
    MSTeamsApp.prototype.executeWithErrorHandling = (callback, context) => {
        return function () {
            try {
                return callback.apply(this, arguments);
            } catch (error) {
                instance.handleErrors(error, context);
            }
        }
    }

    return {
        getInstance : (config) => {
            if(!instance) {
                instance = new MSTeamsApp(config);
            }
            return instance;
        }
    }
})();
// Added to avoid lint error for MSTeamsApp
window.MSTeamsApp = MSTeamsApp;