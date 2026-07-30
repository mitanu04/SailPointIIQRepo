/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Define',
       'SailPoint.Define.Grid',
       'SailPoint.Define.Grid.Group');

Ext.define('SailPoint.Group.SearchField', {
    extend: 'Ext.app.SearchField',
    alias: 'widget.groupsearchfield',
    onTrigger1Click: function() {
        this.clearValue();
        SailPoint.Define.Grid.Group.accountGroupSearch();
        this.fireEvent('trigger1click', this);
    },
    onTrigger2Click: function() {
        var store = this.getStore();
        var value = this.getValue();

        if (value.length < 1) {
            this.onTrigger1Click();
            return;
        }
                
        SailPoint.Define.Grid.Group.accountGroupSearch();
        this.showClearTrigger();
        this.fireEvent('trigger2click', this);
    }
});


SailPoint.Define.Grid.Group.getAdvancedSearchButton = function(gridName) {
    var filterAction = new Ext.Action({
        text : '#{msgs.advanced_search}',
        scale: 'medium',
        handler : function() {
            Ext.getCmp(gridName + 'FilterForm').toggleCollapse();
        }
    });

    return filterAction;
};

SailPoint.Define.Grid.Group.reviewGenAiDescriptions = function() {
    var reviewAction = new Ext.Action({
        text : '#{msgs.review_gen_ai_descriptions}',
        scale: 'medium',
        handler : function() {
            location.replace(SailPoint.getRelativeUrl("/define/groups/entitlementDescription.jsf"));
        }
    });

    return reviewAction;
};

SailPoint.Define.Grid.Group.getImportGroupButton = function(){
    var newGroupAction = new Ext.Action({
        text : '#{msgs.explanation_button_import}',
        scale : 'medium',
        handler : function() {
            var importWindow = Ext.getCmp('importWindow');
            var windowWidth = 500;
            
            // The fileupload tag width isn't consistent across browsers so 
            // we need to accommodate the window width accordingly
            if (Ext.firefoxVersion > 0 || Ext.isIE) {
                windowWidth +=35;
            }
            
            if (Ext.isIE9) {
                windowWidth += 20;
            }

            if (!importWindow) {
                Ext.get('editForm').enctype = 'multipart/form-data';
                // IE ignores "enctype" - go figure
                Ext.get('editForm').encoding = 'multipart/form-data';
                
                importWindow = Ext.create('Ext.window.Window', {
                    id: 'importWindow',
                    title: '#{msgs.managed_attribute_title_import_entitlements}',
                    height: 525,
                    width: windowWidth,
                    layout: 'fit',
                    modal: true,
                    closeAction: 'hide',
                    autoRender: true,
                    items: [{
                            xtype: 'panel',
                            bodyPadding: 20,
                            bodyCls: 'spBackground',
                            contentEl: 'importDialog',
                            dockedItems: [{
                                xtype: 'toolbar',
                                dock: 'bottom',
                                style : 'background-color:#EEEEEE',
                                layout : {pack : 'center'},
                                ui: 'footer',
                                defaultType : 'button',
                                items: [{ 
                                    xtype: 'button',
                                    text: '#{msgs.explanation_button_import}',
                                    handler: function() {
                                        var fileToImport;
                                        if (Ext.getDom('importDialogForm:entitlementImport')){
                                            fileToImport = Ext.getDom('importDialogForm:entitlementImport').value;
                                        }
                                        if (!fileToImport || fileToImport == "") {
                                            var msg = Ext.String.format('#{msgs.explanation_import_no_import_file}',
                                                SailPoint.configData.MAX_UPLOAD_SIZE);

                                            Ext.Msg.show({
                                                title: '#{msgs.managed_attribute_title_import_entitlements}',
                                                msg: msg,
                                                buttons: Ext.Msg.OK,
                                                icon: Ext.Msg.ERROR
                                            });
                                        } else {
                                            Ext.getDom('importDialogForm:importFileBtn').click();
                                        }
                                    }
                                },{
                                    xtype: 'button',
                                    text: '#{msgs.button_cancel}',
                                    cls : 'secondaryBtn',
                                    handler: function(){
                                        Ext.getCmp('importWindow').hide();
                                    }
                                }]
                            }]
                        }
                    ]
                });
            }
            
            importWindow.show();
        },
        tooltip : {
            text : '#{msgs.tooltip_import_group}'
        }
    });

    return newGroupAction;
};


