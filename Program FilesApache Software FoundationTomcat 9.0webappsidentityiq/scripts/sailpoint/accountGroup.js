/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.ns('SailPoint', 'SailPoint.AccountGroup');
Ext.require([
             'Ext.data.*',
             'Ext.grid.*'
         ]);

/** Scripts for the account group edit page **/

// eliminates right mouse clicks on the row
function doNothing(grid, rowIndex, event) {       
   event.stopEvent();
}

function refreshPanel(component) {
    component.getStore().load({params:{start:0, limit:20}});
}

function clickGroupRow(gridView, record, HTMLitem, index, e, eOpts) {
    Ext.getDom('editForm:id').value = record.getId();
    Ext.getDom('editForm:transitionToNewAccountGroupButton').click();
}

function onClickGroupRow(gridView, record, HTMLitem, index, e, eOpts) {
    var name = null;
    if (record.data) {
      if (record.data.nativeIdentity) {
        name = record.data.nativeIdentity;
      } else if (record.data.name) {
        name = record.data.name;
      }
    }
    if (name != null) {
      viewAccountGroup("", "", encodeURIComponent(name), record.getId());
    } else {
      viewAccountGroup("", "", "", record.getId());
    }
}

function renderAccountGroupGrid(grid, renderDiv, gridWidth) {
    if (gridWidth) {
        grid.setWidth(gridWidth);
    }
    
    grid.getStore().load({params:{start:0, pageSize:20, limit:20}});
    grid.render(Ext.getDom(renderDiv));
    grid.expand(true);
}

function reloadMetaData(changedStore, newMetaData) {
    var root = newMetaData.root;
    var gridId;
    if ( root == "members" ) {
        gridId = 'membersGrid';
    } else 
    if ( root == "inheritedGroups" ) {
        gridId = 'inheritedGroupsGrid';
    } else
    if ( root == "inheritingGroups" ) {
        gridId = 'inheritingGroupsGrid';
    } else
    if ( root == "permissions" ) {
        gridId = 'permissionsGrid';
    }

    SailPoint.Utils.setColumnFlex(newMetaData);
    SailPoint.Utils.setDecisionColClass(newMetaData);

    var columnConfig = newMetaData.columnConfig,
        i;
    for (i = 0; i < columnConfig.length; i++) {
        if (Ext.isDefined(columnConfig[i].header)) {
            columnConfig[i].header = Ext.String.htmlEncode(columnConfig[i].header);
        }
    }

    var sortInfo = [{property: newMetaData.sortColumn, direction: newMetaData.sortDirection}];
    if (!newMetaData.sortColumn) {
        sortInfo = [{property: 'name', direction: 'ASC'}];
        if ( gridId == "permisssionsGrid" ) {
            sortInfo = [{property: 'target', direction: 'ASC'}];
        }
    }
    changedStore.sorters.addAll(sortInfo);
    
    // based on the store id get the grid
    var gridPanel = Ext.getCmp(gridId);
    gridPanel.reconfigure(changedStore, newMetaData.columnConfig);
}

var accountGroupWindow;
var camPanel, camRolesGrid, camServicesMetaData;

