/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Role', 
       'SailPoint.Role.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Role');

SailPoint.Role.Search.getRoleSearchPanel = function(config) {
    var activeItem = 'roleSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = {
        xtype : 'sptabcontentpanel',
        id: 'roleSearchContents',
        layout: 'fit',
        contentEl: 'roleSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'advancedRoleSearchNavBtn',
                text: '#{msgs.advanced_search}',
                scale : 'medium',
                handler: SailPoint.Role.Search.displayAdvancedSearch,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preRoleSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                SailPoint.Analyze.validateSearch('roleSearchForm', 'role');
            }
        }, {
            id: 'roleClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('roleSearchForm:resetBtn').click()
            }
        }],
        loader: {
        	url: SailPoint.getRelativeUrl('/define/roles/search/roleSearchContentPanel.jsf'),
            params: { searchType: 'Role' },
            discardUrl: false,
            callback: SailPoint.Role.Search.initSearchContents,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    };

    var advancedSearchContents = Ext.create('Ext.panel.Panel', {
        id: 'advancedRoleSearchContents',
        layout: 'fit',
        contentEl: 'advancedRoleSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'roleSearchNavBtn',
                text: '#{msgs.role_search}',
                scale : 'medium',
                handler: SailPoint.Role.Search.displaySearchContents,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preAdvancedRoleSearchBtn',
            text: '#{msgs.button_run_search}',
            cls: 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('roleSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('advancedRoleSearchForm', 'advancedRole');
            }
        }, {
            id: 'advancedRoleClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('advancedRoleSearchForm:resetBtn').click()
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/advanced/advancedSearchContents.jsf'),
            params: {searchType: 'AdvancedRole'},
            discardUrl: false,
            callback: SailPoint.Role.Search.finishAdvancedSearchInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'roleSearchResultsGrid',
        type: 'role',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Role'),
        url: SailPoint.getRelativeUrl('/analyze/role/roleDataSource.json'),
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        handleClick: SailPoint.Role.Search.handleClick,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Role',
            cardPanelId: 'roleSearchPanel',
            searchPanelId: 'roleSearchContents',
            applySearchPanelStyles: function() {
                resizeTables('roleSearchForm');
                Ext.getCmp('roleSearchContents').doLayout();
                Ext.getCmp('roleDisplayFieldsPanel').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });

    var advancedResultsContents = SailPoint.Search.getResultsGrid({
        id: 'advancedRoleSearchResultsGrid',
        type: 'advancedRole',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('AdvancedRole'),
        url: SailPoint.getRelativeUrl('/analyze/role/advancedRoleDataSource.json'),
        handleClick: SailPoint.Role.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        sorters : [{ property: 'name', direction: 'ASC' }, {property: 'id', direction: 'ASC'}],
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'AdvancedRole',
            cardPanelId: 'roleSearchPanel',
            searchPanelId: 'advancedRoleSearchContents',
            applySearchPanelStyles: function() {
                Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
                Ext.getCmp('advancedRoleSearchContents').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
    
    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Role.Search.styleResultsGrid();
    });
    
    var searchPanel = {
        xtype : 'panel',
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, advancedSearchContents, resultsContents, advancedResultsContents],
        listeners : {
            activate : {
                fn : function(viewerPanel) {
                    if (!searchPanel.isLoaded) {
                        Ext.getCmp('roleSearchContents').getLoader().load();
                        advancedSearchContents.getLoader().load();
                        SailPoint.Role.Search.initResultsGrid();
                        Ext.getCmp(config.id).isLoaded = true;
                    }
                },
                scope : this,
                single : true
            }
        }
    };
    
    return searchPanel;
};

