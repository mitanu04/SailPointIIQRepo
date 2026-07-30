/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Link', 
       'SailPoint.Link.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Link');

SailPoint.Link.Search.getLinkSearchPanel = function(config) {
    var activeItem = 'linkSearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }

    var searchContents = Ext.create('SailPoint.TabContentPanel', {
        id: 'linkSearchContents',
        layout: 'fit',
        contentEl: 'linkSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'advancedLinkSearchNavBtn',
                text: '#{msgs.advanced_search}',
                scale : 'medium',
                handler: SailPoint.Link.Search.displayAdvancedSearch,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preLinkSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('linkSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('linkSearchForm', 'link'); 
            }
        }, {
            id: 'linkClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('linkSearchForm:resetBtn').click();
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/link/linkSearchContents.jsf'),
            params: { searchType: 'Link' },
            discardUrl: false,
            callback: SailPoint.Link.Search.finishInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var advancedSearchContents = Ext.create('Ext.panel.Panel', {
        id: 'advancedLinkSearchContents',
        layout: 'fit',
        contentEl: 'advancedLinkSearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'advancedSearchToolbar',
            items: [{
                id: 'linkSearchNavBtn',
                text: '#{msgs.link_search}',
                scale : 'medium',
                handler: SailPoint.Link.Search.displaySearchContents,
                cls: 'x-btn-text-icon'
            }]
        }],
        bbar: [{
            id: 'preAdvancedLinkSearchBtn',
            text: '#{msgs.button_run_search}',
            cls: 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('linkSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('advancedLinkSearchForm',
                    'advancedLink');
            }
        }, {
            id: 'advancedLinkClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('advancedLinkSearchForm:resetBtn').click();
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/advanced/advancedSearchContents.jsf'),
            params: {searchType: 'AdvancedLink'},
            discardUrl: false,
            callback: SailPoint.Link.Search.finishAdvancedSearchInit,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'linkSearchResultsGrid',
        type: 'Link',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('Link'),        
        url: SailPoint.getRelativeUrl('/analyze/link/linkDataSource.json'),
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Link',
            cardPanelId: 'linkSearchPanel',
            searchPanelId: 'linkSearchContents',
            applySearchPanelStyles: SailPoint.Link.Search.styleSearchPanels,
            options: [
                      ['saveOrUpdate', '#{msgs.save_search}'],
                      ['saveAsReport', '#{msgs.save_search_as_report}']
                  ]
        })
    });

    var advancedResultsContents = SailPoint.Search.getResultsGrid({
        id: 'advancedLinkSearchResultsGrid',
        type: 'advancedLink',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('AdvancedLink'),
        url: SailPoint.getRelativeUrl('/analyze/link/advancedLinkDataSource.json'),
        handleClick: SailPoint.Link.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        sorters : [{ property: 'name', direction: 'ASC' }, {property: 'id', direction: 'ASC'}],
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'AdvancedLink',
            cardPanelId: 'linkSearchPanel',
            searchPanelId: 'advancedLinkSearchContents',
            applySearchPanelStyles: function() {
                Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
                Ext.getCmp('advancedLinkSearchContents').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });


    resultsContents.on('afterlayout', function(contentPanel, layout) {
        SailPoint.Link.Search.styleResultsGrid();
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

            SailPoint.Link.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });

    return searchPanel;
};

/**
 * Initialize account tab page
 */
SailPoint.Link.Search.finishInit = function() {
    SailPoint.Analyze.Link.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('link');

    SailPoint.Link.Search.styleSearchPanels();

    buildTooltips(Ext.getDom('linkSearchCriteria'));

    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: Ext.getDom('linkSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'linkSearchForm',
            searchType: 'Link'
        }
    });

    Ext.MessageBox.hide();
};