/* 
 * In an ideal world we would have a browser event that would fire when the download completed
 * and we would perform our post-processing activities then.  Unfortunately, our world is far from
 * ideal and no such event exists.  The workaround/hack for this is to set a cookie when the download
 * completes.  Every second we check for the presence of this cookie.  When we find it we know the 
 * download has completed and act appropriately
 */
SailPoint.Define.Grid.Group.checkDownloadComplete = function(exportToken) {
    var exportCompletionIndicator = Ext.util.Cookies.get('MAExportToken');
    if (exportCompletionIndicator == exportToken) {
        Ext.Msg.close();
        Ext.Msg.alert('#{msgs.managed_attribute_title_export_entitlements}', '#{msgs.managed_attribute_exported_entitlements}');
    } else {
        // Need to create a new function every time because IE won't let you do setTimeout in a parameterized manner
        window.setTimeout(function() {
            SailPoint.Define.Grid.Group.checkDownloadComplete(exportToken);
        }, 1000);
    }
}

SailPoint.Define.Grid.Group.getExportGroupButton = function(){
    // Initialize the components in the export form
    var languageStore = SailPoint.Store.createRestStore({
        autoLoad: true,
        url: CONTEXT_PATH + '/rest/localizedAttribute/languageSuggest',
        model: 'LocaleModel'
    });
    
    var appSelector;
            
    var newGroupAction = new Ext.Action({
        text : '#{msgs.explanation_button_export}',
        scale : 'medium',
        handler : function() {
            var exportWindow = Ext.getCmp('exportWindow');
            componentsExist = exportWindow;
            
            if (!exportWindow) {
                // Create ExtJS for the window contents
                
                // Create the window itself
                exportWindow = Ext.create('Ext.window.Window', {
                    id: 'exportWindow',
                    title: '#{msgs.managed_attribute_title_export_entitlements}',
                    height: 600,
                    width: 500,
                    layout: 'fit',
                    modal: true,
                    closeAction: 'hide',
                    autoRender: true,
                    items: [{
                            xtype: 'panel',
                            bodyPadding: 20,
                            bodyCls: 'spBackground',
                            contentEl: 'exportDialog',
                            dockedItems: [{
                                xtype: 'toolbar',
                                dock: 'bottom',
                                style : 'background-color:#EEEEEE',
                                layout : {pack : 'center'},
                                ui: 'footer',
                                defaultType : 'button',
                                items: [{ 
                                    xtype: 'button',
                                    text: '#{msgs.explanation_button_export}',
                                    handler: function() {
                                        Ext.getDom('exportDialogForm:exportFileBtn').click()
                                    }
                                },{
                                    xtype: 'button',
                                    text: '#{msgs.button_cancel}',
                                    cls : 'secondaryBtn',
                                    handler: function(){
                                        Ext.getCmp('exportWindow').hide();
                                    }
                                }]
                            }]
                        }
                    ]
                });
            }
            
            exportWindow.show();

            // Ideally the following would have been done above.  Unfortunately, 
            // creating the multisuggest prior to showing the window causes it to render
            // incorrectly.  
            if (!componentsExist) {
                appSelector = Ext.create('SailPoint.MultiSuggest', {
                    id: 'exportAppSelectorCmp',
                    suggestType: 'application',
                    displayField: 'displayName',
                    inputFieldName: 'exportDialogForm:appsToExport',
                    renderTo: 'exportAppSelector'
                });
                appSelector.toggleSelectAll(true, '#{msgs.all_applications}', true);
                
                Ext.create('Ext.form.field.ComboBox', {
                    renderTo: 'exportTypeCombo',
                    queryMode: 'local',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: [
                            'typeValue',
                            'typeDisplayName'
                        ],
                        data: [
                           ['properties', '#{msgs.managed_attribute_export_type_properties}'], 
                           ['descriptions', '#{msgs.managed_attribute_export_type_descriptions}']
                        ]
                    }),
                    valueField: 'typeValue',
                    displayField: 'typeDisplayName',
                    triggerAction: 'all',
                    tpl: Ext.create('Ext.XTemplate',
                        '<ul><tpl for=".">',
                          '<li role="option" class="' + Ext.baseCSSPrefix + 'boundlist-item">',
                            '<tpl for="."><div class="baseSearch"><div class="sectionHeader">{typeDisplayName}</div></div></tpl>',
                          '</li>',
                        '</tpl></ul>'
                    ),
                    value: 'properties',
                    width: 300,
                    listeners: {
                        select: function(combo, selections, opts) {
                            var type = selections[0].data['typeValue'];
                            Ext.getDom('exportDialogForm:exportType').value = type;
                            if (type == 'descriptions') {
                                Ext.getDom('descriptionsOptions').style.visibility = 'visible';
                            } else {
                                Ext.getDom('descriptionsOptions').style.visibility = 'hidden';
                            }
                        }
                    }
                });
                
                Ext.create('SailPoint.MultiSuggest', {
                    id: 'exportLanguageSelector',
                    suggest: Ext.create('Ext.form.ComboBox', {
                        queryMode: 'local',
                        valueField: 'value',
                        displayField: 'displayName',
                        width:200,
                        store: languageStore
                    }),
                    displayField: 'displayName',
                    inputFieldName: 'exportDialogForm:languagesToExport',
                    renderTo: 'languageSelector'
                });                                    
            }            
        },
        tooltip : {
            text : '#{msgs.tooltip_export_group}'
        }
    });

    return newGroupAction;
};

