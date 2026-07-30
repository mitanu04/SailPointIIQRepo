/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Certification', 
       'SailPoint.Certification.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Certification');

SailPoint.Certification.Search.getCertificationSearchPanel = function(config) {
    var activeItem = 'certificationSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }

    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'certificationSearchContents',
        layout: 'fit',
        contentEl: 'certificationSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'advancedCertificationSearchNavBtn',
                text: '#{msgs.advanced_search}',
                scale : 'medium',
                handler: SailPoint.Certification.Search.displayAdvancedSearch,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preCertificationSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('certificationSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('certificationSearchForm', 'certification'); 
            }
        }, {
            id: 'certificationClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('certificationSearchForm:resetBtn').click();
                Ext.getDom('certificationSearchForm:certificationSearchGroupFilterResetBtn').click();
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/certification/certificationSearchContents.jsf'),
            params: { searchType: 'Certification' },
            discardUrl: false,
            callback: SailPoint.Certification.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var advancedSearchContents = Ext.create('Ext.panel.Panel', {
        id: 'advancedCertificationSearchContents',
        layout: 'fit',
        contentEl: 'advancedCertificationSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'certificationSearchNavBtn',
                text: '#{msgs.cert_search_btn}',
                scale : 'medium',
                handler: SailPoint.Certification.Search.displaySearchContents,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preAdvancedCertificationSearchBtn',
            text: '#{msgs.button_run_search}',
            cls: 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('certificationSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('advancedCertificationSearchForm', 'advancedCertification');
            }
        }, {
            id: 'advancedCertificationClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('advancedCertificationSearchForm:resetBtn').click()
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/advanced/advancedSearchContents.jsf'),
            params: {searchType: 'AdvancedCertification'},
            discardUrl: false,
            callback: SailPoint.Certification.Search.finishAdvancedSearchInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'certificationSearchResultsGrid',
        type: 'certification',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Certification'),
        url: SailPoint.getRelativeUrl('/analyze/certification/certificationDataSource.json'),
        handleClick: SailPoint.Certification.Search.handleClick,
        contextMenu: SailPoint.Certification.Search.contextMenu,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        sorters : [{ property: 'name', direction: 'ASC' }, {property: 'id', direction: 'ASC'}],
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Certification',
            cardPanelId: 'certificationSearchPanel',
            searchPanelId: 'certificationSearchContents',
            applySearchPanelStyles: SailPoint.Certification.Search.styleSearchPanels,
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });

    var advancedResultsContents = SailPoint.Search.getResultsGrid({
        id: 'advancedCertificationSearchResultsGrid',
        type: 'advancedCertification',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('AdvancedCertification'),
        url: SailPoint.getRelativeUrl('/analyze/certification/advancedCertificationDataSource.json'),
        handleClick: SailPoint.Certification.Search.handleClick,
        contextMenu: SailPoint.Certification.Search.contextMenu,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        sorters : [{ property: 'name', direction: 'ASC' }, {property: 'id', direction: 'ASC'}],
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'AdvancedCertification',
            cardPanelId: 'certificationSearchPanel',
            searchPanelId: 'advancedCertificationSearchContents',
            applySearchPanelStyles: function() {
                Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
                Ext.getCmp('advancedCertificationSearchContents').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });

    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Certification.Search.styleResultsGrid();
    });
    
    var searchPanel = Ext.create('Ext.panel.Panel', {
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, advancedSearchContents, resultsContents, advancedResultsContents]
    });
    
    searchPanel.on('activate', function(viewerPanel) {
        if (!searchPanel.isLoaded) {
            searchContents.getLoader().load();
            advancedSearchContents.getLoader().load();
            
            SailPoint.Certification.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.Certification.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('certificationSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('certificationSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // Ext.getDom('stateForm:searchType').value = 'Certification';
    // Ext.getDom('stateForm:currentCardPanel').value = 'certificationSearchResultsGrid';
    // Ext.getDom('stateForm:updatePanelStateBtn').click();
};

SailPoint.Certification.Search.displayAdvancedSearchResults = function() {
    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedCertificationSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('certificationSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Certification.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('certificationSearchContents');
    // We're not keeping track of the card panel anymore
    // Ext.getDom('stateForm:searchType').value = 'Certification';
    // Ext.getDom('stateForm:currentCardPanel').value = 'certificaitonSearchContents';
    // Ext.getDom('stateForm:updatePanelStateBtn').click();
};

SailPoint.Certification.Search.displayAdvancedSearch = function() {
    SailPoint.Search.clearForRefineSearch('advancedCertificationSearchResultsGrid');

    var searchPanel = Ext.getCmp('certificationSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedCertificationSearchContents');

    if (!searchPanel.hasDisplayFields) {
        SailPoint.Analyze.SearchDisplayFields.initDisplayFields('advancedCertification');
        searchPanel.hasDisplayFields = true;
    }
    Ext.getCmp('advancedCertificationDisplayFieldsPanel').doLayout();
    SailPoint.Utils.styleSelects();
};

SailPoint.Certification.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/certification/certificationDataSource.json'), 'certificationSearchResultsGrid', 13, true);
};

SailPoint.Certification.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('certificationSearchResultsGrid');
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

SailPoint.Certification.Search.finishInit = function() {
    SailPoint.Analyze.Certification.initializeAttributes();
    SailPoint.Analyze.Certification.renderTypeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('certification');
    SailPoint.Certification.Search.styleSearchPanels();
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: Ext.get('certificationSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'certificationSearchForm',
            searchType: 'Certification'
        }
    });
    Ext.getCmp('certificationSearchContents').doLayout();
    Ext.MessageBox.hide();
};

SailPoint.Certification.Search.finishAdvancedSearchInit = function() {
    advCertificationSearchFiltersPage = FiltersPage.instance('div.advCertificationSearchspTabledAjaxContent', 'advCertificationSearchfilterBeanListTbl', 'advancedCertificationSearchForm', 'advCertificationSearch');
    advCertificationSearchFiltersPage.initPage();
    buildTooltips(Ext.getDom('advancedCertificationAttributes'));
    buildTooltips(Ext.getDom('filterCriteria'));
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/certification/advancedCertificationDataSource.json'), 'advancedCertificationSearchResultsGrid', 13, true);
    Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
    Ext.getCmp('advancedCertificationSearchContents').doLayout();
};

SailPoint.Certification.Search.styleSearchPanels = function() {
    resizeTables('certificationSearchForm');
    buildTooltips(Ext.getDom('certificationSearchCriteria'));
    //SailPoint.Analyze.Certification.initializeAttributes();
    
    // When refining search after returning from a selected cert
    // the bottom bar is not displayed unless we sync the size and
    // layout the certificationSearchPanel.
    Ext.getCmp('certificationSearchPanel').doLayout();
    Ext.getCmp('certificationDisplayFieldsPanel').doLayout();
    
    // When refining search after returning from a selected cert
    // the tag filed is not displayed unless we sync the size and
    // layout the tag component.
    Ext.getCmp('tagsMultiSuggestCmp').doLayout();
};

SailPoint.Certification.Search.styleResultsPanels = function() {};

SailPoint.Certification.Search.clearSearchFields = function() {
    var formName = 'certificationSearchForm';
    var tagsSuggest = Ext.getCmp('tagsMultiSuggestCmp');
    if (tagsSuggest) {
        tagsSuggest.clear();
    }
    
    var esigSuggest = Ext.getCmp('certifierESignedSuggestCmp');
    if (esigSuggest) {
        esigSuggest.clearValue();
        Ext.getDom('certificationESigned').value = '';
    }

    Ext.getDom(formName + ':certificationESigned').value = '';
    Ext.getDom(formName + ':certificationStates').value = 'all';
    
    Ext.getDom(formName + ':certPhases').value = '';
    Ext.getDom(formName + ':certName').value = '';
    Ext.getDom(formName + ':certPercentComplete').value = 'GreaterThan';
    Ext.getDom(formName + ':percentComplete').value = '';
    
    Ext.getDom(formName + ':certificationStartDateType').value = 'None';
    Ext.getDom('certificationStartDateSelect').checked = false;
    toggleDisplay(Ext.getDom('certificationStartDateDiv'), true);

    Ext.getDom(formName + ':certificationEndDateType').value = 'None';
    Ext.getDom('certificationEndDateSelect').checked = false;
    toggleDisplay(Ext.getDom('certificationEndDateDiv'), true);
    
    SailPoint.Analyze.Certification.clearTypeAttributes();
    SailPoint.Analyze.Certification.clearCertifierAttributes();
    SailPoint.Analyze.Certification.clearMemberAttributes();
    SailPoint.Analyze.Certification.clearAccountGroupAttributes();
    SailPoint.Analyze.Certification.clearGroupSuggest();

    Ext.getDom(formName + ':certTypes').value = '';
    Ext.getDom(formName + ':certificationDates').value = 'created';

    SailPoint.Analyze.resetFieldsToDisplay('certification');
    SailPoint.Analyze.Certification.finishRerender();
};

SailPoint.Certification.Search.clearAdvancedCertificationSearchFields = function() {
    SailPoint.Analyze.resetFieldsToDisplay('advancedCertification');
    advCertificationSearchFiltersPage.clearSearchFields();
};

SailPoint.Certification.Search.contextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    var contextMenu = new Ext.menu.Menu();
    gIsCertification = true;

    var recordId = record.getId();
    var recordLimitReassign = record.get("limitReassignments");

    contextMenu.add(
            new Ext.menu.Item({
                text: '#{msgs.menu_view}',
                handler: SailPoint.Certification.Search.viewCertItem,
                certificationId : recordId,
                iconCls: 'viewDetailsBtn'
            })
    );

    var isCertStaged = (!Ext.isEmpty(record.data.isStaged) && record.data.isStaged) ? true : false;

    // Disable forwarding if this is a staged certfication or it's signed
    // or there is more than one certifier.
    var disableForward = record.data.numCertifiers > 1 || 
        !Ext.isEmpty(record.data.signed) ||
        isCertStaged;

    if (!disableForward) {
        contextMenu.add(
                new Ext.menu.Item({
                    text: '#{msgs.menu_forward}', 
                    handler: SailPoint.Certification.Search.forwardFromMenu,
                    iconCls: 'forwardBtn',
                    certificationId : recordId,
                    limitReassign : recordLimitReassign
                })
        );
    }

    e.stopEvent();
    contextMenu.showAt(e.xy);
}; 

