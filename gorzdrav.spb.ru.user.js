// ==UserScript==
// @name         doctor checker
// @namespace    https://gorzdrav.spb.ru/
// @version      0.1
// @description  checks for free applications
// @author       morrah@neko.im
// @match        https://gorzdrav.spb.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addObserverForm() {
        var frm = `<div id="observerForm">
            <style>
                #observerForm {
                    background: #aaa;
                    padding: 0.2rem;
                }
                .icon-img {
                    padding-left: 1rem;
                    padding-right: 1rem;
                    float: left;
                }
                .icon-img:hover {
                    background: #FF66CC;
                    cursor: pointer;
                }
                .app-found {
                    background: green;
                }
            </style>
            <div class="icon-img plus-img" title="добавить врачей со страницы">+</div>
            <div>Список отслеживаемых врачей:</div>
        </div>`;
        var d = document.createElement('div');
        d.innerHTML = frm;
        document.querySelector('body').insertBefore(d.childNodes[0], document.querySelector('body').childNodes[0]);
        document.querySelector('#observerForm > .plus-img').onclick = function() {
            addAllDoctors();
        };
        return document.querySelector('#observerForm');
    }
    function addDoctor(id, desc) {
        console.log('adding #'+id+': '+desc);
        var doctor = `<div id="doctor` + id + `">
            <div class="icon-img minus-img">–</div>
            <div>` + id + ` ` + desc + `</div>
        </div>`;
        observerDoctorList[id] = { 'desc': desc, 'timer': setChecker(id) };
        var d = document.createElement('div');
        d.innerHTML = doctor;
        observerForm.appendChild(d.childNodes[0]);
        observerForm.querySelector('#doctor'+id+' > .icon-img').onclick = function() {
            console.log(id);
            removeDoctor(id);
        };
        localStorage.setItem('observerDoctorList', JSON.stringify(observerDoctorList));
        return id;
    }
    function removeDoctor(id) {
        console.log(id);
        clearTimeout(observerDoctorList[id].timer);
        delete observerDoctorList[id];
        localStorage.setItem('observerDoctorList', JSON.stringify(observerDoctorList));
        var doc = observerForm.querySelector('#doctor'+id);
        if (doc) {
            doc.parentNode.removeChild( doc );
        }
    }
    function hookDoctors() {
        var doctors = document.querySelectorAll('#doctor_list > li');
        doctors.forEach(function(doctor) {
            if (!doctor.querySelector('.icon-img')){
                var frm = `<div class="icon-img plus-img">+</div>`;
                var d = document.createElement('div');
                d.innerHTML = frm;
                doctor.insertBefore(d.childNodes[0], doctor.childNodes[0]);
                doctor.querySelector('.plus-img').onclick = function() {
                    event.stopPropagation();
                    if (!(doctor.getAttribute('data-id') in observerDoctorList)) {
                        addDoctor(doctor.getAttribute('data-id'), doctor.innerText);
                    }
                };
            }
        });
    }
    function addAllDoctors() {
        var doctors = document.querySelectorAll('#doctor_list > li');
        doctors.forEach(function(doctor) {
            if (!(doctor.getAttribute('data-id') in observerDoctorList)) {
                addDoctor(doctor.getAttribute('data-id'), doctor.innerText);
            }
        });
    }
    function checkDoctor(id) {
        var url = 'https://gorzdrav.spb.ru/api/doctor_schedule/';
        var data = {
            'doctor_form-doctor_id': id,
            'doctor_form-clinic_id': app.view.forms[1].model.attributes.values.clinic || '193',
        };
        $.post(url, data)
        .done(function(data) {
            var apps = [];
            data.response.forEach(function(page){
                page.forEach(function(day) {
                    if (!day.deny && day.apps) {
                        apps.push(day.apps);
                    }
                });
            });
            console.log(apps.length);
            if (apps.length > 0) {
                document.querySelector('#doctor'+id).classList.add("app-found");
                player.play();
            } else {
                document.querySelector('#doctor'+id).classList.remove("app-found");
            }
        });
    }
    function setChecker(id) {
        var timer = setInterval(function(){
            console.log('checking #' + id);
            checkDoctor(id);
        }, 10000);
        return timer;
    }
    $(window).bind('hashchange', function() {
        console.log('hashchange fired');
        // look for doctor-list for 5 seconds
        var counts = 0;
        var timer = setInterval(function() {
            counts++;
            if (document.querySelector('#doctor_list').innerText.trim() !== '') {
                clearInterval(timer);
                hookDoctors();
            }
            if (counts > 10) {
                clearInterval(timer);
            }
        }, 500);
    });

    var player = document.createElement('audio');
    player.src = 'https://files.catbox.moe/qpctri.mp3';
    player.preload = 'auto';

    var observerForm = addObserverForm();
    var observerDoctorList = JSON.parse(localStorage.getItem('observerDoctorList')) || {};
    for (var key in observerDoctorList) {
        if (observerDoctorList.hasOwnProperty(key)) {
            console.log(key, observerDoctorList[key]);
            addDoctor(key, observerDoctorList[key].desc);
        }
    }
    $(window).trigger('hashchange');
})();