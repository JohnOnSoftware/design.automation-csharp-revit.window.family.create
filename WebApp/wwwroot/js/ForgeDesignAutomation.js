$(document).ready(function () {
    prepareLists();

    $('#clearAccount').click(clearAccount);
    $('#defineActivityShow').click(defineActivityModal);
    $('#createAppBundleActivity').click(createAppBundleActivity);
    $('#startWorkitem').click(startWorkitem);



    $('#createNewType').click(createNewType);
    $('#typeNameId').focusout(typeNameIdFocusOut);
    refreshTypeList();


    startConnection();
});


const WindowType = {
    DOUBLEHUNG: 1,
    FIXED: 2,
    SLIDINGDOUBLE: 3
};


const FamileyType = {
    WINDOW: 1,
    DOOR: 2,
}

// Manage the multiple family types
class FamilyTypes {
    constructor() {
        this.typeList = new Array();
        this.typeList.push({
            TypeName: 'NewType',
            WindowHeight: 4,
            WindowWidth: 2,
            WindowInset: 0.05,
            WindowSillHeight: 3,
        });
        this.typeIndex = 0;
    };

    getCurrentIndex() {
        return this.typeIndex;
    };

    setCurrentIndex(index) {
        if (index >= this.typeList.length || index < 0) {
            console.log("the input index is not correct.");
            return;
        }
        this.typeIndex = index;
    };

    getCurrentType() {
        return this.typeList[this.typeIndex];
    };

    setCurrentType(data) {
        // Add more check here
        if (data === null) {
            console.log("the input data is not valid.");
            return;
        }
        this.typeList[this.typeIndex] = data;
    }


    addNewType() {
        this.typeList.push({
            TypeName: 'NewType',
            WindowHeight: 4,
            WindowWidth: 2,
            WindowInset: 0.05,
            WindowSillHeight: 3,
        });

        this.typeIndex = this.typeList.length - 1;
    }

    removeType(index) {
        if (index >= this.typeList.length || index < 0) {
            console.log("the input index is not correct.");
            return;
        }

        this.typeList.splice(index, 1);
        this.typeIndex = 0;
    }

    getTypeByIndex(index) {
        if (index >= this.typeList.length || index < 0) {
            console.log("the input index is not correct.");
            return null;
        }
        return this.typeList[index];
    }


    getAllTypes() {
        return this.typeList;
    }
}


var familyTypes = new FamilyTypes();

function prepareLists() {
    list('activity', '/api/forge/designautomation/activities');
    list('engines', '/api/forge/designautomation/engines');
    list('localBundles', '/api/appbundles');
}


async function createNewType() {
    // Save the params first
    saveCurrentParams();

    familyTypes.addNewType();
    refreshTypeList();

}

function typeNameIdFocusOut() {
    // Save the params first
    saveCurrentParams();
    refreshTypeList();
}


function saveCurrentParams() {
    const typeName = ($('#typeNameId').val() === "") ? "New Type" : $('#typeNameId').val();
    const windowHeight = ($('#windowHeightId').val() === "") ? 4 : $('#windowHeightId').val();
    const windowWidth = ($('#windowWidthId').val() === "") ? 2 : $('#windowWidthId').val();
    const windowInset = ($('#windowInsetId').val() === "") ? 0.05 : $('#windowInsetId').val();
    const windowSillHeight = ($('#windowSillHeightId').val() === "") ? 3 : $('#windowSillHeightId').val();

    const familyParams = {
        TypeName: typeName,
        WindowHeight: windowHeight,
        WindowWidth: windowWidth,
        WindowInset: windowInset,
        WindowSillHeight: windowSillHeight,
    }

    familyTypes.setCurrentType(familyParams);
}

function refreshFamilyParams(data) {
    if (data === null)
        return;

    $('#typeNameId')[0].value = data.TypeName;
    $('#windowHeightId')[0].value = data.WindowHeight;
    $('#windowWidthId')[0].value = data.WindowWidth;
    $('#windowInsetId')[0].value = data.WindowInset;
    $('#windowSillHeightId')[0].value = data.WindowSillHeight;
}


function refreshTypeList() {
    let familyTypesList = document.getElementById('familyTypes');
    let index = familyTypesList.childElementCount;
    while (index > 0) {
        familyTypesList.removeChild(familyTypesList.firstElementChild);
        index--;
    }

    const types = familyTypes.getAllTypes();
    let id = 0;
    types.forEach((item) => {
        let li = document.createElement('li')
        li.setAttribute('class', 'list-group-item');
        li.setAttribute('id', id.toString());
        li.textContent = item.TypeName;
        li.onclick = (e) => {
            if (e.target.tagName === "SPAN") {
                return;
            }
            // Save the current params
            saveCurrentParams();

            // Remove previous focus 
            let familyTypesList = document.getElementById('familyTypes');
            familyTypesList.children[familyTypes.getCurrentIndex()].setAttribute("class", "list-group-item");

            familyTypes.setCurrentIndex(parseInt(e.currentTarget.id));
            e.toElement.className += " list-group-item-danger";
            const familyParams = familyTypes.getCurrentType();
            refreshFamilyParams(familyParams)
        }

        let spanRemove = document.createElement('span')
        spanRemove.setAttribute('class', 'badge')
        spanRemove.onclick = (e) => {
            familyTypes.removeType(parseInt(e.currentTarget.parentNode.id));
            refreshTypeList();
        };
        spanRemove.textContent = 'Remove';
        li.appendChild(spanRemove);

        familyTypesList.appendChild(li);
        id++;
    })

    familyTypesList.children[familyTypes.getCurrentIndex()].className += " list-group-item-danger";
    refreshFamilyParams(familyTypes.getCurrentType());
}


