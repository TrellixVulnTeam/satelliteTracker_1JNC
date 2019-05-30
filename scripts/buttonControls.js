function checkClick(name, check) {
	sat = satDict[name];
	var checkboxes = document.getElementsByTagName('input');
	var testOne = document.getElementById('test1');
	var testTwo = document.getElementById('test2');
	if (check) {
		sat.visible = true;
	}
	else {
		sat.visible = false;
	}
	checkForAllChecked(checkboxes,testOne,testTwo);
}

function checkAll(check) {
	var checkboxes = document.getElementsByTagName('input');
	var testOne = document.getElementById('test1');
	var testTwo = document.getElementById('test2');
	var allButton = document.getElementById('allCheck');
	for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].type == 'checkbox' && checkboxes[i] != testOne && checkboxes[i] != testTwo && checkboxes[i] != allButton) {
            if (check) {
				checkboxes[i].checked = true;
				satDict[checkboxes[i].name].visible = true;
			}
			else {
				checkboxes[i].checked = false;
				satDict[checkboxes[i].name].visible = false;
			}
        }
    }
}

function openSideBar() {
	setTimeout(function(){
	document.getElementById("gsTitle").style.width = "20%";
	document.getElementById("gsTitle").style.height = "20%"
	document.getElementById("gsTitle").style.top = "0%";
	document.getElementById("gsTitle").visible = true;
	document.getElementById("gsnav").style.width = "20%";
	document.getElementById("gsnav").style.height = "20%"
	document.getElementById("gsnav").style.top = "10%";
	document.getElementById("gsnav").visible = true;
	document.getElementById("spacecraftTitle").style.width = "20%";
	document.getElementById("spacecraftTitle").style.height = "20%"
	document.getElementById("spacecraftTitle").style.top = "30%";
	document.getElementById("spacecraftTitle").visible = true;
    document.getElementById("craftnav").style.width = "20%";
	document.getElementById("craftnav").style.height = "53%";
	document.getElementById("craftnav").style.top = "47%";
	document.getElementById("craftnav").visible = true;
	}, 1000);
}

function showGroundSites(name, check) {
	gs = groundSites[name];
	if (check) {
		gs.visible = true;
	}
	else {
		gs.visible = false;
	}
}

function checkForAllChecked(checkboxes, testOne, testTwo) {
	var numChecked = 0;
	var allButton = document.getElementById('allCheck');
	for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].type == 'checkbox' && checkboxes[i] != testOne && checkboxes[i] != testTwo && checkboxes[i] != allButton) {
            if (checkboxes[i].checked == true) {
				numChecked += 1;
			}
        }
    }
	if (numChecked == 100) {
		allButton.checked = true;
	}
	else {
		allButton.checked = false;
	}
}