SailPoint.Link.Search.finishAdvancedSearchInit = function() {
    // required implicit global declaration. used in addFilters.xhtml.
    advLinkSearchFiltersPage = FiltersPage.instance('div.advLinkSearchspTabledAjaxContent',
        'advLinkSearchfilterBeanListTbl', 'advancedLinkSearchForm', 'advLinkSearch');
    advLinkSearchFiltersPage.initPage();
    buildTooltips(Ext.getDom('advancedLinkAttributes'));
    buildTooltips(Ext.getDom('filterCriteria'));
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/link/advancedLinkDataSource.json'),
        'advancedLinkSearchResultsGrid', 13, true);
    Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
    Ext.getCmp('advancedLinkSearchContents').doLayout();
};

SailPoint.Link.Search.handleClick = function(gridView, record) {
    var col = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if (col) {
        Ext.getDom('linkSearchForm:currentObjectId').value = record.getId();
        Ext.getDom('linkSearchForm:editButton').click();
    }
};

SailPoint.Link.Search.styleSearchPanels = function() {
    resizeTables('linkSearchForm');
    Ext.getCmp('linkSearchContents').doLayout();
    Ext.getCmp('linkDisplayFieldsPanel').doLayout();
};

SailPoint.Link.Search.styleResultsPanels = function() {};

SailPoint.Link.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('linkSearchResultsGrid');
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

SailPoint.Link.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/link/linkDataSource.json'), 'linkSearchResultsGrid', 13, true);
};

/**
 * Initialize account tab search criteria attributes
 */
SailPoint.Analyze.Link.initializeAttributes = function() {
    var linkApplicationSuggest = Ext.getCmp('linkApplicationSuggestCmp');
    var linkApplicationVal = Ext.getDom('linkApplicationVal').innerHTML;

    if (linkApplicationSuggest) {
        linkApplicationSuggest.destroy();
    }  
    linkApplicationSuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkApplicationSuggestCmp',
      renderTo: 'linkApplicationSuggest',
      binding: 'linkApplication',
      value: linkApplicationVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Application',
      column: 'name',
      suggestUrl: '/rest/analyze/linkSearchPanel/suggest',
      listConfig : {width : 300}
    });

    var linkOwnerSuggest = Ext.getCmp('linkOwnerSuggestCmp');
    var linkOwnerVal = Ext.getDom('linkOwnerVal').innerHTML;
    
    if (linkOwnerSuggest) {
        linkOwnerSuggest.destroy();
    }  
    linkOwnerSuggest = new SailPoint.IdentitySuggest({
      id: 'linkOwnerSuggestCmp',
      renderTo: 'linkOwnerSuggest',
      binding: 'linkOwner',
      value: linkOwnerVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Identity',
      column: 'name',
      suggestUrl: '/rest/analyze/linkSearchPanel/suggest',
      listConfig : {width : 300}
    });

    var linkIdentitySuggest = Ext.getCmp('linkIdentitySuggestCmp');
    var linkIdentityVal = Ext.getDom('linkIdentityVal').innerHTML;

    if (linkIdentitySuggest) {
        linkIdentitySuggest.destroy();
    }
    linkIdentitySuggest = new SailPoint.IdentitySuggest({
        id: 'linkIdentitySuggestCmp',
        renderTo: 'linkIdentitySuggest',
        binding: 'linkIdentity',
        value: linkIdentityVal,
        valueField: 'name',
        width: 200,
        freeText: true,
        suggestUrl: '/rest/analyze/linkSearchPanel/suggest',
        listConfig : {width : 300}
    });

    var linkNativeIdentitySuggest = Ext.getCmp('linkNativeIdentitySuggestCmp');
    var linkNativeIdentityVal = Ext.getDom('linkNativeIdentityVal').innerHTML;
    
    if (linkNativeIdentitySuggest) {
        linkNativeIdentitySuggest.destroy();
    }  
    linkNativeIdentitySuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkNativeIdentitySuggestCmp',
      renderTo: 'linkNativeIdentitySuggest',
      binding: 'linkNativeIdentity',
      value: linkNativeIdentityVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Link',
      column: 'nativeIdentity',
      suggestUrl: '/rest/analyze/linkSearchPanel/suggest',
      listConfig : {width : 300}
    });

    var linkInstanceSuggest = Ext.getCmp('linkInstanceSuggestCmp');
    var linkInstanceVal = Ext.getDom('linkInstanceVal').innerHTML;
    
    if (linkInstanceSuggest) {
        linkInstanceSuggest.destroy();
    }  
    linkInstanceSuggest = new SailPoint.DistinctRestSuggest({
      id: 'linkInstanceSuggestCmp',
      renderTo: 'linkInstanceSuggest',
      binding: 'linkInstance',
      value: linkInstanceVal,
      valueField: 'displayName',
      width: 200,
      freeText: true,
      className: 'Link',
      column: 'instance',
      suggestUrl: '/rest/analyze/linkSearchPanel/suggest',
      listConfig : {width : 300}
    });

    SailPoint.Analyze.initializeSubmit('linkSearchForm', 'preLinkSearchBtn');
};