SailPoint.Define.Grid.Group.getNewGroupButton = function(){
    return new Ext.Action({
        text : '#{msgs.button_new_group}',
        scale : 'medium',
        cls : 'primaryBtn',
        handler : function() {
            location.replace(SailPoint.getRelativeUrl("/define/groups/editAccountGroup.jsf?forceLoad=true"));
        },
        tooltip : {
            text : '#{msgs.tooltip_new_group}'
        }
    });
};

/**
 * @return true if there are form values set; false otherwise -- used to determine whether or not to have the search expando collapsed on entry
 */
SailPoint.Define.Grid.Group.hasSearchFilter = function() {
    var hasSearchFilter = false;
    hasSearchFilter |= Ext.getDom('acctGroupAttribute') && Ext.getDom('acctGroupAttribute').value && Ext.getDom('acctGroupAttribute').value.length > 0;
    hasSearchFilter |= Ext.getDom('accountGroupOwner') && Ext.getDom('accountGroupOwner').value && Ext.getDom('accountGroupOwner').value.length > 0;
    hasSearchFilter |= Ext.getDom('nativeIdentity') && Ext.getDom('nativeIdentity').value && Ext.getDom('nativeIdentity').value.length > 0;
    hasSearchFilter |= Ext.getDom('accountGroupApplication') && Ext.getDom('accountGroupApplication').value && Ext.getDom('accountGroupApplication').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupTarget') && Ext.getDom('editForm:accountGroupTarget').value && Ext.getDom('editForm:accountGroupTarget').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupRights') && Ext.getDom('editForm:accountGroupRights').value && Ext.getDom('editForm:accountGroupRights').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupAnnotation') && Ext.getDom('editForm:accountGroupAnnotation').value && Ext.getDom('editForm:accountGroupAnnotation').value.length > 0;
    hasSearchFilter |= Ext.getDom('accountGroupTypeFilter') && Ext.getDom('accountGroupTypeFilter').value && Ext.getDom('accountGroupTypeFilter').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupEffective') && Ext.getDom('editForm:accountGroupEffective').value && Ext.getDom('editForm:accountGroupEffective').value.length > 0;
    hasSearchFilter |= Ext.getDom('accountGroupClassification') && Ext.getDom('accountGroupClassification').value && Ext.getDom('accountGroupClassification').value.length > 0;
    hasSearchFilter |= Ext.getDom('iiqElevatedAccess') && Ext.getDom('iiqElevatedAccess').value && Ext.getDom('iiqElevatedAccess').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupCloudUri') && Ext.getDom('editForm:accountGroupCloudUri').value && Ext.getDom('editForm:accountGroupCloudUri').value.length > 0;
    hasSearchFilter |= Ext.getDom('editForm:accountGroupCloudName') && Ext.getDom('editForm:accountGroupCloudName').value && Ext.getDom('editForm:accountGroupCloudName').value.length > 0;
    hasSearchFilter |= !!SailPoint.Analyze.AccountGroup.getCloudTypeValue();

    return hasSearchFilter;
}