function displayAccountGroupPopup(store, records, options) {
    var record = records[0],
        // hack, just added this property to store in viewAccountGroup
        params = store.getProxy().extraParams,
        tl = '#{msgs.dialog_group_details}',
        displayName = record.get('displayName'),
        group,
        attributes,
        standardPanel,
        groupPanel,
        permGrid,
        permissionCount,
        gridMetaData,
        membersGrid,
        memberCount,
        inheritedGrid,
        inheritedCount,
        inheritingGrid,
        inheritingCount,
        tabPanel,
        tabItems,
        recordId,
        accessCount,
        accessGrid,
        accessMetaData,
        classificationCount,
        isIncludeClassifications,
        classificationGrid,
        classificationMetaData,
        isCamBased,
        camRolesMetaData,
        assocRolesCount,
        assocRolesGrid;

    if (accountGroupWindow && accountGroupWindow.isVisible()){
        accountGroupWindow.hide();
    }
    
    if (accountGroupWindow) {
        accountGroupWindow.destroy();
    }

    if (displayName) {
        tl =  Ext.String.htmlEncode(displayName) + ' ' + '#{msgs.dialog_group_details}';
    } else {
        group = params['groupName'];
        if (group) {
           tl = Ext.String.htmlEncode(group) + ' ' + '#{msgs.dialog_group_details}';
        }
    }

    recordId = record.get('id');
    if (Ext.isEmpty(recordId)) {
        // there is no managed attribute backing this yet so
        // there is no info to show about this one
        Ext.Msg.show({
            title: '#{msgs.acct_group_window_no_additional_info_title}',
            msg: '#{msgs.acct_group_window_no_additional_info}',
            icon: Ext.Msg.INFO,
            buttons: Ext.Msg.OK
        });

        return;
    }

    // attributes
    attributes = new Ext.Panel({
        id: 'accountGroupAttributesPanel',
        loader: {
            ajaxOptions: {
                method: 'post'
            },
            params: params,
            url: SailPoint.getRelativeUrl('/identity/viewAccountGroupWrapper.jsf'),
            autoLoad: true
        },
        bodyBorder: false
    });

    var managedAttributeUrl = '/rest/managedAttributes/' + recordId + '?refererType=' + params.refererType + '&refererId=' + params.refererId;
    if (params.parentId) {
        managedAttributeUrl += '&parentId=' + params.parentId;
    }

    if(params.certificationItemId && params.certificationItemId !== ''){
        managedAttributeUrl += '&certificationItemId='+params.certificationItemId;
    }

    standardPanel = Ext.create('Ext.panel.Panel', {
        id: 'accountGroupStandardPanel',
        title: '#{msgs.label_standard_properties}',
        autoScroll: true,
        loader: {
            url: SailPoint.getRelativeUrl(managedAttributeUrl),
            autoLoad: true,
            renderer: 'data'
        },
        tpl: new Ext.XTemplate(
          '<div class="spContent">',
            '<span class="sectionHeader">#{msgs.acct_group_window_standard}</span>',
            '<tpl for=".">',
              '<div class="spTabledContent">',
                '<table class="paddedTbl width100">',
                  '<tr><td class="titleColumn">#{msgs.acct_group_window_app}</td><td>{application}</td></tr>',
                  '<tr><td class="titleColumn">#{msgs.acct_group_window_type}</td><td>{type}</td></tr>',
                  '<tpl if="attribute != null">',
                    '<tr><td class="titleColumn">#{msgs.acct_group_window_attr}</td><td>{attribute}</td></tr>',
                  '</tpl>',
                  '<tr><td class="titleColumn">#{msgs.acct_group_window_value}</td><td>{value}</td></tr>',
                  '<tr><td class="titleColumn">#{msgs.acct_group_window_disp_value}</td><td>{displayableName:htmlEncode}</td>',
                  '<tpl if="description != null">',
                    '<tr><td class="titleColumn">#{msgs.acct_group_window_desc}</td><td>{description}</td></tr>',
                  '</tpl>',
                  '<tpl if="owner != null">',
                    '<tr><td class="titleColumn">#{msgs.acct_group_window_owner}</td><td>{owner}</td></tr>',
                  '</tpl>',
                  '<tr><td class="titleColumn">#{msgs.acct_group_window_requestable}</td><td>{requestable}</td></tr>',
                  '<tpl if="iiqElevatedAccess != null">',
                    '<tr><td class="titleColumn">#{msgs.acct_group_window_iiq_elevated_access}</td><td>{iiqElevatedAccess}</td></tr>',
                  '</tpl>',
                '</table>',
              '</div>',
            '</tpl>',
          '</div>',
          '<tpl if="extendedAttributes != null">',
            '<div class="spContent">',
              '<span class="sectionHeader">#{msgs.acct_group_window_extended}</span>',
              '<div class="spTabledContent">',
                '<table class="paddedTbl width100">',
                  '<tpl for="extendedAttributes">',
                    '<tr><td class="titleColumn">{key:htmlEncode}</td><td>{value}</td></tr>',
                  '</tpl>',
                '</table>',
            '</div>',
          '</tpl>'
        )
    });

    groupPanel = new Ext.Panel({
        id: 'accountGroupMainPanel',
        autoScroll: true,
        title: '#{msgs.object_properties}'
    });

    groupPanel.add(attributes);

    // only add these items if they have values in order to save real estate
    permissionCount = record.get("permissionCount");
    if (permissionCount > 0) {
        gridMetaData = Ext.decode(record.get("permissionGridMetaData"));
        permGrid = getPermissionsGrid(gridMetaData, params, 5, '#{msgs.permissions}');
        groupPanel.add(permGrid);
    }

    memberCount = record.get("memberCount");
    if (memberCount > 0) {
        membersGrid = getMembersGrid(params, 5, '#{msgs.members}');
        membersGrid.on('beforeexpand', panelExpanded);
    }

    inheritedCount = record.get("inheritedCount");
    if (inheritedCount > 0) {
        inheritedGrid = getInheritedGroupsGrid(params, 5, '#{msgs.inherited_groups}');
        inheritedGrid.on('beforeexpand', panelExpanded);
        inheritedGrid.addListener('itemclick', onClickGroupRow);
        groupPanel.add(inheritedGrid);
    }

    inheritingCount = record.get("inheritingCount");
    if (inheritingCount > 0) {
        inheritingGrid = getInheritingGroupsGrid(params, 5, '#{msgs.inheriting_groups}');
        inheritingGrid.on('beforeexpand', panelExpanded);
        inheritingGrid.addListener('itemclick', onClickGroupRow);
        groupPanel.add(inheritingGrid);
    }

    accessCount = record.get("accessCount");
    if (accessCount > 0) {
        var accessParams = {id: recordId};
        Ext.applyIf(accessParams, params);
        accessMetaData = Ext.decode(record.get("accessGridMetaData"));
        accessGrid = SailPoint.AccountGroup.getAccessGrid(accessMetaData, accessParams, 5, '#{msgs.access}');
    }

    classificationCount = record.get("classificationCount");
    isIncludeClassifications = record.get("isIncludeClassifications");
    if (classificationCount > 0 && isIncludeClassifications) {
        var classificationParams = {id: recordId};
        Ext.applyIf(classificationParams, params);
        classificationMetaData = Ext.decode(record.get("classificationGridMetaData"));
        classificationGrid = SailPoint.AccountGroup.getClassificationGrid(classificationMetaData, classificationParams, 5, '#{msgs.ui_classifications}');
    }

    isCamBased = record.get("isCamBased");
    var camParams, camServicesGrid;
    if (isCamBased) {
        camParams = {id: recordId};
        Ext.applyIf(camParams, params);
        camRolesMetaData = Ext.decode(record.get("camRolesMetaData"));
        camServicesMetaData = Ext.decode(record.get("camServicesMetaData"));
        var camResMetaData = Ext.decode(record.get("camResourcesMetaData"));
        var camScopesMetaData = Ext.decode(record.get("camScopesMetaData"));
        camServicesGrid = SailPoint.AccountGroup.getCamServicesGrid(camServicesMetaData, camParams, 5, '#{msgs.cloud_services}', camResMetaData);
        camRolesGrid = SailPoint.AccountGroup.getCamRolesGrid(camRolesMetaData, camParams, camScopesMetaData, camServicesGrid);
        camRolesGrid.initialLoad();
    }

    assocRolesCount = record.get("assocRolesCount");
    if (assocRolesCount > 0) {
        var assocRolesParams = {id: recordId};
        Ext.applyIf(assocRolesParams, params);
        assocRolesMetaData = Ext.decode(record.get("assocRolesGridMetaData"));
        assocRolesGrid = SailPoint.AccountGroup.getAssocRolesGrid(assocRolesMetaData, assocRolesParams, 5, '#{msgs.ui_managed_attribute_roles_tab}');
    }

    tabItems = [standardPanel, groupPanel];
    if (membersGrid) {
        tabItems.push(membersGrid);
    }
    if (accessGrid) {
        tabItems.push(accessGrid);
    }
    if (classificationGrid) {
        tabItems.push(classificationGrid);
    }

    if (isCamBased) {
        camPanel = Ext.create('Ext.Panel', {
            title: "#{msgs.cloud}",
            layout: {
                type: 'hbox',
                align: 'stretch'
            }
        });
        tabItems.push(camPanel);
        // this should be done after camPanel is set, but still check isCamBased
        setCamGroupPanel(camParams, camServicesGrid);
    }

    if (assocRolesGrid) {
        tabItems.push(assocRolesGrid);
    }

    tabPanel = Ext.create('Ext.tab.Panel', {
        id: 'accountGroupTabPanel',
        items: tabItems,
        listeners: {
            tabchange: function(tabPanel, newCard, oldCard, eOpts) {
                // load members store if necessary
                if (membersGrid && (newCard.getId() === membersGrid.getId()) &&
                        membersGrid.getStore().getCount() === 0) {
                    membersGrid.getStore().load();
                } else if (permGrid && groupPanel && (newCard.getId() === groupPanel.getId()) &&
                        permGrid.getStore().getCount() === 0) {
                    permGrid.getStore().load();
                } else if (accessGrid && (newCard.getId() === accessGrid.getId()) &&
                        accessGrid.getStore().getCount() === 0) {
                    accessGrid.getStore().load();
                } else if (classificationGrid && (newCard.getId() === classificationGrid.getId()) &&
                        classificationGrid.getStore().getCount() === 0) {
                    classificationGrid.getStore().load();
                } else if (camRolesGrid && (newCard.getId() === camRolesGrid.getId()) &&
                        camRolesGrid.getStore().getCount() === 0) {
                    camRolesGrid.getStore().load();
                } else if (assocRolesGrid && (newCard.getId() === assocRolesGrid.getId()) &&
                        assocRolesGrid.getStore().getCount() === 0) {
                    assocRolesGrid.getStore().load();
                }
            }
        }
    });

    accountGroupWindow = new Ext.Window({
        id: 'accountGroupPopupWindow',
        title: tl,
        width: 900,
        height: 576,
        closable : false,
        layout : 'fit',
        buttons: [{
            text: "#{msgs.button_close}",
            cls : 'secondaryBtn',
            handler: function() {
                accountGroupWindow.hide();
            }
        }],
        items: [tabPanel]
    });

    accountGroupWindow.show();

    if (permGrid) {
        // this one shows by default
        permGrid.show();
    }

    if (inheritedGrid) {
        inheritedGrid.collapse(Ext.Component.DIRECTION_TOP, false);
        inheritedGrid.show();
    }

    if (inheritingGrid) {
        inheritingGrid.collapse(Ext.Component.DIRECTION_TOP, false);
        inheritingGrid.show();
    }
}

/**
 * Show a loading indicator for the camPanel.
 * @returns loadingMessage div
 */
function loadingCamPanel() {
    var loadingMessage = document.createElement('div');

    loadingMessage.style['position'] = 'absolute';
    loadingMessage.style['z-index'] = '200';
    loadingMessage.style['background-color'] = 'white';
    loadingMessage.style['text-align'] = 'center';
    loadingMessage.style['padding'] = '180px';
    loadingMessage.style['border'] = '0 none white';
    loadingMessage.style['color'] = '#0680a4';

    loadingMessage.innerHTML = '<h1><i class="fa fa-spinner fa-spin"></i></h1><h5>#{msgs.loading_data}</h5>';

    // This line would replace the background-color and padding styles; however, 
    // I couldn't get the camPanel middle layout perfectly aligned vertically for this window.
    //camPanel.layout.align = 'middle';

    camPanel.add(loadingMessage);
    camPanel.items.items[0].flex = 1;

    return loadingMessage;
}