SailPoint.Role.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('roleSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('roleSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Role.Search.displayAdvancedSearchResults = function() {
    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedRoleSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('roleSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Role.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('roleSearchContents');
};

SailPoint.Role.Search.displayAdvancedSearch = function() {
    SailPoint.Search.clearForRefineSearch('advancedRoleSearchResultsGrid');

    var searchPanel = Ext.getCmp('roleSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedRoleSearchContents');

    if (!searchPanel.hasDisplayFields) {
        SailPoint.Analyze.SearchDisplayFields.initDisplayFields('advancedRole');
        searchPanel.hasDisplayFields = true;
    }
    Ext.getCmp('advancedRoleDisplayFieldsPanel').doLayout();
    SailPoint.Utils.styleSelects();
};


SailPoint.Role.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/role/roleDataSource.json'), 'roleSearchResultsGrid', 13, true);
};

SailPoint.Role.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('roleSearchResultsGrid');
    if (gridPanel) {
        var referenceDiv = Ext.get('example-grid');
        if (referenceDiv) {
            var gridWidth = referenceDiv.getWidth(true) - 20;
            gridPanel.setWidth(gridWidth);
            gridPanel.getPositionEl().applyStyles({
                'margin-left': '10px',
                'margin-right': '10px',
                'margin-bottom': '10px'
            });
        }    
    }
};

SailPoint.Role.Search.initSearchContents = function() {
    SailPoint.Analyze.Role.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('role');
    SailPoint.Role.Search.styleSearchPanels();
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: Ext.getDom('roleSearchCriteriaContent'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'roleSearchForm',
            searchType: 'Role'
        }
    });
    Ext.MessageBox.hide();
};

SailPoint.Role.Search.finishAdvancedSearchInit = function() {
    advRoleSearchFiltersPage = FiltersPage.instance('div.advRoleSearchspTabledAjaxContent', 'advRoleSearchfilterBeanListTbl', 'advancedRoleSearchForm', 'advRoleSearch');
    advRoleSearchFiltersPage.initPage();
    buildTooltips(Ext.getDom('advancedRoleAttributes'));
    buildTooltips(Ext.getDom('filterCriteria'));
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/role/advancedRoleDataSource.json'), 'advancedRoleSearchResultsGrid', 13, true);
    Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
    Ext.getCmp('advancedRoleSearchContents').doLayout();
};

SailPoint.Role.Search.styleSearchPanels = function() {
    resizeTables('roleSearchForm');
    buildTooltips(Ext.getDom('roleSearchCriteriaContent'));
    Ext.getCmp('roleSearchContents').doLayout();
};

SailPoint.Role.Search.styleResultsPanels = function() {
    if (Ext.isIE7) {
        var tabPanel = Ext.getCmp('roleTabPanel');
        var resultsHeader = Ext.get('roleSearchResultsHeader');
        var resultsContent = Ext.get(Ext.DomQuery.selectNode('div[class*=spBackground]', Ext.getDom('roleResultsForm')));
        var resultsFooter = Ext.get('roleSearchResultsFooter');
        var width = tabPanel.getWidth();
        resultsHeader.setWidth(width);
        resultsContent.setWidth(width);
        resultsFooter.setWidth(width);
    }
};

SailPoint.Role.Search.resetEntPermFields = function() {
    var roleProfileEntAttrSuggest = Ext.getCmp('roleProfileEntAttrSuggest');
    if (roleProfileEntAttrSuggest) {
        roleProfileEntAttrSuggest.clearValue();
        Ext.getDom('roleProfileEntAttr').value = '';
    }

    var roleProfilePermTargetSuggest = Ext.getCmp('roleProfilePermTargetSuggest');
    if (roleProfilePermTargetSuggest) {
        roleProfilePermTargetSuggest.clearValue();
        Ext.getDom('roleProfilePermTarget').value = '';
    }

    SailPoint.Role.Search.resetEntPermValueFields();
};

SailPoint.Role.Search.resetEntPermValueFields = function() {

    var roleProfileEntValueSuggest = Ext.getCmp('roleProfileEntValueSuggest');
    if (roleProfileEntValueSuggest) {
        roleProfileEntValueSuggest.clearValue();
        Ext.getDom('roleProfileEntValue').value = '';
    }

    var roleProfilePermRightSuggest = Ext.getCmp('roleProfilePermRightSuggest');
    if (roleProfilePermRightSuggest) {
        roleProfilePermRightSuggest.clearValue();
        Ext.getDom('roleProfilePermRight').value = '';
    }
};

SailPoint.Role.Search.resetRelationshipFields = function() {
    var formName = 'roleSearchForm';
    Ext.getDom(formName + ':profileInheritance').value = 'any';
    Ext.getDom(formName + ':profileReqPerm').value = 'any';
};