SailPoint.Define.Grid.Group.accountGroupSearch = function(pageToLoad) {
    
    var grid = Ext.getCmp('acctGroupsGrid');
    var proxy = grid.getStore().getProxy();
    proxy.extraParams = {};
    
    if (Ext.getDom('editForm:searchFieldVal')) {
        Ext.getDom('editForm:searchFieldVal').value = Ext.getCmp('acctGroupsSearchField').getValue();
    }
    
    //editForm:accountGroupName
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'attribute', Ext.getCmp('acctGroupAttributeSuggestCmp'));

    //accountGroupOwnerSuggest
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'owner.id', Ext.getCmp('accountGroupOwnerSuggest'));

    //nativeIdentitySuggestCmp
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'native.id', Ext.getCmp('nativeIdentitySuggestCmp'));

    //accountGroupApplicationSuggestCmp
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'application', Ext.getCmp('accountGroupApplicationSuggestCmp'));

    //editForm:accountGroupEffective
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'associations', Ext.fly('editForm:accountGroupEffective'));

    //editForm:accountGroupTarget
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'target', Ext.fly('editForm:accountGroupTarget'));

    //editForm:accountGroupRights
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'rights', Ext.fly('editForm:accountGroupRights'));

    //editForm:accountGroupAnnotation
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'annotation', Ext.fly('editForm:accountGroupAnnotation'));

    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'type', Ext.getCmp('typeFilterCombo'));
    
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'iiqElevatedAccess', Ext.fly('editForm:iiqElevatedAccess'));
    
    //accountGroupClassificationSuggest
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'classification', Ext.getCmp('accountGroupClassificationSuggest'));

    //editForm:accountGroupCloudUri
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'cloudUri', Ext.fly('editForm:accountGroupCloudUri'));

    //editForm:accountGroupCloudDisplayName
    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'cloudDisplayName', Ext.fly('editForm:accountGroupCloudName'));

    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'cloudProvider', Ext.fly('editForm:accountGroupCloudType'));

    SailPoint.Define.Grid.Group.setProxyParam(proxy, 'items', Ext.getCmp('acctGroupsSearchField'));

    // Add any extended attributes to the query
    var suggestFields = Ext.DomQuery.select('div[id$=Suggest]');
    for (var i = 0; i < suggestFields.length; ++i) {
        var s = Ext.getCmp(suggestFields[i].id + "Cmp");
        if(s && s.getId().indexOf("ManagedAttribute_") > -1){
            var id = suggestFields[i].id;
            id = id.substring(0, id.length - 7);
            id = Ext.fly(id + "Nbr");
            if(id && id.dom.innerHTML) {
                // prefix key with AccountGroupSearchBean.ATT_IDT_SEARCH_MA_PREFIX
                SailPoint.Define.Grid.Group.setProxyParam(proxy, "ManagedAttribute." + id.dom.innerHTML, s);
            }
        }
    }
    var booleanFields = Ext.DomQuery.select('select[id*=Form\:extended]');
    for (var i = 0; i < booleanFields.length; ++i) {
        var b = Ext.get(booleanFields[i]);
        if(b) {
            var parentNode = booleanFields[i].parentNode;
            if (parentNode && parentNode.nextSibling && parentNode.nextSibling.nextSibling) {
                // prefix key with AccountGroupSearchBean.ATT_IDT_SEARCH_MA_PREFIX
                SailPoint.Define.Grid.Group.setProxyParam(proxy, "ManagedAttribute." + booleanFields[i].parentNode.nextSibling.nextSibling.innerHTML, b);
            }
        }
    }

    if (pageToLoad) {
        grid.getStore().loadPage(pageToLoad);        
    } else {
        grid.getStore().loadPage(1);
    }
};

SailPoint.Define.Grid.Group.setProxyParam = function(p, key, comp) {
    if(comp && comp.getValue() && comp.getValue() !== "") {
        p.extraParams[key] = comp.getValue();
    }
};