function removeLoadingCamDiv(loadingDiv) {
    if (loadingDiv) {
        camPanel.remove(loadingDiv);
    }
    // This would be needed if the layout.align was set during loadingCamPanel
    //camPanel.layout.align = 'stretch';
}

/**
 * The camPanel is defaulted to a setup of roles on the left and services on the right.
 * This function gets the CAMGroup and determines if the camPanel should be altered.
 */
function setCamGroupPanel(camParams, servicesGrid) {
    var loadingMessageDiv = loadingCamPanel();
    Ext.Ajax.request ({
        url : SailPoint.getRelativeUrl('/define/groups/accountGroupGetCamGroupJson.json'),
        params : camParams,
        disableCaching : true,
        success : function(response) {
            var camGroup = Ext.decode(response.responseText);
            // We have a successful return - remove the loading indicator
            removeLoadingCamDiv(loadingMessageDiv);
            if (!camGroup) {
                var panelWidth = camPanel.ownerCt.getWidth();
                var noResultsPanel = SailPoint.AccountGroup.getNoResultsPanel(panelWidth);
                camPanel.addDocked(noResultsPanel, 1);
                return;
            }
            var hasErrors = camGroup.errors && camGroup.errors.length > 0;
            if (hasErrors) {
                var panelWidth = camPanel.ownerCt.getWidth();
                var errorPanel = SailPoint.AccountGroup.getErrorMsgPanel(camGroup.errors, panelWidth);
                camPanel.addDocked(errorPanel, 1);
                return;
            }
            var hasRoles = camGroup.roles && camGroup.roles.length > 0;
            var hasServices = camGroup.services && camGroup.services.length > 0;
            var groupUri = camGroup.uri;
            var groupDisplayName = camGroup.displayName;
            var newParams = {start:0, scopeUri: groupUri};
            Ext.apply(newParams, camParams);

            if (!hasRoles && hasServices) {
                // groupType is "Native"
                camPanel.add(servicesGrid);
                if (groupDisplayName != null && servicesGrid) {
                    servicesGrid.setTitle(Ext.String.format("#{msgs.ui_cam_services_uri_header}", groupDisplayName));
                    servicesGrid.getStore().load({params:newParams});
                } else if (groupUri != null && servicesGrid) {
                    servicesGrid.setTitle(Ext.String.format("#{msgs.ui_cam_services_uri_header}", groupUri));
                    servicesGrid.getStore().load({params:newParams});
                } else if (!groupUri) {
                    var errors = ['#{msgs.cam_error_no_group_uri}'];
                    var panelWidth = camPanel.ownerCt.getWidth();
                    var errorPanel = SailPoint.AccountGroup.getErrorMsgPanel(errors, panelWidth);
                    camPanel.addDocked(errorPanel, 1);
                    return;
                }
            } else if (hasRoles && hasServices) {
                // groupType is "Hybrid"
                camPanel.add(camRolesGrid);
                camPanel.add(servicesGrid);
                if (!groupUri) {
                    return;
                }
                dockedTbar = [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    items: [
                        {
                            xtype: 'button',
                            text: '#{msgs.ui_cam_group_services_button}',
                            handler: function() {
                                if (groupDisplayName != null) {
                                    servicesGrid.setTitle(Ext.String.format("#{msgs.ui_cam_services_uri_header}", groupDisplayName));
                                    servicesGrid.getStore().load({params:newParams});
                                } else if (groupUri != null) {
                                    servicesGrid.setTitle(Ext.String.format("#{msgs.ui_cam_services_uri_header}", groupUri));
                                    servicesGrid.getStore().load({params:newParams});
                                } else if (!groupUri) {
                                    var errors = ['#{msgs.cam_error_no_group_uri}'];
                                    var panelWidth = camPanel.ownerCt.getWidth();
                                    var errorPanel = SailPoint.AccountGroup.getErrorMsgPanel(errors, panelWidth);
                                    camPanel.addDocked(errorPanel, 1);
                                    return;
                                }
                            }
                        }
                    ]
                }];
                camRolesGrid.addDocked(dockedTbar);
            } else if (hasRoles && !hasServices) {
                // groupType is "Federated"
                camPanel.add(camRolesGrid);
                camPanel.add(servicesGrid);
            } else if (!hasRoles && !hasServices) {
                var panelWidth = camPanel.ownerCt.getWidth();
                var noResultsPanel = SailPoint.AccountGroup.getNoResultsPanel(panelWidth);
                camPanel.addDocked(noResultsPanel, 1);
            }
        },
        failure : function() {
            alert('Unable to get CAM Group');
            removeLoadingDiv(loadingMessageDiv);
        },
        scope : this
    });
}

function getInheritedGroupsGrid(params, pageSize, title) {
    var url = CONTEXT_PATH + '/define/groups/inheritedAccountGroupsDataSource.json';
    return getGroupGrid('inheritedGroups', url, "Inherited Groups", params, pageSize, title);
}

function getInheritingGroupsGrid(params, pageSize, title) {
    var url = CONTEXT_PATH + '/define/groups/inheritingAccountGroupsDataSource.json';
    return getGroupGrid('inheritingGroups', url, "Inheriting Groups",params, pageSize, title);
}

function getGroupGrid(rootId, urlPath, title, params, pageSize, title) {

    var gridId = rootId + "Grid"
    // data store
    var store = SailPoint.Store.createStore({
        model : 'SailPoint.model.Empty',
        storeId: gridId +'Store',
        url: urlPath,
        extraParams : params,
        remoteSort: true,
        pageSize: pageSize,
        listeners: {
            exception: function(proxy, store, response, e) {
                alert('error loading ' + gridId + ' grid:' + e);
            },
            metachange: reloadMetaData
        }
    });
    var grid = new SailPoint.grid.PagingGrid({
        id: gridId,
        cls: 'wrappingGridCells',
        collapsible: true,
        collapsed: true,
        titleCollapse: true,
        store: store,
        title: title,
        columns: [{header: 'name', sortable: true}],
        viewConfig : {
            stripeRows: true
        },
        loadMask: true,
        pageSize: pageSize
    });
    
    grid.on('expand', function(panel) {
      var window = Ext.getCmp('accountGroupMainPanel');
      if(window) {
        var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
        window.body.scrollTo('top', panelTop);
      }
    }, this);
    return grid;
}

function getPermissionsGrid(gridMetaData, params, pageSize, title) {

    var store = SailPoint.Store.createStore({
        storeId: 'permissionsGridStore',
        root: 'permissions',
        fields: gridMetaData.fields,
        url: SailPoint.getRelativeUrl('/define/groups/permissionsDataSource.json'),
        extraParams : params,
        remoteSort: true,
        pageSize: pageSize
    });
    
    store.on('load', function() { addDescriptionTooltips(); });

    var grid = new SailPoint.grid.PagingGrid({
        id: 'permissionsGrid',
        cls:'wrappingGridCells',
        //cm: new SailPoint.grid.DynamicColumnModel(gridMetaData.columns),
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        collapsible: true,
        titleCollapse: true,
        store: store,
        title: title,
        shrinkWrap: false,
        height: 500,
        viewConfig: {
          scrollOffset: 1,
          stripeRows: true
        },
        loadMask: true,
        pageSize: pageSize
    });
    return grid;
}