SailPoint.Role.Search.clearSearchFields = function() {
    var formName = 'roleSearchForm';
    Ext.getCmp('roleAttributesOwnerSuggest').clearValue();
    Ext.getDom('roleOwner').value = '';
    SailPoint.Analyze.clearExtendedAttributeFields('roleAttributes');
    SailPoint.Analyze.resetFieldsToDisplay('role');

    var classificationSuggest = Ext.getCmp('roleClassificationSuggest');
    if (classificationSuggest) {
        classificationSuggest.clearValue();
        Ext.getDom('roleClassification').value = '';
    }

    var roleProfileAppSuggest = Ext.getCmp('roleProfileAppSuggest');
    if (roleProfileAppSuggest) {
        roleProfileAppSuggest.clearValue();
        Ext.getDom(formName + ':roleProfileApp').value = '';
    }

    SailPoint.Role.Search.resetEntPermFields();

    // hide the conditional divs
    Ext.getDom('roleProfileRelatedOps').style.display = 'none';
    Ext.getDom('roleProfileEnt').style.display = 'none';
    Ext.getDom('roleProfilePerm').style.display = 'none';

    //clears out the value of the extended identity attributes
    var cells = Ext.query(".searchIdentitySuggestCell");
    for (var cell in cells){
        var element=Ext.get(cells[cell]);
        if (element){
            var id = element.child('div').getAttribute('id') + "Input";
            if(id){
               Ext.getDom(id).value = '';
            }
        }
    }
};

SailPoint.Role.Search.clearAdvancedRoleSearchFields = function() {
    SailPoint.Analyze.resetFieldsToDisplay('advancedRole');
    advRoleSearchFiltersPage.clearSearchFields();
};

SailPoint.Role.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    //gridView.clickedColumn is calculated in PagingGrid.js using a deprecated cellclick event
    //We may need to rethink this
    var col = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    var resultGrid = gridView.findParentByType('grid');
    resultGrid.gridState._setValue('pageSize', resultGrid.pageSize);
    if(col) {
        if(Ext.getCmp('roleTabPanel')) {
            Ext.getDom('roleSearchForm:currentObjectId').value = record.getId();
            Ext.getDom('ajaxEditButton').click();
        } else {
            Ext.getDom('roleSearchForm:currentObjectId').value = record.getId();
            Ext.getDom('roleSearchForm:editButton').click();
        }
    } else {
        e.stopEvent();
    }
};