SailPoint.Link.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('linkSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('linkSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
    // We're not keeping track of the card panel anymore
    // Ext.getDom('stateForm:searchType').value = 'Link';
    // Ext.getDom('stateForm:currentCardPanel').value = 'linkSearchResultsGrid';
    // Ext.getDom('stateForm:updatePanelStateBtn').click();
};

SailPoint.Link.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('linkSearchContents');
};

SailPoint.Link.Search.displayAdvancedSearch = function() {
    SailPoint.Search.clearForRefineSearch('advancedLinkSearchResultsGrid');

    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedLinkSearchContents');

    if (!searchPanel.hasDisplayFields) {
        SailPoint.Analyze.SearchDisplayFields.initDisplayFields('advancedLink');
        searchPanel.hasDisplayFields = true;
    }
    Ext.getCmp('advancedLinkDisplayFieldsPanel').doLayout();
    SailPoint.Utils.styleSelects();
};

SailPoint.Link.Search.clearAdvancedLinkSearchFields = function() {
    SailPoint.Analyze.resetFieldsToDisplay('advancedLink');
    advLinkSearchFiltersPage.clearSearchFields();
};

SailPoint.Link.Search.displayAdvancedSearchResults = function() {
    var searchPanel = Ext.getCmp('linkSearchPanel');
    searchPanel.getLayout().setActiveItem('advancedLinkSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        Ext.getCmp('linkSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

/**
 * Clear search criteria fields
 */
SailPoint.Link.Search.clearSearchFields = function() {
    var formName = 'linkSearchForm';

    SailPoint.Analyze.clearExtendedAttributeFields('linkAttributes');

    var linkApplicationSuggest = Ext.getCmp('linkApplicationSuggestCmp');
    if (linkApplicationSuggest) {
        linkApplicationSuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('linkApplication');

    Ext.getDom('linkSearchForm:linkDisplayName').value = '';

    var linkOwnerSuggest = Ext.getCmp('linkOwnerSuggestCmp');
    if (linkOwnerSuggest) {
        linkOwnerSuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('linkOwner');
    
    var linkNativeIdentitySuggest = Ext.getCmp('linkNativeIdentitySuggestCmp');
    if (linkNativeIdentitySuggest) {
        linkNativeIdentitySuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('linkNativeIdentity');
    
    var linkInstanceSuggest = Ext.getCmp('linkInstanceSuggestCmp');
    if (linkInstanceSuggest) {
        linkInstanceSuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('linkInstance');

    Ext.getDom(formName + ':iiqDisabled').value = '';
    Ext.getDom(formName + ':iiqLocked').value = '';

    SailPoint.Analyze.resetFieldsToDisplay('link');
    SailPoint.Analyze.Link.finishRerender();
};

SailPoint.Analyze.Link.finishRerender = function() {
    resizeTables('linkSearchForm');
    SailPoint.Analyze.Link.initializeAttributes();
};