function getMembersGrid(params, pageSize, title) {
    var store = SailPoint.Store.createStore({
        model : 'SailPoint.model.Empty',
        url: CONTEXT_PATH + '/define/groups/accountGroupMembersDataSource.json',
        extraParams : params,
        storeId: 'membersGridStore',
        remoteSort: true,
        listeners: {
            exception: function(proxy, store, response, e) {
                alert('error loading members grid:' + e);
            },
            metachange: reloadMetaData
        },
        pageSize: pageSize
    });

    var grid = new SailPoint.grid.PagingGrid({
      id: 'membersGrid',
      title: title,
      cls:'wrappingGrid',
      collapsible: true,
      titleCollapse: true,
      // Doesn't matter what our column model is because we will reconfig
      // it upon fetching the metadata
      columns: [{header: 'Name', sortable: true}],
      store: store,
      pageSize: pageSize,
      viewConfig: {
        scrollOffset: 1,
        stripeRows: true
      },
      loadMask: true
    });
    
    grid.on('expand', function(panel) {
      var window = Ext.getCmp('accountGroupMainPanel');
      if(window) {
        var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;  
        window.body.scrollTo('top', panelTop);
      }
    }, this);
    return grid;
}

SailPoint.AccountGroup.getAccessGrid = function(gridMetaData, params, pageSize, title) {

    var store = SailPoint.Store.createStore({
        fields: gridMetaData.fields,
        url: CONTEXT_PATH + '/define/groups/accountGroupAccessDataSource.json',
        extraParams : params,
        storeId: 'accessGridStore',
        remoteSort: true,
        root: 'objects',
        totalProperty: 'count',
        listeners: {
            exception: function(proxy, store, response, e) {
                alert('error loading access grid:' + e);
            }
        },
        pageSize: pageSize
    });

    var grid = new SailPoint.grid.PagingGrid({
        id: 'accessGrid',
        title: title,
        cls:'wrappingGrid',
        collapsible: true,
        titleCollapse: true,
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        store: store,
        pageSize: pageSize,
        viewConfig: {
            scrollOffset: 1,
            stripeRows: true
        },
        loadMask: true
    });

    grid.on('expand', function(panel) {
        var window = Ext.getCmp('accountGroupMainPanel');
        if(window) {
            var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
            window.body.scrollTo('top', panelTop);
        }
    }, this);
    return grid;
};

SailPoint.AccountGroup.getClassificationGrid = function(gridMetaData, params, pageSize, title) {
    var managedAttributeUrl = '/rest/managedAttributes/' + params.id + '/classifications' + '?refererType=' + params.refererType + '&refererId=' + params.refererId;
    var store = SailPoint.Store.createRestStore({
        storeId:'classificationGridStore',
        url: SailPoint.getRelativeUrl(managedAttributeUrl),
        remoteSort:true,
        fields : ['displayableName','description','origin'],
        simpleSortMode : true,
        totalProperty: 'count',
        pageSize: pageSize,
        sorters : [{property : 'displayableName', direction : 'ASC'}]
    });

    var grid = new SailPoint.grid.PagingGrid({
        id: 'classificationGrid',
        title: title,
        cls:'wrappingGrid',
        collapsible: false,
        titleCollapse: true,
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        store: store,
        pageSize: pageSize,
        viewConfig: {
            scrollOffset: 1,
            stripeRows: true
        },
        loadMask: true
    });

    grid.on('expand', function(panel) {
        var window = Ext.getCmp('accountGroupMainPanel');
        if(window) {
            var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
            window.body.scrollTo('top', panelTop);
        }
    }, this);
    return grid;
};

SailPoint.AccountGroup.getCamRolesGrid = function(gridMetaData, params, scopesMetaData, servicesGrid) {

    var store = SailPoint.Store.createStore({
        fields: gridMetaData.fields,
        url: CONTEXT_PATH + '/define/groups/accountGroupCamDataSource.json',
        extraParams : params,
        storeId: 'camGridStore',
        remoteSort: true,
        root: 'camRolesJson',
        totalProperty: 'count'
    });

    var gridCnf = {
        id: 'camGrid',
        title: '#{msgs.cloud_roles}',
        cls: 'smallFontGrid selectableGrid',
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        store: store,
        hidebbar: true,
        bodyPadding: 10,
        bodyBorder: false,
        border: 0,
        // We just need the grid title, so hideHeaders
        hideHeaders: true,
        scroll: 'vertical',
        viewConfig: {
            scrollOffset: 1,
            stripeRows: true
        },
        flex: 1,
        loadMask: true
    };

    var grid = Ext.create('SailPoint.AccountGroup.CamRoleExpandoGrid', gridCnf, scopesMetaData, servicesGrid, params);

    grid.getView().on('render', function(view) {
        view.tip = Ext.create('Ext.tip.ToolTip', {
            target: view.el,
            delegate: view.itemSelector,
            trackMouse: false,
            renderTo: Ext.getBody(),
            listeners: {
                // Change content dynamically depending on which element triggered the show.
                // I found this to be the best way to get our tooltip showing for the expando parent.
                beforeshow: function updateTipBody(tip) {
                    try {
                        tip.update(view.getRecord(tip.triggerElement).get('roleName'));
                    } catch {
                        tip.disable();
                    }
                    // The goal is to use our tooltip. After ensuring no lapse above, disable and set ours.
                    // Also, setting the tooltip on the parent sets the children under expando.  So we have
                    // to disable this tip and build it with buildTooltips.
                    tip.disable();
                    buildTooltips(tip.triggerElement);
                }
            }
        });
    });

    return grid;
};

SailPoint.AccountGroup.getCamServicesGrid = function(gridMetaData, params, pageSize, title, resMetaData) {
    var servicesStore = SailPoint.Store.createStore({
        storeId:'camServicesStore',
        fields: gridMetaData.fields,
        url: CONTEXT_PATH + '/define/groups/accountGroupCamServiceDataSource.json',
        remoteSort: true,
        root: 'camServicesJson',
        totalProperty: 'count',
        pageSize: pageSize
    });

    var servicesGridCnf = {
        title: '#{msgs.ui_cam_services_header}',
        store: servicesStore,
        cls: 'smallFontGrid selectableGrid',
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        hidebbar: true,
        // We just need the grid title, so hideHeaders
        hideHeaders: true,
        scroll: 'vertical',
        bodyPadding: 10,
        bodyBorder: false,
        border: 0,
        viewConfig: {
            scrollOffset: 1,
            stripeRows: true
        },
        flex: 2
    };

    // get the expando
    var servicesGrid = Ext.create('SailPoint.AccountGroup.CamSvcExpandoGrid', servicesGridCnf, resMetaData, params);

    servicesStore.on('load', function() { SailPoint.AccountGroup.checkCamData(servicesGrid); });

    servicesGrid.on('expand', function(panel) {
        var window = Ext.getCmp('accountGroupMainPanel');
        if(window) {
            var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
            window.body.scrollTo('top', panelTop);
        }
    }, this);
    return servicesGrid;
};

SailPoint.AccountGroup.getAssocRolesGrid = function(gridMetaData, params, pageSize, title) {

    var store = SailPoint.Store.createStore({
        fields: gridMetaData.fields,
        url: CONTEXT_PATH + '/define/groups/accountGroupAssocRolesDataSource.json',
        extraParams : params,
        storeId: 'assocRolesGridStore',
        remoteSort: true,
        root: 'objects',
        totalProperty: 'count',
        listeners: {
            exception: function(proxy, store, response, e) {
                alert('error loading associated roles grid:' + e);
            }
        },
        pageSize: pageSize
    });

    var grid = new SailPoint.grid.PagingGrid({
        id: 'assocRolesGrid',
        title: title,
        cls:'wrappingGrid',
        collapsible: true,
        titleCollapse: true,
        gridMetaData: gridMetaData,
        columns : gridMetaData.columns,
        store: store,
        pageSize: pageSize,
        viewConfig: {
            scrollOffset: 1,
            stripeRows: true
        },
        loadMask: true
    });

    grid.on('expand', function(panel) {
        var window = Ext.getCmp('accountGroupMainPanel');
        if(window) {
            var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
            window.body.scrollTo('top', panelTop);
        }
    }, this);
    return grid;
};