SailPoint.Define.Grid.Group.accountGroupSearchReset = function() {
    var grid = Ext.getCmp('acctGroupsGrid');
    var proxy = grid.getStore().getProxy();
    var tmpObj;

    SailPoint.Analyze.clearExtendedAttributeFields(null);

    tmpObj = Ext.getCmp('acctGroupAttributeSuggestCmp');
    if(tmpObj) {
        tmpObj.setDisabled(true);
    }

    tmpObj = Ext.getCmp('accountGroupOwnerSuggest');
    if(tmpObj) {
        tmpObj.setValue('');
    }

    tmpObj = Ext.getCmp('accountGroupClassificationSuggest');
    if(tmpObj) {
        tmpObj.setValue('');
    }

    tmpObj = Ext.getCmp('nativeIdentitySuggestCmp');
    if(tmpObj) {
        tmpObj.setDisabled(true);
    }

    tmpObj = Ext.getCmp('typeFilterCombo');
    if (tmpObj) {
        SailPoint.Analyze.AccountGroup.updateTypeSuggest('');
    }

    tmpObj = Ext.getCmp('cloudTypeComboBox');
    if(tmpObj) {
        tmpObj.clearValue();
    }

    tmpObj = Ext.fly('editForm:iiqElevatedAccess');
    if(tmpObj) {
        tmpObj.dom.selectedIndex = 0;
    }
    
    proxy.extraParams = {};
    proxy.extraParams['type'] = '';

    tmpObj = Ext.fly('editForm:clearSearchBtn');
    if (tmpObj) {
        tmpObj.dom.click();
    }
    else {
        Ext.getCmp('acctGroupsSearchField').onTrigger1Click();        
    }
};

SailPoint.Define.Grid.Group.createSearchForm = function(grid, gWidth) {
    var config = {
        xtype : 'panel',
        id : grid.id + 'FilterForm',
        stateId : grid.id + 'FilterForm',
        stateful : true,
        region : 'north',
        frame : false,
        collapsed : !SailPoint.Define.Grid.Group.hasSearchFilter(),
        header: false,
        placeholder: {
            xtype: 'container',
            padding: 0,
            height: 0,
            border: 0
        },
        width : gWidth,
        height: SailPoint.minSupportedHeight,
        //Always overflow otherwise we get a giant search panel with no results and no ability to scroll the search
        //panel see IIQBUGS-108
        bodyStyle : 'padding:8px; background-color:#EEEEEE; overflow:auto;',
        bodyCls: 'x-panel-body-plain',
        style : 'background-color:#EEEEEE',
        defaults: { // defaults are applied to items, not this container
            bodyBorder : false,
            border : false,
            cls : 'searchPanelField' // defined in sp-components.css
        },
        cls : 'x-panel-no-border',
        html : Ext.getDom('accountGroupAttributesDiv').innerHTML, //set search panel to included entitlementsCatalogAttributes.xhtml
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            style : 'background-color:#EEEEEE',
            layout : {pack : 'end'},
            ui: 'footer',
            defaultType : 'button',
            cls : 'searchPanelToolbar', // defined in sp-components.css
            items: [{
                text : '#{msgs.button_filter}',
                handler : function() {
                    Ext.getDom('editForm:saveQueryBtn').click();
                }
            },{
                text : '#{msgs.button_reset}',
                cls : 'secondaryBtn', // adjusts padding
                handler : function() {
                    SailPoint.Define.Grid.Group.accountGroupSearchReset();
                }
            }]
        }]
    };
    /* Bug #21023: limit height of search panel when viewable area is below supported resolution. */
    if(SailPoint.Platform.isMobile() || SailPoint.getBrowserViewArea().height <= SailPoint.minSupportedHeight)  {
        config.height = 150;
    }

    return config;
};
Ext.define('EntitlementStatus', {
    singleton: true,
    values: Object.freeze({
        CREATED: Object.freeze({ key: "created", color: "grey", status: "Requested" }),
        REQUESTED: Object.freeze({ key: "requested", color: "grey", status: "Requested" }),
        SUGGESTED: Object.freeze({ key: "suggested", color: "purple", status: "Suggested" }),
        FAILED: Object.freeze({ key: "failed", color: "red", status: "Failed" }),
        APPROVED: Object.freeze({ key: "approved", color: "green", status: "Approved" }),
        PENDING_APPROVAL: Object.freeze({ key: "pending approval", color: "yellow", status: "Pending Approval" }),
        REJECTED: Object.freeze({ key: "rejected", color: "amber", status: "Rejected" })
    }),
    getValues() {
        return this.values;
    }
});