function list(control, endpoint) {
    $('#' + control).find('option').remove().end();
    jQuery.ajax({
        url: endpoint,
        success: function (list) {
            if (list.length === 0)
                $('#' + control).append($('<option>', { disabled: true, text: 'Nothing found' }));
            else
                list.forEach(function (item) { $('#' + control).append($('<option>', { value: item, text: item })); })
        }
    });
}

function clearAccount() {
    if (!confirm('Clear existing activities & appbundles before start. ' +
        'This is useful if you believe there are wrong settings on your account.' +
        '\n\nYou cannot undo this operation. Proceed?')) return;

    jQuery.ajax({
        url: 'api/forge/designautomation/account',
        method: 'DELETE',
        success: function () {
            prepareLists();
            writeLog('Account cleared, all appbundles & activities deleted');
        }
    });
}

function defineActivityModal() {
    $("#defineActivityModal").modal();
}

function createAppBundleActivity() {
    startConnection(function () {
        writeLog("Defining appbundle and activity for " + $('#engines').val());
        $("#defineActivityModal").modal('toggle');
        createAppBundle(function () {
            createActivity(function () {
                prepareLists();
            })
        });
    });
}

function createAppBundle(cb) {
    jQuery.ajax({
        url: 'api/forge/designautomation/appbundles',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            zipFileName: $('#localBundles').val(),
            engine: $('#engines').val()
        }),
        success: function (res) {
            writeLog('AppBundle: ' + res.appBundle + ', v' + res.version);
            if (cb) cb();
        }
    });
}

function createActivity(cb) {
    jQuery.ajax({
        url: 'api/forge/designautomation/activities',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            zipFileName: $('#localBundles').val(),
            engine: $('#engines').val()
        }),
        success: function (res) {
            writeLog('Activity: ' + res.activity);
            if (cb) cb();
        }
    });
}

function startWorkitem() {
    var inputFileField = document.getElementById('inputFile');
    if (inputFileField.files.length === 0) { alert('Please select an input file'); return; }
    if ($('#activity').val() === null) { alert('Please select an activity'); return };
    var file = inputFileField.files[0];
    var activityName = $('#activity option:selected').text();


    startConnection(function () {


        // Save the current params first
        saveCurrentParams();

        const glassPaneMaterial = $('#glassPaneMaterialSelId option:selected').text();
        const sashMaterial = $('#sashMaterialSelId option:selected').text();
        const windowFamilyName = ($('#windowFamilyNameId').val() === "") ? "Double Hung.rfa" : $('#windowFamilyNameId').val();
        const windowType = $('input[name="windowStyle"]:checked ').val();

        // TBD: support different type of family, and multiple types in one family
        const params = {
            FileName: windowFamilyName,
            FamilyType: FamileyType.WINDOW,
            WindowParams: {
                WindowStyle: windowType,
                GlassPaneMaterial: glassPaneMaterial,
                SashMaterial: sashMaterial,
                Types: familyTypes.getAllTypes(),
            }
        };



        var formData = new FormData();
        formData.append('inputFile', file);
        formData.append('activityName', activityName);
        formData.append('data', JSON.stringify(params));
        formData.append('browerConnectionId', connectionId);

        writeLog('Uploading input file...');
        $.ajax({
            url: 'api/forge/designautomation/workitems',
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function (res) {
                writeLog('Workitem started: ' + res.workItemId);
            }
        });
    });
}

function writeLog(text) {
    $('#outputlog').append('<div style="border-top: 1px dashed #C0C0C0">' + text + '</div>');
    var elem = document.getElementById('outputlog');
    elem.scrollTop = elem.scrollHeight;
}

var connection;
var connectionId;

function startConnection(onReady) {
    if (connection && connection.connectionState) { if (onReady) onReady(); return; }
    connection = new signalR.HubConnectionBuilder().withUrl("/api/signalr/designautomation").build();
    connection.start()
        .then(function () {
            connection.invoke('getConnectionId')
                .then(function (id) {
                    connectionId = id; // we'll need this...
                    if (onReady) onReady();
                });
        });

    connection.on("downloadResult", function (url) {
        writeLog('<a href="' + url + '">Download result file here</a>');
    });

    connection.on("onComplete", function (message) {
        writeLog(message);
    });
}