SailPoint.AccountGroup.renderInheritedGroups = function(appName, referenceAttributeName, currentValue) {
    var isGroupTabEnabled = (Ext.getDom('showGroupTab').innerHTML.toLowerCase() == "true");
    var isProvisioningEnabled = (Ext.getDom('provisioningEnabled').innerHTML.toLowerCase() == "true");
    var store;
    if (isGroupTabEnabled) {
        var jsonData = Ext.decode(Ext.getDom('inheritedGroupsInit').innerHTML);
        if (isProvisioningEnabled) {
            Ext.getDom('inheritingTbl').style['position'] = 'static';
            Ext.getDom('inheritingTbl').style['width'] = '600px';
            Ext.getDom('inheritingTbl').style['border'] = '0 none white';
            Ext.getDom('inheritingTbl').className = 'x-column-header';
            var inheritedGroupsInput = new SailPoint.MultiSuggest({
                id: 'inheritedAccountGroups',
                suggestType : 'inheritedAccountGroup',
                jsonData: jsonData,
                displayField: 'displayName',
                inputFieldName: 'editForm:inheritedAccountGroupIds',
                renderTo: 'inheritingTbl',
                disabled: !isProvisioningEnabled,
                width: 600,
                comboWidth: 295,
                padSuggest: true,
                emptyText: '#{msgs.add_group}',
                extraParams: {
                    application: appName,
                    referenceAttribute: referenceAttributeName,
                    currentValue: currentValue
                },
                extraFields: [
                    'owner'
                ],
                gridOverrides: {
                    columns: [{
                        name: 'id',
                        dataIndex: 'id',
                        header: '',
                        width: 10,
                        sortable: false,
                        hideable: false,
                        menuDisabled: true,
                        renderer: function(value, p, rec, rowIndex, colIndex, store) {
                            return SailPoint.MultiSuggest.renderRemove('', p, rec, rowIndex, colIndex, store);
                        }
                    },{
                        name: 'displayField',
                        dataIndex: 'displayField',
                        header: '#{msgs.name}',
                        width: 90,
                        sortable: true
                    },{
                        name: 'owner',
                        dataIndex: 'owner',
                        property: 'owner.displayName',
                        header: '#{msgs.owner}',
                        width: 100,
                        sortable: true
                    }],
                    cls: 'wrappingGridCells',
                    loadMask: true,
                    width: 600,
                    height: this.listHeight || 128,
                    pageSize: 25,
                    autoScroll: true,
                    hideHeaders: false,
                    forceFit: true,
                    viewConfig: {                
                        scrollOffset: 1,
                        stripeRows: true
                    }
                }
            });
            
            inheritedGroupsInput.suggest.getStore().loadData(jsonData.objects);
            inheritedGroupsInput.selectedStore.loadData(jsonData.objects);            
        } else {
            var gridId = 'inheritedGroupsGrid';
            var baseHeight = new Number(Ext.getDom('numInherited').value) * 50 + 28;
            var pageSize = 10;
            
            // data store
            var store = SailPoint.Store.createStore({
                model : 'SailPoint.model.Empty',
                storeId: gridId +'Store',
                extraParams : { id: Ext.getDom('editForm:id').value },
                url: CONTEXT_PATH + '/define/groups/inheritedNameOnlyAccountGroupsDataSource.json',
                remoteSort: true,
                pageSize: pageSize,
                autoLoad: true,
                listeners: {
                    exception: function(proxy, store, response, e) {
                        alert('error loading ' + gridId + ' grid:' + e);
                    },
                    metachange: reloadMetaData
                }
            });
            
            new SailPoint.grid.PagingGrid({
                id: gridId,
                cls: 'wrappingGridCells',
                collapsible: false,
                collapsed: false,
                titleCollapse: true,
                width: 600,
                height: baseHeight > 128 ? baseHeight : 128,
                store: store,
                renderTo: 'inheritingTbl',
                columns: [{header: 'name', sortable: true}, {header: 'owner', sortable: true}],
                viewConfig : {
                    stripeRows: true,
                    columnWidth: 290
                },
                loadMask: true,
                pageSize: pageSize
            });
        }
    }
};

SailPoint.AccountGroup.renderHierarchyPanel = function() {
    new Ext.panel.Panel({
        id: 'hierarchyPanel',
        title: '#{msgs.inheritance}',
        layout: { type: 'hbox', align: 'left' },
        items: [Ext.getCmp('accountGroupHierarchyTree'), Ext.getCmp('inheritedAccountGroupsPanel')],
        collapsible: true,
        renderTo: 'inheritingTbl',
        width: 704
    });    
}


SailPoint.AccountGroup.updateReferenceAttributeSuggest = function(appName) {
    var referenceAttributeSuggest = Ext.getCmp('referenceAttributeSuggest');
    var referenceAttribute = Ext.getDom('referenceAttributeInput').value;
    var isGroup = (Ext.getDom('isGroup').innerHTML.toLowerCase() == "true");
    var typeCombo = Ext.getCmp('typeComboCmp');
    if (!referenceAttributeSuggest) {
        if (isGroup) {
           Ext.getDom('referenceAttribute').innerHTML = '<span>' + referenceAttribute + '</span>';
        } else if (!Ext.get('editForm:unboundPermissionTarget') && (!typeCombo || (typeCombo && !typeCombo.isDisabled()))) {
            Ext.getDom('referenceAttribute').innerHTML = '';
            referenceAttributeSuggest = new SailPoint.AccountAttributeSuggest({
                id: 'referenceAttributeSuggest',
                application: appName,
                jsonData: {"totalCount":0,"objects":[]},
                renderTo: 'referenceAttribute',
                binding: 'referenceAttributeInput',
                valueField: 'name',
                displayField: 'name',
                value: referenceAttribute,
                width: 300,
                listeners: {
                    select: function(combo, records, eOpts) {
                        if (this.binding) {
                            this.binding.value = records[0].data[this.valueField || this.displayField];
                        }
                    }
                }
            });            

            if (referenceAttribute.length > 0) {
                var referenceAttributeRecords = Ext.decode(Ext.getDom('referenceAttributeInit').innerHTML);
                referenceAttributeSuggest.getStore().loadData(referenceAttributeRecords.attributes);
                referenceAttributeSuggest.setValue(referenceAttribute);
            }
        }
    } else {
        referenceAttributeSuggest.clearValue();
        referenceAttributeSuggest.getStore().getProxy().extraParams['application'] = appName;
        referenceAttributeSuggest.getStore().load({ 
            params:{start: 0, limit: referenceAttributeSuggest.pageSize }
        });
    }
};

SailPoint.AccountGroup.initDescriptions = function() {
    var descrValue = Ext.getDom('editForm:managedAttributeDescription').value;
    var allowManagedAttributeLocalization = Ext.getDom("allowManagedAttributeLocalization").innerHTML;
    
    if(!descrValue) {
        descrValue = ' ';
    }

    if(Ext.getDom('managedAttributeDescriptionHTML') && Ext.getDom("managedAttributeDescriptionsJSON")) {
        Ext.create('SailPoint.MultiLanguageHtmlEditor', {
            renderTo: 'managedAttributeDescriptionHTML',
            width:500,
            height:200,
            languageJSON : Ext.getDom("managedAttributeDescriptionsJSON").innerHTML,
            id:'managedAttributeDescriptionHTMLCmp',
            value: descrValue,
            langSelectEnabled: allowManagedAttributeLocalization == "true",
            defaultLocale : Ext.getDom("manAttrdescrDefaulLocale").innerHTML
        });
    }
};