SailPoint.Certification.Search.viewCertItem = function(item, e) {
    Ext.getDom('certificationResultForm:searchType').value = 'Certification';
    Ext.getDom('certificationResultForm:currentObjectId').value = item.certificationId;
    Ext.getDom('certificationResultForm:editButton').click();
};
  
SailPoint.Certification.Search.forwardFromMenu = function(item, e) {
    forwardCertificationWorkItem(item.certificationId, 'certificationSearchResults', item.limitReassign);
};
  
SailPoint.Certification.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts){
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if(colName) {
        SailPoint.Analyze.captureGridState('Certification', 'certificationResultForm');
        
        Ext.getDom('certificationResultForm:searchType').value = 'Certification';
        Ext.getDom('certificationResultForm:currentObjectId').value = record.getId();
        Ext.getDom('certificationResultForm:editButton').click();
    }
};


/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/

SailPoint.Analyze.Certification.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if(Ext.getDom('certificationStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':certificationStartDate', '');
  }
  if(Ext.getDom('certificationEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':certificationEndDate', '');
  }
  
  if(Ext.getDom('certificationStartDateSelect').checked && Ext.getDom('certificationEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':certificationStartDate', formName+':certificationEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
}

SailPoint.Analyze.Certification.initializeAttributes = function() {
  var formName = 'certificationSearchForm';
  var certifierVal = null;
  if(Ext.get('certifierVal') && Ext.getDom('certifierVal').innerHTML){
      certifierVal = Ext.getDom('certifierVal').innerHTML;
  }
  var memberVal = null;
      if(Ext.get('memberVal') && Ext.getDom('memberVal').innerHTML){
      memberVal = Ext.getDom('memberVal').innerHTML;
  }
  
  // Destroying the suggests is not the most efficient way to do things, but thanks
  // to the magic of a4j the DOM has potentially been pulled out from under them.
  // It's best to just put them out of their misery at that point because they 
  // are no longer reusable.
  var certifierSuggest = Ext.getCmp('certifierSuggestCmp');
  if (certifierSuggest) {
      certifierSuggest.destroy();
  }
  
  certifierSuggest = new SailPoint.IdentitySuggest({
    id: 'certifierSuggestCmp',
    renderTo: 'certifierSuggest',
    binding: 'certifier',
    valueField: 'name',
    baseParams: {context: 'Owner'},
    width: 200,
    listConfig : {width : 300}
  });
  
  if (null != certifierVal && certifierVal != ""){
      certifierSuggest.loadValueByName(certifierVal);      
  }

  var memberSuggest = Ext.getCmp('memberSuggestCmp');
  if (memberSuggest) {
      memberSuggest.destroy();
  }
  memberSuggest = new SailPoint.IdentitySuggest({
    id: 'memberSuggestCmp',
    renderTo: 'memberSuggest',
    binding: 'member',
    baseParams: {context: 'Global'},
    width: 200,
    listConfig : {width : 300}
  });
  
  if (null != memberVal && memberVal != ""){
      memberSuggest.loadValueByNameAndContext({
          nameOfIdentity: memberVal,
          context: 'Global'
      });
  }
  
  // Only initialize the suggest if it was rendered
  if (Ext.getDom('tagsMultiSuggest')) {
      var tagsMultiSuggest = Ext.getCmp('tagsMultiSuggestCmp');
      if (tagsMultiSuggest) {
          tagsMultiSuggest.destroy();
      }

      tagsMultiSuggest = new SailPoint.MultiSuggest({
          id: 'tagsMultiSuggestCmp',
          renderTo: 'tagsMultiSuggest',
          suggestType: 'tag',
          jsonData: JSON.parse(Ext.getDom('tagsMultiSuggestData').innerHTML),
          width: 300,
          inputFieldName: 'tagsSuggest'
      });
  }

    SailPoint.Analyze.Certification.loadGroupSuggest();
  
  var checkBox = Ext.getDom('certificationStartDateSelect');
  if(Ext.getDom(formName + ':certificationStartDateType').value != 'None') {
    checkBox.checked = true;
  }
  toggleDisplay(Ext.getDom('certificationStartDateDiv'), !(checkBox.checked));
  
  
  var checkBox2 = Ext.getDom('certificationEndDateSelect');
  if(Ext.getDom(formName + ':certificationEndDateType').value != 'None') {
    checkBox2.checked = true;
  }
  toggleDisplay(Ext.getDom('certificationEndDateDiv'), !(checkBox2.checked));
  
  SailPoint.Analyze.initializeSubmit(formName, 'preCertificationSearchBtn');
};

SailPoint.Analyze.Certification.finishRerender = function() {
    resizeTables('certificationSearchForm');
    SailPoint.Analyze.Certification.initializeAttributes();
    if(!Ext.isIE) {
        SailPoint.Utils.initStyledSelects();
    }
};

SailPoint.Analyze.Certification.renderTypeAttributes = function() {
    var value = Ext.getDom('certificationSearchForm:certTypes').value;
  
    if(value == 'Manager') {
        SailPoint.Analyze.Certification.initializeManagerAttributes();
    } else if(value == 'BusinessRoleMembership' || value=='BusinessRoleComposition') {
        SailPoint.Analyze.Certification.initializeRoleAttributes();
    } else if(value == 'AccountGroupPermissions' || value=='AccountGroupMembership') {
        SailPoint.Analyze.Certification.initializeAccountGroupAttributes();
    } else if(value == 'ApplicationOwner' || value=='DataOwner') {
        SailPoint.Analyze.Certification.initializeApplicationAttributes();
    }
    
    SailPoint.Analyze.Certification.initializeESignedSuggest();
};

SailPoint.Analyze.Certification.clearTypeAttributes = function() {
    var value = Ext.getDom('certificationSearchForm:certTypes').value;

    if(value == "Manager") {
        SailPoint.Analyze.Certification.clearManagerAttributes();
    } else if(value == "BusinessRoleMembership" || value=="BusinessRoleComposition") {
        SailPoint.Analyze.Certification.clearRoleAttributes();
    } else if(value == "AccountGroupPermissions" || value=="AccountGroupMembership") {
        SailPoint.Analyze.Certification.clearAccountGroupAttributes();
    } else if(value == "ApplicationOwner") {
        SailPoint.Analyze.Certification.clearApplicationAttributes();
    }
    Ext.get("certificationSearchForm:searchTypePanel").setVisibilityMode(Ext.Element.DISPLAY).hide();
};

SailPoint.Analyze.Certification.initializeManagerAttributes = function() {
  if (Ext.getDom('certificationManagerSuggest')) {
      var managerSuggest = Ext.getCmp('certifierManagerSuggestCmp');
      
      if (managerSuggest) {
          managerSuggest.destroy();
      }
        
      managerSuggest = new SailPoint.IdentitySuggest({
          id: 'certifierManagerSuggestCmp',
          renderTo: 'certificationManagerSuggest',
          binding: 'certificationManager', 
          width: 200,
          listConfig : {width : 300},
          valueField: 'name',
          rawValue: Ext.getDom('certificationManager').value,
          baseParams: {context: 'Manager'}
      });
  }
};

SailPoint.Analyze.Certification.initializeESignedSuggest = function() {
    
    if (Ext.fly('certificationESignedSuggest')) {
        
        var managerSuggest = Ext.getCmp('certifierESignedSuggestCmp');
        if (managerSuggest) {
            managerSuggest.destroy();
        }

        managerSuggest = new SailPoint.IdentitySuggest({
            id : 'certifierESignedSuggestCmp',
            renderTo : 'certificationESignedSuggest',
            binding : 'certificationESigned',
            width : 200,
            listConfig : {width : 300},
            rawValue : Ext.fly('certificationESigned').value,
            baseParams : {
                context : 'Global'
            }
        });
    }
};

SailPoint.Analyze.Certification.clearManagerAttributes = function() {
    var managerSuggest = Ext.getCmp('certifierManagerSuggestCmp');
    
    if (managerSuggest) {
        managerSuggest.clearValue();
        Ext.getDom('certificationManager').value = '';
    }
};

SailPoint.Analyze.Certification.clearCertifierAttributes = function() {
    var certifierSuggest = Ext.getCmp('certifierSuggestCmp');

    if (certifierSuggest) {
        certifierSuggest.clearValue();
        Ext.getDom('certifier').value = '';

        var certifierVal = Ext.get('certifierVal')
        if(certifierVal){
            certifierVal.destroy();
        }
    }
};

SailPoint.Analyze.Certification.clearMemberAttributes = function() {
    var memberSuggest = Ext.getCmp('memberSuggestCmp');

    if (memberSuggest) {
        memberSuggest.clearValue();
        Ext.getDom('member').value = '';

        var memberVal = Ext.get('memberVal')
        if(memberVal){
            memberVal.destroy();
        }
    } 
};

SailPoint.Analyze.Certification.initializeRoleAttributes = function() {
    if (Ext.getDom('certificationRoleSuggest')) {
        var roleSuggest = Ext.getCmp('certifierRoleSuggest');
        
        if (roleSuggest) {
            roleSuggest.destroy();
        }
        
        roleSuggest = new SailPoint.BaseSuggest({
          id: 'certifierRoleSuggest',
          pageSize: 10,
          baseParams: {'suggestType': 'role'},
          renderTo: 'certificationRoleSuggest',
          binding: 'certificationRole',
          value: Ext.getDom('certificationRoleName').value,
          width: 200,
          listConfig : {width : 300}
        });           
    }
};

SailPoint.Analyze.Certification.clearRoleAttributes = function() {
    var roleSuggest = Ext.getCmp('certifierRoleSuggest');
    
    if (roleSuggest) {
        roleSuggest.clearValue();
        Ext.getDom('certificationRole').value = '';
    }
};


SailPoint.Analyze.Certification.initializeApplicationAttributes = function() {
    if (Ext.get('certificationApplicationSuggest')) {
        var applicationSuggest = Ext.getCmp('certifierApplicationSuggestCmp');
        if (applicationSuggest) {
            applicationSuggest.destroy();
        }
        
        applicationSuggest = new SailPoint.BaseSuggest({
            id: 'certifierApplicationSuggestCmp',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            renderTo: 'certificationApplicationSuggest',
            binding: 'certificationApplication',
            value: Ext.getDom('certificationApplicationName').value,
            width: 200,
            listConfig : {width : 300}
        });
    }
};

SailPoint.Analyze.Certification.clearApplicationAttributes = function() {
    var applicationSuggest = Ext.getCmp('certifierApplicationSuggest');
    if (applicationSuggest) {
        applicationSuggest.clearValue();
        Ext.getDom('application').value = '';
    }
};

SailPoint.Analyze.Certification.initializeAccountGroupAttributes = function() {
    if (Ext.getDom('certificationAccountGroupSuggest')) {
        var acctGrpSuggest = Ext.getCmp('certifierAccountGroupSuggest');
        if (acctGrpSuggest) {
            acctGrpSuggest.destroy();
        }
        
        acctGrpSuggest = new SailPoint.BaseSuggest({
            id: 'certifierAccountGroupSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'accountGroup'},
            renderTo: 'certificationAccountGroupSuggest',
            binding: 'certificationAccountGroup',
            value: Ext.getDom('certificationAccountGroup').value,
            valueField: 'displayName',
            width: 200,
            listConfig : {width : 300}
        });       
    }
  
    if (Ext.getDom('certificationAccountGroupApplicationSuggest')) {
        var acctGrpAppSuggest = Ext.getCmp('certifierAccountApplicationGroupSuggest');
        
        if (acctGrpAppSuggest) {
            acctGrpAppSuggest.destroy();
        }
        
        acctGrpAppSuggest = new SailPoint.BaseSuggest({
            id: 'certifierAccountApplicationGroupSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            renderTo: 'certificationAccountGroupApplicationSuggest',
            binding: 'certificationAccountGroupApplication',
            value: Ext.getDom('certificationAccountGroupAppName').value,
            width: 200,
            listConfig : {width : 300}
        });
    }
};

SailPoint.Analyze.Certification.clearAccountGroupAttributes = function() {
    var acctGrpSuggest = Ext.getCmp('certifierAccountGroupSuggest');
    var acctGrpAppSuggest = Ext.getCmp('certifierAccountApplicationGroupSuggest');
    if (acctGrpSuggest) {
        acctGrpSuggest.clearValue();
        Ext.getDom('accountGroup').value = '';
    }
    
  
    if (acctGrpAppSuggest) {
        acctGrpAppSuggest.clearValue();
        Ext.getDom('accountGroupApplication').value = '';
    }
};

SailPoint.Analyze.Certification.createGroupSuggest = function(filterID, factory){
    return new SailPoint.GroupSuggest({
        id: 'groupSuggestCmp_' + filterID,
        renderTo: 'certifierGroupSuggest_' + filterID,
        url : SailPoint.getRelativeUrl('/include/groupValuesQuery.json'),
        root: 'groupValues',
        displayField : 'displayableValue',
        storeId: 'certifierGroupSuggest_' + filterID + '_store',
        model: 'SailPoint.model.GroupSuggest',
        extraParams: {
            suggestType: 'group',
            group: factory
        },
        width: 200,
        listConfig : {width : 300},
        listeners : {
            select : function() {
                // setting the value and rawValue here on select...
                Ext.getDom('groupDefinitionInput_' + filterID).firstChild.value = this.getValue();
                Ext.getDom('groupDefinitionInputName_' + filterID).firstChild.value = this.getRawValue();
            }
        }
    });
};

SailPoint.Analyze.Certification.clearGroupSuggest = function() {
    $("[id^='certifierGroupSuggest_']").each(function() {
        var filterId = $(this).attr("id").split("_")[1];
        var groupSuggest = Ext.getCmp('groupSuggestCmp_'+filterId);
        groupSuggest.store.removeAll();
        groupSuggest.setRawValue('');
        Ext.getDom('groupDefinitionInput_'+ filterId).firstChild.value = '';
    });
};

SailPoint.Analyze.Certification.loadGroupSuggest = function(){
    $("[id^='certifierGroupSuggest_']").each(function(){
        var filterID = $(this).attr("id").split("_")[1];
        var factory = Ext.getDom("filterFactory_" + filterID).firstChild.value;
        var newGroupSuggest;
        if(Ext.getCmp('groupSuggestCmp_'+filterID)) {
            var previousSelectedValue = Ext.getCmp('groupSuggestCmp_'+filterID).getRawValue();
            newGroupSuggest = SailPoint.Analyze.Certification.createGroupSuggest(filterID, factory);
            newGroupSuggest.setRawValue(previousSelectedValue);
        } else if (Ext.getDom('groupDefinitionInputName_' + filterID)) {
            // We have some history here...
            var inputNameValue = Ext.getDom('groupDefinitionInputName_' + filterID).firstChild.value;
            newGroupSuggest = SailPoint.Analyze.Certification.createGroupSuggest(filterID, factory);
            newGroupSuggest.setRawValue(inputNameValue);
        } else {
            // create a new, blank suggest
            newGroupSuggest = SailPoint.Analyze.Certification.createGroupSuggest(filterID, factory);
        }
        return newGroupSuggest;
    });
};