/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/
SailPoint.Analyze.Role.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if(Ext.getDom('roleStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':roleStartDate', '');
  }
  if(Ext.getDom('roleEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':roleEndDate', '');
  }
  
  if(Ext.getDom('roleStartDateSelect').checked && Ext.getDom('roleEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':roleStartDate', formName+':roleEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
};

SailPoint.Analyze.Role.updateProfileType = function(menuSelect, entTargetElement, permissionTargetElement) {
    var currentApp = Ext.getDom('roleSearchForm:roleProfileApp').value;
    SailPoint.Role.Search.initializeEntPermSuggests(currentApp, null);
    SailPoint.Role.Search.resetEntPermFields();
    SailPoint.Analyze.Role.adjustProfileTypeSubFields();
};

SailPoint.Analyze.Role.adjustProfileTypeSubFields = function() {
    var profType = Ext.getDom('roleSearchForm:profileType').value;
    toggleDisplay(Ext.get('roleProfileEnt'), profType !== 'Entitlement');
    toggleDisplay(Ext.get('roleProfilePerm'), profType !== 'Permission');
};

SailPoint.Analyze.Role.updateProfileLocality = function(menuSelect, localityElement) {
    SailPoint.Role.Search.resetRelationshipFields();
    SailPoint.Analyze.Role.adjustProfileLocalitySubFields();
};

SailPoint.Analyze.Role.updateAppOperator = function(menuSelect) {
    var currentApp = Ext.getDom('roleSearchForm:roleProfileApp').value;
    SailPoint.Role.Search.initializeEntPermSuggests(currentApp, null);
    SailPoint.Role.Search.resetEntPermFields();
};

SailPoint.Analyze.Role.adjustProfileLocalitySubFields = function() {
    var profLocality = Ext.getDom('roleSearchForm:profileLocality').value;
    toggleDisplay(Ext.getDom('roleProfileRelatedOps'),
        profLocality !== 'selfAndSpecificRelated' && profLocality !== 'specificRelatedOnly' );
};

SailPoint.Analyze.Role.calcBPREntNameSuggestFilter = function(currentApp) {
    var filter = 'type != "Permission"';
    if (currentApp) {
        var appOper = Ext.getDom('roleSearchForm:profileAppOper').value;
        var oper = (appOper == 'Equal') ? '==' : '!=';
        filter = '(' + filter + ' && ' + 'sourceApplication.id ' + oper + ' "' + currentApp + '")';
    }
    return filter;
};

SailPoint.Analyze.Role.calcBPREntValueSuggestFilter = function(currentApp, currentAttr) {
    var filter = SailPoint.Analyze.Role.calcBPREntNameSuggestFilter(currentApp);
    if (currentAttr) {
        filter = '(' + filter + ' && ' + 'attribute == "' + currentAttr + '")';
    }
    return filter;
};

SailPoint.Analyze.Role.calcBPRPermNameSuggestFilter = function(currentApp) {
    var filter = 'type == "Permission"';
    if (currentApp) {
        var appOper = Ext.getDom('roleSearchForm:profileAppOper').value;
        var oper = (appOper == 'Equal') ? '==' : '!=';
        filter = '(' + filter + ' && ' + 'sourceApplication.id ' + oper + ' "' + currentApp + '")';
    }
    return filter;
};

SailPoint.Analyze.Role.calcBPRPermValueSuggestFilter = function(currentApp, currentAttr) {
    var filter = SailPoint.Analyze.Role.calcBPRPermNameSuggestFilter(currentApp);
    if (currentAttr) {
        filter = '(' + filter + ' && ' + 'attribute == "' + currentAttr + '")';
    }
    return filter;
};

SailPoint.Analyze.Role.roleAppChanged = function(suggest, newValue, oldValue, eOpts) {
    SailPoint.Role.Search.resetEntPermFields();
    SailPoint.Role.Search.initializeEntPermSuggests(newValue);
};

SailPoint.Analyze.Role.roleEntPermNameChanged = function(suggest, newValue, oldValue, eOpts) {
    var currentApp = Ext.getDom('roleSearchForm:roleProfileApp').value;
    SailPoint.Role.Search.resetEntPermValueFields();
    SailPoint.Role.Search.initializeEntPermValueSuggests(currentApp, newValue);
};

SailPoint.Analyze.Role.initializeAttributes = function() {
  var ownerSuggest = Ext.getCmp('roleAttributesOwnerSuggest');
  if (ownerSuggest) {
      ownerSuggest.destroy();
  }

  var ownerSuggestVal = Ext.getDom('roleSearchInitialOwnerVal').innerHTML;

  ownerSuggest = new SailPoint.IdentitySuggest({
      id: 'roleAttributesOwnerSuggest',
      renderTo: 'roleOwnerSuggestDiv',
      binding: 'roleOwner',
      nameLookup: ownerSuggestVal,
      valueField: 'name',
      baseParams: {context: 'Owner'},
      width: 200,
      listConfig : {width : 300}
  });

  if(null != ownerSuggestVal && ownerSuggestVal.trim() != ''){
    ownerSuggest.setRawValue(ownerSuggestVal.trim());
    SailPoint.Suggest.IconSupport.setIconDiv(ownerSuggest, 'userIcon');
  }
  
  var classificationSuggest = Ext.getCmp('roleClassificationSuggest');
  var classificationVal = Ext.getDom('roleClassificationSuggestVal').innerHTML;
  if (classificationSuggest) {
      classificationSuggest.destroy();
  }

  classificationSuggest = new SailPoint.ClassificationSuggest({
      id: 'roleClassificationSuggest',
      renderTo: 'roleClassificationSuggestDiv',
      binding: 'roleClassification',
      initialData: classificationVal,
      width: 200,
      listConfig : {width : 300},
      pageSize: 10,
      baseParams: {'sort': 'displayableName', 'dir': 'ASC'}
  });

    SailPoint.Analyze.Role.adjustProfileLocalitySubFields();
    SailPoint.Analyze.Role.adjustProfileTypeSubFields();

    var roleProfileAppVal = Ext.getDom('roleProfileAppSuggestVal').innerHTML;
    var roleProfileAppSuggest = Ext.getCmp('roleProfileAppSuggest');
    if (roleProfileAppSuggest) {
        roleProfileAppSuggest.destroy();
    }

    roleProfileAppSuggest = new SailPoint.AppSuggest({
        id: 'roleProfileAppSuggest',
        renderTo: 'roleProfileAppSuggestDiv',
        binding: 'roleProfileApp',
        formBinding: 'roleSearchForm',
        initialData: roleProfileAppVal,
        width: 200,
        displayField : 'name',
        valueField : 'id',
        listConfig : {width : 300},
        baseParams: {'sort': 'name', 'dir': 'ASC'}
    });
    roleProfileAppSuggest.on('change', SailPoint.Analyze.Role.roleAppChanged , this);

    SailPoint.Role.Search.initializeEntPermSuggests(null,null);

  /*For the clear Extended attributes to work on the identity Suggest, the Div must end in Suggest,
  The Input must end in the div (id + 'Input'), and id must end in the Div (Id + 'Cmp') */
  var cells = Ext.query(".searchIdentitySuggestCell");
  for (var cell in cells){
      var element=Ext.get(cells[cell]);
      if (element){
          var id = element.child('div').getAttribute('id');
          var identitySuggest = Ext.getCmp(id + 'Cmp');
          if (identitySuggest) {
              identitySuggest.destroy();
          }   
      
          identitySuggest = new SailPoint.IdentitySuggest({
              id: id  + 'Cmp',
              renderTo: id,
              binding: id + 'Input',
              valueField:'name',
              baseParams: {context: 'Owner'},
              width: 200,
              listConfig : {width : 300}
          });
      }
  }
    
  var dateFields = Ext.query('input.hiddenDateType');
  if(dateFields.length>0) {
      for(var i=0; i<dateFields.length; i++) {
    
          if(dateFields[i].value != 'None') {
              /** Trim "roleSearchForm:" **/
              var start = 15;
              var id = dateFields[i].id.substring(start, dateFields[i].id.indexOf('Type'));
              var checkBox = Ext.getDom(id+'Select');
              checkBox.checked = true;
              toggleDisplay(Ext.getDom(id+'Div'), !(checkBox.checked));
          }      
      }
  }

  var checkBox = Ext.getDom('roleStartDateSelect');
  if(Ext.getDom('roleSearchForm:roleStartDateType').value != 'None') {
      checkBox.checked = true;
  }
  toggleDisplay(Ext.getDom('roleStartDateDiv'), !(checkBox.checked));


  var checkBox2 = Ext.getDom('roleEndDateSelect');
  if(Ext.getDom('roleSearchForm:roleEndDateType').value != 'None') {
      checkBox2.checked = true;
  }
  toggleDisplay(Ext.getDom('roleEndDateDiv'), !(checkBox2.checked));

  SailPoint.Analyze.initializeSubmit('roleSearchForm', 'preRoleSearchBtn');    
};

SailPoint.Analyze.Role.finishRerender = function() {
  resizeTables('roleSearchForm');
  SailPoint.Analyze.Role.initializeAttributes();
};

SailPoint.Analyze.Role.renderDescription = function(value, p, r) {
    // Descriptions may contain HTML.  The default column renderer HTML encodes
    // values, which causes them to show up as the actual tags.  Just return the
    // value to disable HTML encoding.
    return value;
};

SailPoint.Role.Search.initializeEntPermSuggests = function(currentApp, currentAttr) {

    SailPoint.Role.Search.initializeEntPermNameSuggests(currentApp);
    SailPoint.Role.Search.initializeEntPermValueSuggests(currentApp, currentAttr);
};

SailPoint.Role.Search.initializeEntPermNameSuggests = function(currentApp) {
    var roleProfileEntAttrSuggest = Ext.getCmp('roleProfileEntAttrSuggest');
    var roleProfileEntAttrVal = Ext.getDom('roleProfileEntAttrSuggestVal').innerHTML;
    if (roleProfileEntAttrSuggest) {
        roleProfileEntAttrSuggest.destroy();
    }

    roleProfileEntAttrSuggest = new SailPoint.DistinctRestSuggest({
        id: 'roleProfileEntAttrSuggest',
        renderTo: 'roleProfileEntAttrSuggestDiv',
        binding: 'roleProfileEntAttr',
        value: roleProfileEntAttrVal,
        valueField: 'attribute',
        width: 200,
        freeText: true,
        extraParams: { filterString : SailPoint.Analyze.Role.calcBPREntNameSuggestFilter(currentApp)},
        className: 'BundleProfileRelation',
        column: 'attribute',
        suggestUrl: '/rest/analyze/roleSearchPanel/suggest',
        listConfig : {width : 300}
    });
    roleProfileEntAttrSuggest.on('change', SailPoint.Analyze.Role.roleEntPermNameChanged , this);

    var roleProfilePermTargetSuggest = Ext.getCmp('roleProfilePermTargetSuggest');
    var roleProfilePermTargetVal = Ext.getDom('roleProfilePermTargetSuggestVal').innerHTML;
    if (roleProfilePermTargetSuggest) {
        roleProfilePermTargetSuggest.destroy();
    }

    roleProfilePermTargetSuggest = new SailPoint.DistinctRestSuggest({
        id: 'roleProfilePermTargetSuggest',
        renderTo: 'roleProfilePermTargetSuggestDiv',
        binding: 'roleProfilePermTarget',
        value: roleProfilePermTargetVal,
        valueField: 'attribute',
        width: 200,
        freeText: true,
        extraParams: { filterString : SailPoint.Analyze.Role.calcBPRPermNameSuggestFilter(currentApp)},
        className: 'BundleProfileRelation',
        column: 'attribute',
        suggestUrl: '/rest/analyze/roleSearchPanel/suggest',
        listConfig : {width : 300}
    });
    roleProfilePermTargetSuggest.on('change', SailPoint.Analyze.Role.roleEntPermNameChanged , this);
};

SailPoint.Role.Search.initializeEntPermValueSuggests = function(currentApp, currentAttr) {

    var roleProfileEntValueSuggest = Ext.getCmp('roleProfileEntValueSuggest');
    var roleProfileEntValueVal = Ext.getDom('roleProfileEntValueSuggestVal').innerHTML;
    if (roleProfileEntValueSuggest) {
        roleProfileEntValueSuggest.destroy();
    }

    roleProfileEntValueSuggest = new SailPoint.DistinctRestSuggest({
        id: 'roleProfileEntValueSuggest',
        renderTo: 'roleProfileEntValueSuggestDiv',
        binding: 'roleProfileEntValue',
        value: roleProfileEntValueVal,
        valueField: 'value',
        width: 200,
        freeText: true,
        extraParams: { filterString : SailPoint.Analyze.Role.calcBPREntValueSuggestFilter(currentApp, currentAttr)},
        className: 'BundleProfileRelation',
        column: 'displayValue',
        suggestUrl: '/rest/analyze/roleSearchPanel/suggest',
        listConfig : {width : 300}
    });



    var roleProfilePermRightSuggest = Ext.getCmp('roleProfilePermRightSuggest');
    var roleProfilePermRightVal = Ext.getDom('roleProfilePermRightSuggestVal').innerHTML;
    if (roleProfilePermRightSuggest) {
        roleProfilePermRightSuggest.destroy();
    }

    roleProfilePermRightSuggest = new SailPoint.DistinctRestSuggest({
        id: 'roleProfilePermRightSuggest',
        renderTo: 'roleProfilePermRightSuggestDiv',
        binding: 'roleProfilePermRight',
        value: roleProfilePermRightVal,
        valueField: 'value',
        width: 200,
        freeText: true,
        extraParams: { filterString : SailPoint.Analyze.Role.calcBPRPermValueSuggestFilter(currentApp, currentAttr)},
        className: 'BundleProfileRelation',
        column: 'displayValue',
        suggestUrl: '/rest/analyze/roleSearchPanel/suggest',
        listConfig : {width : 300}
    });
};