function renderTarget(value, p, r) {
    var target = r.get('target');
    var id = r.id;

    var targetTemplate = new Ext.XTemplate(
        '<tpl if="!descriptionFirst && values.description">',
            '<div style="display:inline"><span class="entitlementDescriptions" id="description_'+id+'"><span>{description}</span><img style="margin-left:5px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span>',
            '<span class="entitlementValues" id="name_'+id+'" style="display:none"><span>{name}</span><img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span></div>',
        '</tpl>',
        '<tpl if="descriptionFirst && values.description">',
          '<div style="display:inline"><span class="entitlementValues" id="name_'+id+'"><span>{name}</span><img style="margin-left:5px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span>',
          '<span style="display:none" class="entitlementDescriptions" id="description_'+id+'"><span>{description}</span><img style="margin: 0 2px 0 2px" src="' + SailPoint.CONTEXT_PATH + '/images/icons/info.png" height="14px" width="14px"/></span></div>',
        '</tpl>',
        '<tpl if="!values.description">{name}</tpl>'
    );
    
    var txt = targetTemplate.apply(target);
    return Ext.String.format('{0}', txt);
};

function renderRight(value,p,r) {
    if (value == null) {
        return '';
    }
    else if (Ext.isDefined(r.raw.denyPermission) && r.raw.denyPermission) {
        var locAriaLabel =  Ext.String.format('#{msgs.deniedPermission}');
        return '<i aria-label="' + locAriaLabel + '" class="fa fa-minus-circle fa-lg"></i>' + value;
    }
    else {
        return value;
    }
};

SailPoint.AccountGroup.getNoResultsText = function(panelWidth) {
    var noResultsMsg = '<p class="h4 text-center">#{msgs.ui_no_results}</p>';

    var noResultsText = {
        xtype: 'text',
        width: panelWidth - 50,
        padding: 50,
        html: noResultsMsg
    }
    return noResultsText;
};

SailPoint.AccountGroup.getNoResultsPanel = function(panelWidth) {
    var noResultsText = SailPoint.AccountGroup.getNoResultsText(panelWidth);

    var noResultsPanel = {
        xtype: 'panel',
        id: 'noResultsPanel',
        bodyBorder: false,
        border: 0,
        width: panelWidth,
        bodyStyle:{
            "background-color":"white",
            "z-index":"200"
        },
        items: noResultsText,
        dock: 'left'
    };

    return noResultsPanel;
};

SailPoint.AccountGroup.getErrorMsgText = function(errors, panelWidth) {
    var msgHeader = '<h5 class="panel-title font-bold text-danger"><i class="fa fa-exclamation-triangle text-danger" role="presentation"></i>';
    msgHeader += '#{msgs.ui_cam_server_errors}</h5>';
    var errorList = "";
    if (errors && errors.length > 0) {
        errorList = '<ul class="list-group">';
        for (i = 0; i < errors.length; i++) {
            errorList += '<li class="cam-list-item list-group-item alert-danger reader-error error-outline validation-error" role="alert">' + errors[i] + '</li>';
        }
        errorList += '</ul>';
    }
    var errorHtml = msgHeader + errorList;

    var errorText = {
        xtype: 'text',
        width: panelWidth - 50,
        padding: 50,
        html: errorHtml
    }
    return errorText;
};

SailPoint.AccountGroup.getErrorMsgPanel = function(errors, panelWidth) {
    var errorText = SailPoint.AccountGroup.getErrorMsgText(errors, panelWidth);

    var errorPanel = {
        xtype: 'panel',
        id: 'errorPanel',
        bodyBorder: false,
        border: 0,
        width: panelWidth,
        bodyStyle:{
            "background-color":"white",
            "z-index":"200"
        },
        items: errorText,
        dock: 'left'
    };

    return errorPanel;
};

/**
 * Check the CAM data to see if  1) we have any  2) there are errors.
 */
SailPoint.AccountGroup.checkCamData = function(grid) {
    var gridWidth;
    try {
        gridWidth = grid.getWidth();
    } catch (err) {
        try {
            gridWidth = grid.ownerCt.ownerCt.getWidth() - 15;
        } catch (err1) {
            gridWidth = 888;
        }
    }
    var infoPanel = {
            xtype: 'panel',
            id: 'infoPanel',
            border: 10,
            width: gridWidth,
            bodyStyle:{
                "background-color":"white",
                "z-index":"200"
            },
            dock: 'left'
    };

    // We use the services grid panel for multiple loads of scopes,
    // so if an error or no-results shows up on one load, it could show up on
    // another load even if it doesn't belong unless we remove it first.
    var dockedPanel = grid.getDockedComponent('infoPanel');
    if (dockedPanel) {
        grid.removeDocked(dockedPanel, false);
        dockedPanel.destroy();
        grid.updateLayout();
    }

    var gridHeight;
    try {
        gridHeight = grid.getView().getHeight();
    } catch (err) {
        try {
            gridHeight = grid.ownerCt.ownerCt.getHeight();
        } catch (err1) {
            gridHeight = 200;
        }
    }

    if (!grid.store.data.items || grid.store.data.items.length < 1) {
        var divHeight = 200;
        var noResultsText = SailPoint.AccountGroup.getNoResultsText(gridWidth);
        infoPanel.items = noResultsText;
        if (divHeight > gridHeight) {
            grid.setHeight(divHeight);
        }
        grid.addDocked(infoPanel, 1);
    } else {
        serverErrors = grid.store.data.items[0].data.serverErrors;
        if (serverErrors) {
            // we have errors, so don't show any data in the grid.
            grid.store.removeAll();
            var divHeight = 150 + (serverErrors.length * 35);
            var panelWidth = gridWidth;
            var errorText = SailPoint.AccountGroup.getErrorMsgText(serverErrors, panelWidth);
            infoPanel.items = errorText;
            if (divHeight > gridHeight) {
                grid.setHeight(divHeight);
            }
            grid.addDocked(infoPanel, 1);
        }
    }
};

