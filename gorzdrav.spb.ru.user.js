// ==UserScript==
// @name         Doctor Checker
// @namespace    https://gorzdrav.spb.ru/
// @version      0.2
// @description  checks for available applications
// @author       morrah@neko.im
// @match        https://gorzdrav.spb.ru/*
// @downloadURL  https://github.com/morrah/userscripts/raw/master/gorzdrav.spb.ru.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addObserverForm() {
        var frm = `<div id="observerForm">
            <style>
                #observerForm, #patientHelperForm {
                    background: #aaa;
                    padding: 0.2rem;
                }
                #patientHelperAdd {
                    padding: 0.5rem;
                    text-align: center;
                }
                .patient-helper-button .icon-img {
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                    padding-left: 1rem;
                    padding-right: 1rem;
                }
                .patient-text {
                    display: inline-block;
                    padding: 0.5rem;
                }
                .btn {
                    cursor: pointer;
                    -webkit-transition-duration: 0.5s;
                       -moz-transition-duration: 0.5s;
                         -o-transition-duration: 0.5s;
                            transition-duration: 0.5s;
                            user-select: none;
                       -moz-user-select: none;
                     -khtml-user-select: none;
                    -webkit-user-select: none;
                         -o-user-select: none;
                }
                .btn:hover {
                    background: #FF66CC;
                }
                .btn:active {
                    background: #e738ff;
                }
                .icon-img {
                    padding-left: 1rem;
                    padding-right: 1rem;
                    margin-right: 0.2rem;
                    float: left;
                }
                .app-found {
                    background: green;
                    -webkit-transition-duration: 0.5s;
                       -moz-transition-duration: 0.5s;
                         -o-transition-duration: 0.5s;
                            transition-duration: 0.5s;
                }
                .app-checking {
                    background: white;
                    -webkit-transition-duration: 0.5s;
                       -moz-transition-duration: 0.5s;
                         -o-transition-duration: 0.5s;
                            transition-duration: 0.5s;
                }
                .app-error {
                    background: red;
                    -webkit-transition-duration: 0.5s;
                       -moz-transition-duration: 0.5s;
                         -o-transition-duration: 0.5s;
                            transition-duration: 0.5s;
                }
            </style>
            <div class="icon-img plus-img btn" title="добавить всех врачей со страницы">+</div>
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
    function addDoctor(id, doctorId, clinicId, desc) {
        console.log('adding #'+id+': clinic #' + clinicId + '; doctor #' + doctorId + '; ' + desc);
        var doctor = `<div data-id="` + id + `" id="doctor` + id + `">
            <div class="icon-img minus-img btn" title="удалить врача из списка">–</div>
            <div>` + desc + `</div>
        </div>`;
        observerDoctorList[id] = { 'desc': desc, 'timer': setChecker(id, doctorId, clinicId), 'doctor': doctorId, 'clinic': clinicId };
        var d = document.createElement('div');
        d.innerHTML = doctor;
        observerForm.appendChild(d.childNodes[0]);
        observerForm.querySelector('#doctor'+id+' > .icon-img').onclick = function() {
            removeDoctor(id);
        };
        localStorage.setItem('observerDoctorList', JSON.stringify(observerDoctorList));
        return id;
    }
    function removeDoctor(id) {
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
                var frm = `<div class="icon-img plus-img btn" title="добавить врача в список">+</div>`;
                var d = document.createElement('div');
                d.innerHTML = frm;
                doctor.insertBefore(d.childNodes[0], doctor.childNodes[0]);
                doctor.querySelector('.plus-img').onclick = function() {
                    event.stopPropagation();
                    if (!(calcHash(doctor.getAttribute('data-id')) in observerDoctorList)) {
                        addDoctor(
                            calcHash(doctor.getAttribute('data-id')),
                            doctor.getAttribute('data-id'),
                            app.view.forms[1].model.attributes.values.clinic,
                            doctor.innerText
                        );
                    }
                };
            }
        });
    }
    function addAllDoctors() {
        var doctors = document.querySelectorAll('#doctor_list > li');
        if ((doctors.length > 0) && doctors[0].classList.contains('empty_elem')) {
            return;
        }
        doctors.forEach(function(doctor) {
            if (!(calcHash(doctor.getAttribute('data-id')) in observerDoctorList)) {
                addDoctor(
                    calcHash(doctor.getAttribute('data-id')),
                    doctor.getAttribute('data-id'),
                    app.view.forms[1].model.attributes.values.clinic,
                    doctor.innerText
                );
            }
        });
    }
    function checkDoctor(id, doctorId, clinicId) {
        var url = 'https://gorzdrav.spb.ru/api/doctor_schedule/';
        var data = {
            'doctor_form-doctor_id': doctorId,
            'doctor_form-clinic_id': clinicId,
        };
        document.querySelector('#doctor'+id).classList.remove('app-found');
        document.querySelector('#doctor'+id).classList.remove('app-error');
        document.querySelector('#doctor'+id).classList.add('app-checking');
        $.post(url, data)
        .done(function(data) {
            document.querySelector('#doctor'+id).classList.remove('app-checking');
            if (!data.success){
                document.querySelector('#doctor'+id).classList.add('app-error');
                return;
            }
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
                document.querySelector('#doctor'+id).classList.add('app-found');
                player.play();
            } else {
                document.querySelector('#doctor'+id).classList.remove('app-found');
            }
        });
    }
    function setChecker(id, doctorId, clinicId) {
        var timer = setInterval(function(){
            console.log('checking #' + id + '; doctorId #' + doctorId + '; clinicId #' + clinicId);
            checkDoctor(id, doctorId, clinicId);
        }, checkPeriod);
        return timer;
    }
    function calcHash(s) {
        var hash = 0,
            strlen = s.length,
            i,
            c;
        if ( strlen === 0 ) {
            return hash;
        }
        for ( i = 0; i < strlen; i++ ) {
            c = s.charCodeAt( i );
            hash = ((hash << 5) - hash) + c;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    // patient helper form functions
    function addPatient() {
        var patient = {};
        patientForm.forEach(function(key) {
            var field = document.querySelector(key);
            if (field) {
                patient[key] = field.value;
            }
        });
        var patientId = patient['input#id_patient_form-last_name'] +
            ' ' +
            patient['input#id_patient_form-first_name'];
        if (patientId.trim() === '') {
            return;
        }
        console.log(patientList);
        patientList[calcHash(patientId)] = Object.assign({}, patientList[calcHash(patientId)], patient);
        console.log(patientList);
        localStorage.setItem('patientList', JSON.stringify(patientList));
        redrawPatientForm();
    }
    function removePatient(patientId) {
        delete patientList[patientId];
        localStorage.setItem('patientList', JSON.stringify(patientList));
        redrawPatientForm();
    }
    function redrawPatientForm() {
        var oldForm = document.querySelector('#patientHelperForm');
        if (oldForm) {
            oldForm.parentNode.removeChild( oldForm );
        }
        var buttonList = '';
        for (var key in patientList) {
            if (patientList.hasOwnProperty(key)) {
                var patientName = patientList[key]['input#id_patient_form-last_name'] +
                    ' ' +
                    patientList[key]['input#id_patient_form-first_name'];
                buttonList += `<div class="patient-helper-button" data-id="` + key + `">
                               <div class="icon-img minus-img btn" title="Удалить пациента из списка пресетов">–</div>
                               <div class="patient-text btn">` + patientName + `</div>
                               </div>`;
            }
        }
        var frm = `<div id="patientHelperForm">
                   <div id="patientHelperAdd" class="btn">Добавить форму в список пресетов</div>
                  ` + buttonList + `
                   </div>`;
        var d = document.createElement('div');
        d.innerHTML = frm;
        document.querySelector('#patient_form .info').append(d.childNodes[0]);
        var btns = document.querySelectorAll('#patient_form .info .patient-helper-button');
        btns.forEach(function(btn) {
            var id = btn.getAttribute('data-id');
            btn.querySelector('.minus-img').onclick = function() {
                removePatient(id);
            };
            btn.querySelector('.patient-text').onclick = function() {
                patientForm.forEach(function(key){
                    var field = document.querySelector(key);
                    if (field) {
                        field.value = patientList[id][key] || '';
                        // trigger onchange for backbone
                        if ("createEvent" in document) {
                            var evt = document.createEvent('HTMLEvents');
                            evt.initEvent('change', false, true);
                            field.dispatchEvent(evt);
                        }
                        else
                            field.fireEvent('onchange');
                    }
                });
            };
        });
        document.querySelector('#patientHelperAdd').onclick = function() {
            addPatient();
        };
    }

    var turnOffDoctorListSearch = false;
    var turnOffPatientFormSearch = false;
    $(window).bind('hashchange', function() {
        // look for doctor-list for 10 seconds
        var countDoctors = 0;
        var timerDoctors = setInterval(function() {
            countDoctors++;
            var doctorList = document.querySelector('#doctor_list');
            var patientForm = document.querySelector('#patient_form');
            if (doctorList && doctorList.innerText.trim() !== '') {
                clearInterval(timerDoctors);
                turnOffDoctorListSearch = true;
                hookDoctors();
            }
            if ((countDoctors > 20) || (turnOffDoctorListSearch)) {
                clearInterval(timerDoctors);
                turnOffDoctorListSearch = false;
            }
        }, 500);
        // look for patient form for 2 seconds
        var countPatient = 0;
        var timerPatient = setInterval(function() {
            countPatient++;
            var patientForm = document.querySelector('#patient_form');
            if (patientForm && patientForm.innerText.trim() !== '') {
                clearInterval(timerPatient);
                turnOffPatientFormSearch = true;
                redrawPatientForm();
            }
            if ((countPatient > 4) || (turnOffPatientFormSearch)) {
                clearInterval(timerPatient);
                turnOffPatientFormSearch = false;
            }
        }, 500);
    });

    var checkPeriod = 10000; // check every 10 seconds
    var player = document.createElement('audio');
    player.src = 'https://files.catbox.moe/qpctri.mp3';
    player.preload = 'auto';

    var observerForm = addObserverForm();
    var observerDoctorList = JSON.parse(localStorage.getItem('observerDoctorList')) || {};
    for (var key in observerDoctorList) {
        if (observerDoctorList.hasOwnProperty(key)) {
            console.log(key, observerDoctorList[key]);
            addDoctor(key, observerDoctorList[key].doctor, observerDoctorList[key].clinic, observerDoctorList[key].desc);
        }
    }
    var patientList = JSON.parse(localStorage.getItem('patientList')) || {};
    var patientForm = [
        'input#id_patient_form-last_name',
        'input#id_patient_form-first_name',
        'input.jq_input_day',
        'input.jq_input_month_verbose',
        'input.jq_input_year',
        'input.jq_input_month_actual',
        'input#id_patient_form-insurance_series',
        'input#id_patient_form-insurance_number',
        'input#id_patient_form-email',
        'input#id_patient_form-phone',
        'input#id_patient_form-middle_name',
    ];
    $(window).trigger('hashchange');
})();
