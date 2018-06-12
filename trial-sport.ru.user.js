// ==UserScript==
// @name         trial-sport item availability
// @namespace    https://trial-sport.ru/
// @version      0.1
// @description  adds the button to the item card to show size/availability in local shops by click (without opening an item page by hand)
// @author       morrah@neko.im
// @match        https://trial-sport.ru/gds.php?*
// @downloadURL  https://github.com/morrah/userscripts/raw/master/trial-sport.ru.user.js
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';
    $(document).ready(function() {
        $.each($('.objects .object.ga'), function(index, value) {
            var url = $(value).find('a').attr('href');
            $(value).find('span.available').after('<span class="available-shops"><input type="button" class="button button_blue" value="Магазины"  style="padding:15px;cursor:pointer;" /></span>');

            $(value).find('.available-shops .button').click(function( event ) {
                event.preventDefault();
                var that = this;
                $.get(url, function( data ) {
                    var $shops = $(data).find('.avail_shops');
                    $shops.removeClass('hidden');
                    var html = '';
                    $.each($shops, function(i, val){html += $(val).html()});
                    $(that).parent().html( html );
                });
            });

            // fix card height
            $(value).css('height', 'auto');
            $(value).find('span.checks').css('position', 'static');
            $(value).children('.object_bg').addClass('hidden');
        });
    });
})($);