Ext.define('AccountGrid.StatusUtil', {
    singleton: true,
    generateStatusIcons(statusEnum) {
        const statusIcons = {};
        Object.keys(statusEnum).forEach(statusKey => {
            const statusObj = statusEnum[statusKey];
            if (statusObj && statusObj.color && statusObj.status) {
                statusIcons[statusObj.key] = {
                    src: `../../images/icons/magic-wand-${statusObj.color}.svg`,
                    tooltip: `#{msgs.ui_tooltip_gen_ai_icon_status}&nbsp;-&nbsp;${statusObj.status}`
                };
            }
        });
        return statusIcons;
    }
});
const statusIcons = AccountGrid.StatusUtil.generateStatusIcons(EntitlementStatus.getValues());
//method to render the icon in Description column
SailPoint.Define.Grid.Group.renderEntitlementDescription = function(value, p, record) {
    const status = record.raw.genai_description_request_status;
    const iconHtml = SailPoint.Define.Grid.Group.getIconHtml(status);
    const entitlementCatalogDescription = `<div class="entitlement-page-description-container">
        <span class="entitlement-page-wand">${iconHtml ?? ''}</span>
        <span>${value ?? ''}</span>
        </div>`;
    return Ext.String.format(entitlementCatalogDescription);
};
// Helper function to get the icon HTML based on the status
SailPoint.Define.Grid.Group.getIconHtml = function(status) {
    const icon = statusIcons[status];
    return icon ? `<img class="entitlement-status-icon" src="${icon.src}" data-qtip="${icon.tooltip}"/>` : '';
}
SailPoint.Define.Grid.Group.isSingleEntitlementSelected = function() {
    var selectionModel= Ext.getCmp('acctGroupsGrid').getSelectionModel().getSelection();
    if (selectionModel.length <= 1) {
        return true;
    }
};
const MAX_SELECTED_ENTITLEMENTS = 100;
SailPoint.Define.Grid.Group.createAcctGrid = function(options) {
    /* @cfg {Array} array of fields that will be included in the grid */
    var fields = options.fields;
    /* @cfg {Array} array of column configs corresponding to the fields in the grid */
    var columns = options.columns;
    /* @cfg {String} the grid state */
    var gridStateStr = options.gridStateStr;
    /* @cfg {Number} the page size for the grid */
    var pageSize = options.pageSize;
    /* @cfg {String} the grid's identifier */
    var stateId = options.stateId;
    /* @cfg {Number} the grid's width */
    var gridWidth = options.gridWidth;
    /* @cfg {Boolean} true to enable the creation of new account groups from the grid; false otherwise */
    var enableNewAccountGroups = options.enableNewAccountGroups;
    
    var dataSource = options.isEntitlementCatalog ? CONTEXT_PATH + '/define/groups/entitlementCatalogDataSource.json' : CONTEXT_PATH + '/define/groups/accountGroupsDataSource.json';
    
    var acctGroupsStore = SailPoint.Store.createStore({
        autoLoad : false,
        url : dataSource,
        root : 'objects',
        totalProperty: 'count',
        fields : fields,
        remoteSort : true,
        pageSize : pageSize,
        method : 'POST'
    });

    var gridName = 'acctGroupsGrid';
    var enableEntitlementCheckbox = Ext.getDom('editForm:genAIEntitlementDescCheckBox').value;

    var identityAIEnabled = Ext.getDom('editForm:identityAIEnabled').value;

    var isGenAiRightsAndCapability = (enableEntitlementCheckbox === 'true') 
                                   && SailPoint.configData.GEN_AI_ENTITLEMENT_ADMIN_RIGHTS  
                                   && (identityAIEnabled === 'true');

    const { CREATED, REQUESTED, SUGGESTED, PENDING_APPROVAL } = EntitlementStatus.getValues();
    const requestedStatus = [CREATED.key, REQUESTED.key, SUGGESTED.key, PENDING_APPROVAL.key];

    var gridConfig = {
        xtype : isGenAiRightsAndCapability ? 'pagingcheckboxgrid' : 'paginggrid',
        id : gridName,
        store : acctGroupsStore,
        genAiCapability : isGenAiRightsAndCapability,
        cls : 'selectableGrid',
        title : '#{msgs.account_groups}',
        columns : columns,
        region: 'center',
        gridStateStr : gridStateStr,
        stateId : stateId,
        stateful : true,
        border: false,
        loadMask : true,
        header: !options.isEntitlementCatalog,
        entitlementStatus: requestedStatus,
        viewConfig : {
            stripeRows : true,
            scrollOffset : 0
        },
        height: 600,
        usePageSizePlugin : true,
        listeners : {
            itemcontextmenu : SailPoint.Define.Grid.Group.showContextMenu
        }
    };
    var isEntitlementRowCheckboxClicked = true;
    if (isGenAiRightsAndCapability) {
        //condition for disabled rows fading
        gridConfig.viewConfig.getRowClass = (record, rowIndex, rowParams, store) =>
            requestedStatus.includes(record.raw.genai_description_request_status)
                ? 'disabled-entitlement-row'
                : '';
        gridConfig.selModel = Ext.create('SailPoint.grid.CheckboxSelectionModel', {
            selectMessageBox: Ext.getDom('selectedCount'),
            selectAllMenu : new Ext.menu.Menu({
                id:'grid-ctx',
                items :  [
                    {
                        selectionType:'selectPage',
                        text: "#{msgs.defselectionmodel_select_current}",
                        iconCls: 'gridSelectPage',
                        scope:this
                    },{
                        selectionType:'deselectPage',
                        text: "#{msgs.defselectionmodel_deselect_current}",
                        iconCls: 'gridDeselectPage',
                        scope:this
                    }
                ]}),
             listeners: {
                //prevent the clicking of disabled checkboxes in the rows
                beforeselect: function(selectionModel, record, index, eOpts) {
                    isEntitlementRowCheckboxClicked = false;
                    if (requestedStatus.includes(record.raw.genai_description_request_status)) {
                        return false;
                    }
                    return true;
                },
                //prevent the clicking of disabled checkboxes in the rows when header is clicked
                 //Also limits the maximum selected checkboxes and error shown if more than 100 checkboxes selected
                selectionchange: function(selectionModel, selectedRecords) {
                    const selected = selectionModel.getSelection();
                    if(selected.length >= 0){
                        isEntitlementRowCheckboxClicked = false;
                    }
                    if (selected.length > MAX_SELECTED_ENTITLEMENTS) {
                        Ext.Msg.alert("#{msgs.err_dialog_title}", '#{msgs.ui_label_entitlement_selection_limit_failure_message}');
                        const excessRecords = selected.slice(MAX_SELECTED_ENTITLEMENTS);
                        selectionModel.deselect(excessRecords);

                    }
                    const disabledRecords = selected.filter(record =>
                        requestedStatus.includes(record.raw.genai_description_request_status)
                    );
                    if (disabledRecords.length) {
                        selectionModel.deselect(disabledRecords, true);
                    }
                }
             }  
        });

        gridConfig.listeners.itemclick = function (gridView, record, HTMLitem, index, event, eOpts) {
            if (isEntitlementRowCheckboxClicked && SailPoint.Define.Grid.Group.isSingleEntitlementSelected() ) {
                SailPoint.Define.Grid.Group.clickRow(gridView, record, HTMLitem, index, event, eOpts);
            }
            isEntitlementRowCheckboxClicked = true;
        };
    } else {
        gridConfig.listeners.itemclick = SailPoint.Define.Grid.Group.clickRow;
    }
    var searchButton = SailPoint.Define.Grid.Group.getAdvancedSearchButton(gridName);
    var searchFormConfig = SailPoint.Define.Grid.Group.createSearchForm(gridConfig);

    // Note:  The search form is populated with the contents of the accountGroupAttributesDiv below.
    var searchFieldConfig = {
        xtype : 'groupsearchfield',
        id : 'acctGroupsSearchField',
        store : acctGroupsStore,
        paramName : 'items',
        emptyText : '#{msgs.label_filter_entitlements}',
        width : 250,
        dock: 'top',
        value: Ext.get('editForm:searchFieldVal') ? Ext.getDom('editForm:searchFieldVal').value : '',
        storeLimit : pageSize
    };
        
    var toolbar = [
        searchFieldConfig,
        ' ',
        searchButton,
        ' ',
        isGenAiRightsAndCapability ? SailPoint.Define.Grid.Group.reviewGenAiDescriptions() : ' ',
        {xtype: 'tbfill'}, ' ',
        SailPoint.Define.Grid.Group.getImportGroupButton(), ' ',
        SailPoint.Define.Grid.Group.getExportGroupButton()
    ];
    
    if (enableNewAccountGroups) {
        toolbar.push(' ');
        toolbar.push(SailPoint.Define.Grid.Group.getNewGroupButton());        
    }

    if (!options.isEntitlementCatalog) {
        SailPoint.Define.Grid.Group.accountGroupSearch();
    } // Otherwise we'll defer loading this until the attributes have been loaded

    //Clear out original search div to avoid duplicate ids.
    Ext.getDom('accountGroupAttributesDiv').innerHTML = "";

    return {
        xtype: 'panel',
        tbar: toolbar,
        layout: 'border',
        items: [searchFormConfig, gridConfig]
    };
};