/*Function Used Generate Pop-up to get Group Search Scope as input for LDAP Multigroup Application */
SailPoint.AccountGroup.groupScopeDefinition = function(index) {
    Ext.define('group',{
        extend: 'Ext.data.Model',
        fields: ['objectType', 'memberSearchDN', 'memberSearchFilter']
    });

    var objectType,
        scopeJ,
        serachDN,
        store = '',
        groups,
        scopeDom,
        dnDom;

    if (Ext.isDefined(index)) {
        scopeDom = 'editForm:scopeObjInfo:' + index + ':multiGroupScopeHidden';
        dnDom = 'editForm:scopeObjInfo:' + index + ':searchDN';
    } else {
        scopeDom = 'editForm:multiGroupScopeHidden';
        dnDom = 'editForm:searchDN';
    }
    
    if (Ext.isDefined(Ext.getDom('editForm:groupObjectTypes'))) {
        objectType = Ext.getDom('editForm:groupObjectTypes').value;
        groups = objectType.split('|');
    }
    if (Ext.isDefined(Ext.getDom(scopeDom)) && Ext.getDom(scopeDom) != null) {
        scopeJ = Ext.getDom(scopeDom).value;
        scopeJ = scopeJ.replace(/\\n/g,'\\n').replace(/\r\n/g,'\\r\\n').replace(/\n/g,'\\r\\n').replace(/\r\r/g,'\\r');
    }
    if (Ext.isDefined(Ext.getDom(dnDom)) && Ext.getDom(dnDom) != null) {
        serachDN = Ext.getDom(dnDom).value;
    }

    if (!Ext.isDefined(eval(scopeJ)) && Ext.isDefined(objectType)) {
         var data = '[';

         Ext.each(groups, function (obj) {
             if (obj) {
                  data = data + '{"objectType":"' + obj + '","memberSearchDN":"","memberSearchFilter":""},';
              }
         });
         
         if (data.length > 1) {
             data = data.substr(0,data.length-1) + ']';
         } else {
             data = data + "]";
         }
         store = eval(data);
    } else if (Ext.isDefined(objectType)) {
        var extra ='',
            prefix = '\'objectType\':\'',
            suffix = '\'';

        Ext.each(groups, function (obj) {
            if (obj && (scopeJ.indexOf(prefix+obj+suffix)<0)) {
                extra = extra + ',{"objectType":"'+obj+'","memberSearchDN":"","memberSearchFilter":""}';
            }
        });
        
        if (extra.length > 0) {
            scopeJ = scopeJ.substr(0,scopeJ.length-1) + extra  +']';
        }
         store = eval(scopeJ);
    }

    var ScopeStore = Ext.create('Ext.data.Store', {
        model: 'group',
        storeId:'groupSearchStore',
        id: 'groupStore',
        fields: ['objectType', 'memberSearchDN', 'memberSearchFilter'],
        data: store,
        proxy: {
            type: 'memory',
            reader: {
                type: 'json',
                idProperty: 'group'
            }
        },
        autoSync: true,
        autoLoad: true
    });

    var groupScopeGrid = Ext.create('Ext.grid.Panel', {
        id: 'groupGrid',
        cls : 'groupScopeGrid',
        bodyStyle: 'background-color:#EEEEEE;',
        style: 'background-color:#EEEEEE',
        store: ScopeStore,
        columns: [
            {
                text: "#{msgs.con_form_ldap_groupType}",
                dataIndex: 'objectType',
                sortable: false,
                menuDisabled: true,
                minWidth: 150,
                resizable: false
            },
            {
                text: "#{msgs.con_form_ldap_grp_mbr_srch_dn}",
                dataIndex: 'memberSearchDN',
                sortable: false,
                minWidth: 400,
                resizable: false,
                menuDisabled: true,
                editor: {
                    xtype: 'textareafield',
                    allowBlank: true,
                    height:40,
                    autoScroll : true,
                },
                renderer: function(value, metaData) {
                    metaData.style = "border: 1px gray solid;white-space:pre-wrap;";
                    return value;
                }
            },
            {
                text: "#{msgs.con_form_ldap_grp_mbr_srch_filter}",
                dataIndex: 'memberSearchFilter',
                sortable: false,
                minWidth: 400,
                resizable: false,
                menuDisabled: true,
                editor: {
                    xtype: 'textfield',
                    height:40,
                    allowBlank: true
                },
                renderer: function(value, metaData) {
                    metaData.style = "border: 1px gray solid;";
                    return value;
                }
            } 
        ],
        selType: 'cellmodel',
        plugins: [
            Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1
            })
        ]
    });

 Ext.create('Ext.window.Window', {
        id: 'main',
        resizable: false,
        modal : true,
        minWidth: 900,
        title: "#{msgs.con_form_ldap_popup_title}" + serachDN,
        items: [groupScopeGrid],
        buttons: [{
            text: "#{msgs.button_save}",
            cls: 'primaryBtn',
            scale : 'medium',
            handler: function() {
                var count = ScopeStore.getCount()-1,
                    datavalue = ScopeStore.data.getRange(0,count),
                    finalGrpScope = '[';

                Ext.each(datavalue, function (obj) {
                    var searchDN = obj.get('memberSearchDN').replace(/\\n/g,'\\\\n').replace(/\n/g,'\\r\\n').replace(/\r\n/g,'\\r\\n');
                    finalGrpScope = finalGrpScope + '{\'objectType\':\''+obj.get('objectType')+'\',\'memberSearchDN\':\''+searchDN+'\',\'memberSearchFilter\':\''+obj.get('memberSearchFilter')+'\'},';
                });

                finalGrpScope = finalGrpScope.substring(0, finalGrpScope.length - 1) + ']';
                
                Ext.getDom(scopeDom).value = finalGrpScope;
                
                ScopeStore.commitChanges();
                Ext.ComponentManager.get('groupGrid').saveState();
                Ext.getCmp('main').close();
            }
        }]
    }).show();
};

Ext.define('SailPoint.AccountGroup.CamRoleExpandoGrid', {
    extend : 'SailPoint.grid.PagingGrid',

    disableActions : false,
    requester : null,
    camServicesGrid: null,
    camScopesMetaData: null,
    passedParams: null,

    constructor : function(config, scopesMetaData, servicesGrid, params){

        config.plugins = [this.initCamRoleExpandoForm(), {
            ptype: 'sprowexpander',
            //subgrid
            rowBodyTpl: '<div class="subGrid"></div>',
            expandOnDblClick: false

        }];

        passedParams = params;
        camScopesMetaData = scopesMetaData;
        camServicesGrid = servicesGrid;
        Ext.apply(this, config);
        this.callParent(arguments);
    },

    initComponent : function() {
        this.callParent(arguments);

        this.getView().on('expandbody', function(rowNode, record, expandRow, eOpts) {
            this.panel.loadCamRoleExpandoContent(rowNode, record, expandRow, eOpts, this.panel);
        });
    },

    fireResizeHackForIE : function(e, s, r, o) {
        if(Ext.isIE) { // Give IE some time to get its act together!
            Ext.defer(function(){
                o.grid.getView().fireEvent('resize', null);
            }, 100);
        }
    },

    onClickCamScope: function(gridView, record, HTMLitem, index, e, eOpts) {
        if (record.data && record.data.uri != null) {
            // TODO: title should be <Role> Role ID: <Role id> CSP: <AWS>
            var scopeParams = {start:0, scopeUri: record.data.uri};
            Ext.apply(scopeParams, passedParams);
            camServicesGrid.setTitle(Ext.String.format("#{msgs.ui_cam_services_uri_header}", record.data.displayName));
            camServicesGrid.getStore().load({params:scopeParams});
        }
    },

    loadCamRoleExpandoContent: function(rowNode, record, expandRow, eOpts, grid) {
        var rowBody = Ext.get(expandRow).query('.x-grid-rowbody')[0];
        //subgrid
        var subGridDiv = Ext.DomQuery.select('div.subGrid',rowBody)[0];
        if( subGridDiv.children.length > 0 ){
            return;
        }
        var camScopeStore = SailPoint.Store.createStore({
            storeId:'camScopeStore',
            fields: camScopesMetaData.fields,
            data: record.data.scopes,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'items'
                }
            }
        });

        var camScopeGrid = new SailPoint.grid.PagingGrid({
            store: camScopeStore,
            gridMetaData: camScopesMetaData,
            columns : camScopesMetaData.columns,
            hidebbar: true,
            scroll: 'vertical',
            bodyPadding: 10,
            bodyBorder: false,
            border: 0,
            viewConfig : {
                stripeRows: true,
                scrollOffset: 1
            },
            width: grid.getWidth() - 15,
            //subgrid
            renderTo: subGridDiv
        });

        camScopeGrid.on('expand', function(panel) {
            var window = Ext.getCmp('accountGroupMainPanel');
            if(window) {
                var panelTop = panel.getEl().getOffsetsTo(window.body)[1] + window.body.getScroll().top;
                window.body.scrollTo('top', panelTop);
            }
        }, this);

        camScopeStore.on('load', function() {
            buildTooltips(rowNode);
        });

        camScopeStore.load();

        // Some kind of resize when window resizes
        this.getView().on('resize', function() {
            //TODO: may need to reload data on resize?
            camScopeGrid.setWidth(grid.getWidth()- 15);
        });

        camScopeGrid.on('itemclick', function() {
            // propagate selection to the parent grid row
            grid.getSelectionModel().select(record);
            this.onClickCamScope.apply(this, arguments);
        }, this);
    },  // End of loadCamRoleExpandoContent

    /**
     * @private Initializes and returns the form plugin.
     */
    initCamRoleExpandoForm : function(){

        var gridForm = new SailPoint.grid.GridExpandoPlugin({

            //gridId : null,
            initExpandoPanel : function(grid){
            }

        });

        return gridForm;
    }
});  // End of CamRoleExpandoGrid


