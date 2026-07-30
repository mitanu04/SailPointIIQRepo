/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */
/*
* This initially began life in order to abstract logic for select iPops
* for Role Mining panels. See IIQSR-608 for the reasons we got here. While
* it could benefit from additional refactoring by bringing other child
* members up, that's beyond the scope of the initial work.
*
* Child members are expected to implement the method: 'afterPopulationUpdate()'
*/
Ext.ns('SailPoint', 'SailPoint.Role', 'SailPoint.Role.Mining');

Ext.define('SailPoint.Role.BaseRoleMiningPanel', {
    extend: 'Ext.panel.Panel',
    
    initMiningIpopSelector: function(ipopPanelInfo) {
        var ipopNameInput = Ext.DomQuery.selectNode('option[selected=selected]', Ext.getDom(ipopPanelInfo.ipopSelectId));
        var ipopVal;
        
        if (ipopNameInput) {
            ipopVal = Ext.getDom(ipopNameInput).value;
        }

        if (ipopVal && ipopVal != '') {
            this.updateIpopDescription(ipopVal, ipopPanelInfo);
        }

    },

    updateIpopDescription: function(currentIpopInfo, ipopPanelInfo) {
        var descriptionDiv = Ext.get(ipopPanelInfo.ipopDescriptionDivId);
        var sizeDiv = Ext.get(ipopPanelInfo.ipopSizeDivId);
        var appsDiv = Ext.get(ipopPanelInfo.ipopAppsDivId);
        var description = ''
        var size = ''
        var apps = ''

        Ext.define('RecordType', {
            extend: 'Ext.data.Model',
            fields: [{name:'id', type:'string'},{name:'name', type:'string'},{name:'displayField', type:'string'}]
        });

        if (currentIpopInfo) {
            description = Ext.String.htmlEncode(currentIpopInfo.description);
            size = currentIpopInfo.numIpopMembers;
            apps = SailPoint.Role.EntitlementsAnalysis.APPS_TEMPLATE.apply(currentIpopInfo);
            
        }

        if (description === null) {
            description = '';
        }

        descriptionDiv.update(description);
        sizeDiv.update(size);
        appsDiv.update(apps);
        this.afterPopulationUpdate(currentIpopInfo);
    },

    afterPopulationUpdate: function(currentIpopInfo) {
        // NO-OP method that implementers should overwrite.
    },

    updateIpopAppsAndDescription: function(ipop, ipopInfoObj) {
        if (ipop) {
            Ext.Ajax.request({
                url: SailPoint.getRelativeUrl('/ui/rest/groupdefinition/' + ipop),
                success: function (result, options) {
                    var currentIpopInfo = Ext.JSON.decode(result.responseText).object;
                    this.updateIpopDescription(currentIpopInfo, options.ipopPanelInfo);
                },
                scope: this,
                ipopPanelInfo: ipopInfoObj
            });
        } else {
            this.updateIpopDescription(null, ipopInfoObj);
        }
    }
});
