function checkClick(name, check) {
	sat = satDict[name];
	if (check) {
		sat.visible = true;
	}
	else {
		sat.visible = false;
	}
}

function checkAll(check) {
	var checkboxes = document.getElementsByTagName('input');
	var testOne = document.getElementById('test1');
	var testTwo = document.getElementById('test2');
	if (check) {
		for (var i = 0; i < checkboxes.length; i++) {
             if (checkboxes[i].type == 'checkbox' && checkboxes[i] != testOne && checkboxes[i] != testTwo) {
                 checkboxes[i].checked = true;
             }
         }
		for (var key in satDict) {
			satDict[key].visible = true;
		}
	}
	else {
		for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].type == 'checkbox' && checkboxes[i] != testOne && checkboxes[i] != testTwo) {
                checkboxes[i].checked = false;
            }
        }
		for (var key in satDict) {
			satDict[key].visible = false;
		}
	}
}

function openSideBar() {
	setTimeout(function(){
	document.getElementById("gsTitle").style.width = "20%";
	document.getElementById("gsTitle").style.height = "20%"
	document.getElementById("gsTitle").style.top = "0%";
	document.getElementById("gsTitle").visible = true;
	document.getElementById("sitenav").style.width = "20%";
	document.getElementById("sitenav").style.height = "20%"
	document.getElementById("sitenav").style.top = "10%";
	document.getElementById("sitenav").visible = true;
	document.getElementById("spacecraftTitle").style.width = "20%";
	document.getElementById("spacecraftTitle").style.height = "20%"
	document.getElementById("spacecraftTitle").style.top = "30%";
	document.getElementById("spacecraftTitle").visible = true;
    document.getElementById("craftnav").style.width = "20%";
	document.getElementById("craftnav").style.height = "53%";
	document.getElementById("craftnav").style.top = "47%";
	document.getElementById("craftnav").visible = true;
	}, 2000);
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