Ext.define('SailPoint.AccountGroup.CamSvcExpandoGrid', {
    extend : 'SailPoint.grid.PagingGrid',

    disableActions : false,
    requester : null,
    camResourcesMetaData : null,
    passedParams: null,

    constructor : function(config, resMetaData, params){

        config.plugins = [this.initSvcExpandoForm(), {
            ptype: 'sprowexpander',
            //subgrid
            rowBodyTpl: '<div class="subGrid"></div>',
            expandOnDblClick: false

        }];

        passedParams = params;
        camResourcesMetaData = resMetaData;
        Ext.apply(this, config);
        this.callParent(arguments);
    },

    initComponent : function() {
        this.callParent(arguments);

        this.getView().on('expandbody', function(rowNode, record, expandRow, eOpts) {
            this.panel.loadSvcExpandoContent(rowNode, record, expandRow, eOpts, this.panel);
        });
    },

    fireResizeHackForIE : function(e, s, r, o) {
        if(Ext.isIE) { // Give IE some time to get its act together!
            Ext.defer(function(){
                o.grid.getView().fireEvent('resize', null);
            }, 100);
        }
    },

    loadSvcExpandoContent: function(rowNode, record, expandRow, eOpts, grid) {
        var rowBody = Ext.get(expandRow).query('.x-grid-rowbody')[0];
        //subgrid
        var subGridDiv = Ext.DomQuery.select('div.subGrid',rowBody)[0];
        if( subGridDiv.children.length > 0 ){
            return;
        }
        var resParams = {
            scopeUri: record.data.scopeUri,
            serviceType: record.data.serviceType
        };
        Ext.apply(resParams, passedParams);
        var resourcePageNum = 1;
        var rowsPerPage = 10;
        var storeIdent = 'camResStore' + rowNode.id;
        var resStore = SailPoint.Store.createStore({
            storeId: storeIdent,
            fields: camResourcesMetaData.fields,
            url: CONTEXT_PATH + '/define/groups/accountGroupCamResourceDataSource.json',
            pageSize: rowsPerPage,
            extraParams: resParams,
            root: 'camResourcesJson',
            totalProperty: 'totalCount'
        });

        var camResGrid = new SailPoint.grid.PagingGrid({
            store: resStore,
            gridMetaData: camResourcesMetaData,
            cls: 'smallFontGrid selectableGrid',
            columns : camResourcesMetaData.columns,
            hidebbar: true,
            pageSize: rowsPerPage,
            width: grid.getWidth() - 15,
            scroll: 'vertical',
            bodyPadding: 10,
            bodyBorder: false,
            border: 0,
            viewConfig: {
                scrollOffset: 15,
                stripeRows: true
            },
            //subgrid
            renderTo: subGridDiv
        });

        var pageSizes = Ext.create('Ext.data.Store', {
            fields: ['pgSize'],
            data: [
                {"pgSize":10},
                {"pgSize":25},
                {"pgSize":50}
            ]
        });

        var dockedBbar = [{
            xtype: 'toolbar',
            dock: 'bottom',
            itemId: 'resGridBar',
            items: [
                {
                    xtype: 'tbtext',
                    itemId: 'showText',
                    text: '<h5 style="font-size:110%">#{msgs.ui_page_size_show}</h5>'
                },
                {
                    xtype: 'combo',
                    itemId: 'rowsPerPg',
                    width: 75,
                    store: pageSizes,
                    queryMode: 'local',
                    displayField: 'pgSize',
                    valueField: 'pgSize',
                    value: 10,
                    disabled: false,
                    listeners: {
                        select: function(combo, records, eOpts) {
                            resStore.load({params:{limit:combo.getValue()}});
                        }
                    }
                },
                {
                    xtype: 'tbspacer',
                    flex: 2
                },
                {
                    xtype: 'tbtext',
                    itemId: 'pgText',
                    text: '<h5 style="font-size:110%">#{msgs.ui_page_page_label} 1</h5>'
                },
                {
                    xtype: 'tbspacer',
                    flex: 2
                },

                {
                    xtype: 'button',
                    itemId: 'prevBtn',
                    iconCls: 'x-btn-icon x-tbar-page-prev',
                    disabled: true,
                    handler: function() {
                        prevPage();
                    }
                },
                {
                    xtype: 'button',
                    itemId: 'nextBtn',
                    iconCls: 'x-btn-icon x-tbar-page-next',
                    style: 'margin-right: 20px',
                    disabled: true,
                    handler: function() {
                        nextPage();
                    }
                }
            ]
        }];

        camResGrid.addDocked(dockedBbar);

        function setPageText() {
            var pageNumText = '<h5 style="font-size:110%">' + Ext.String.format("#{msgs.ui_page_page_label}") + ' ' + resourcePageNum + '</h5>';
            camResGrid.getComponent('resGridBar').getComponent('pgText').update(pageNumText);
        }

        function prevPage() {
            var prevToken = resStore.getProxy().getReader().jsonData.prevToken;
            resourcePageNum--;
            setPageText();
            var selectedRows = camResGrid.getComponent('resGridBar').getComponent('rowsPerPg').getValue();
            resStore.load({params:{limit:selectedRows, token:prevToken}});
        }

        function nextPage() {
            var nextToken = resStore.getProxy().getReader().jsonData.nextToken;
            resourcePageNum++;
            setPageText();
            var selectedRows = camResGrid.getComponent('resGridBar').getComponent('rowsPerPg').getValue();
            resStore.load({params:{limit:selectedRows, token:nextToken}});
        }

        resStore.on('load', function() {
            SailPoint.AccountGroup.checkCamData(camResGrid);
            // buildTooltips runs on any,all data - if errors, then no data.
            buildTooltips(rowNode);

            if (!camResGrid.store.data.items || camResGrid.store.data.items.length < 10) {
                camResGrid.getComponent('resGridBar').getComponent('rowsPerPg').setDisabled(true);
            } else {
                camResGrid.getComponent('resGridBar').getComponent('rowsPerPg').setDisabled(false);
            }

            if (resStore.getProxy().getReader().jsonData) {
                var prevToken = resStore.getProxy().getReader().jsonData.prevToken;
                if (!prevToken) {
                    camResGrid.getComponent('resGridBar').getComponent('prevBtn').setDisabled(true);
                } else {
                    camResGrid.getComponent('resGridBar').getComponent('prevBtn').setDisabled(false);
                }
                var nextToken = resStore.getProxy().getReader().jsonData.nextToken;
                if (!nextToken) {
                    camResGrid.getComponent('resGridBar').getComponent('nextBtn').setDisabled(true);
                } else {
                    camResGrid.getComponent('resGridBar').getComponent('nextBtn').setDisabled(false);
                }
                if (!prevToken) {
                    resourcePageNum = 1;
                    setPageText();
                }
            }
        });

        camResGrid.columns[0].on('resize', function() {
            camResGrid.getView().refresh();
            buildTooltips(rowNode);
        });

        camResGrid.columns[2].on('resize', function() {
            camResGrid.getView().refresh();
            buildTooltips(rowNode);
        });

        camResGrid.columns[3].on('resize', function() {
            camResGrid.getView().refresh();
            buildTooltips(rowNode);
        });

        if (record.data) {
            // initial load
            resStore.load({params:{limit:rowsPerPage}});
        }

        // Some kind of resize when window resizes
        this.getView().on('resize', function() {
            //TODO: may need to reload data on resize?
            camResGrid.setWidth(grid.getWidth() - 15);
        });

        camResGrid.on('itemclick', function() {
            // propagate selection to the parent grid row
            grid.getSelectionModel().select(record);
        });
    },

    initSvcExpandoForm : function(){

        var gridForm = new SailPoint.grid.GridExpandoPlugin({

            gridId : null,

            initExpandoPanel : function(grid){
            }

        });

        return gridForm;
    }
});
