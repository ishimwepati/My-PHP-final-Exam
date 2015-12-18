
$(document).ready(function () {

    $('.expand').wrapInner('<a style="display:block" href="#" title="expand/collapse"></a>');
    $('div.expanding-panel-wrapper').find('.expand:eq(0)').addClass('open').end()
	.find('div.collapse:gt(0)').hide().end()
	.find('.expand').click(function () {
	    $(this).toggleClass('open').siblings().removeClass('open').end()
		.next('div.collapse').slideToggle().siblings('div.collapse:visible').slideUp();
	    return false;
	});

    $(".LinkButton a, .LinkButtonFlash a, .LinkButtonNoTrack a").wrapInner('<span class="bl"><span class="br"><span class="tl"><span class="tr"></span></span></span></span>');

    // SHOW CLOSE EXPAND ACCORDION CONTROL
    $("a.expand_heading").click(function () {
        $(".collapse").slideToggle("slow");
        $('div.expanding-panel-wrapper').find('.expand').toggleClass('open');
    });

    // magazine panels indepentant opening panels
    $('.magazinePanelContainer .magazinePanel').addClass('hide');
    $(".magazinePanelContainer h2").click(function () {
        $(this).toggleClass('open').next('div').toggleClass('hide');
    });

    // Cookie Banner
    $(function () {
        $('#cookieWrapper .SmallButton a').click(function (e) {
            e.preventDefault();
            $('#cookieWrapper').slideUp("slow");
        });
    });

    // ADVANCED SEARCH

    //hide the adv search on page load
    //$("#advancedSearch").hide(); // Uncomment during html dev - now done in .NET 
    //on clicking the link 
    $("#advancedSearchLink").click(function (e) {
        // get the value of the search field
        var searchValue = $("#siteSearch").val();
        $("#txtAllWords").val(searchValue);
        $("#siteSearch").val('');
        //show the advanced search									 
        $("#advancedSearch").toggle();
        $(".searchSite").toggle();
        e.preventDefault();
    });

    $.fn.clearForm = function () {
        return this.each(function () {
            var type = this.type, tag = this.tagName.toLowerCase();
            if (tag == 'form')
                return $(':input', this).clearForm();
            if (type == 'text' || type == 'password' || tag == 'textarea')
                this.value = '';
            else if (type == 'checkbox' || type == 'radio')
                this.checked = false;
            else if (tag == 'select')
                this.selectedIndex = -1;
        });
    };



    $('#clear').click(function () {
        $(':input[type=text]').clearForm()


    })




    // PAGINATION ARROWS
    $("#pagination ul li:first-child").addClass("first");
    $("#pagination ul li:last-child").addClass("last");


    $(".stripey tbody tr:even").addClass("alternaterow");
    $(".stripey thead th").attr("scope", "col");
    $(".stripey tbody th").attr("scope", "row");

    $(".Tertiary ul li:last-child").addClass("NoBorder");

    $('input[type="text"]').each(function () {

        if ($(this).attr('title')) {

            this.value = $(this).attr('title');
            $(this).addClass('text-label');

            $(this).focus(function () {
                if (this.value == $(this).attr('title')) {
                    this.value = '';
                    $(this).removeClass('text-label');
                }
            });

            $(this).blur(function () {
                if (this.value == '') {
                    this.value = $(this).attr('title');
                    $(this).addClass('text-label');
                }
            });

        }
    });

    // Region map scripts	
    // This highlights the selected region on map when a region is selected via the listing 
    $("#uk li").hover(
		function () {
		    var $el = $(this);
		    var region = $el.attr('class');
		    var regionLink = $el.find('a');
		    var toolTip = $el.find('span.Maptooltip');
		    var toolTipText = regionLink.text();
		    toolTipText = toolTipText ? toolTipText : $el.attr('title');
		    var toolTipLink = regionLink.attr('href');

		    $el.addClass('active');
		    $('#map-regions ul li.' + region).addClass('hover active');

		    if (toolTip.length) {
		        toolTip.show();
		    } else {
		        $el.append($('<span class="Maptooltip">' + toolTipText + '</span>'))
				.delegate('span.Maptooltip', 'click', (function (e) {
				    regionLink.trigger('click');
				    location.href = toolTipLink;
				    e.stopPropagation();
				    e.preventDefault();
				}));
		    }

		},
		function () {
		    var $el = $(this);
		    $el.removeClass('active');
		    $el.find('span.Maptooltip').hide();
		    $('#map-regions ul li').removeClass('hover active');
		}
	);

    $("#uk").mouseleave(function () {
        $('#map-regions ul li').removeClass('active hover');
        $('#uk li').removeClass('active');
    });

    $("#map-regions ul li").hover(function () {
        var regionMap = $(this).attr('class');
        var region = $(this).attr('class');

        if (region == regionMap) {
            $('#uk li').removeClass('active');
            $('#uk li.' + region).addClass('active');
        }
    });

    $("#map-regions ul li").hover(
		function () {
		    $(this).addClass('hover');
		},
		function () {
		    $(this).removeClass('hover');

		}
	);
    $(".CareerPathList ul li:nth-child(odd), .VehiclesList ul li:nth-child(odd), .RecentAwardsList ul li:nth-child(odd), .NewsListDate ul li:nth-child(odd), .NewsList li:nth-child(odd)").addClass("alternaterow");

    (function ($) {
        // VERTICALLY ALIGN FUNCTION
        $.fn.vAlign = function () {
            return this.each(function (i) {
                var ah = $(this).height();
                var ph = $(this).parent().height();
                var mh = (ph - ah) / 2;
                $(this).css('padding-top', mh);
            });
        };
    })(jQuery);

    /*Equal height panels on the downloads page*/
    Number.prototype.pxToEm = String.prototype.pxToEm = function (settings) {
        //set defaults
        settings = jQuery.extend({
            scope: 'body',
            reverse: false
        }, settings);

        var pxVal = (this == '') ? 0 : parseFloat(this);
        var scopeVal;
        var getWindowWidth = function () {
            var de = document.documentElement;
            return self.innerWidth || (de && de.clientWidth) || document.body.clientWidth;
        };

        if (settings.scope == 'body' && $.browser.msie && (parseFloat($('body').css('font-size')) / getWindowWidth()).toFixed(1) > 0.0) {
            var calcFontSize = function () {
                return (parseFloat($('body').css('font-size')) / getWindowWidth()).toFixed(3) * 16;
            };
            scopeVal = calcFontSize();
        }
        else { scopeVal = parseFloat(jQuery(settings.scope).css("font-size")); };

        var result = (settings.reverse == true) ? (pxVal * scopeVal).toFixed(2) + 'px' : (pxVal / scopeVal).toFixed(2) + 'em';
        return result;
    };

    $.fn.equalHeights = function (px) {
        $(this).each(function () {
            var currentTallest = 0;
            $(this).children().each(function (i) {
                if ($(this).height() > currentTallest) { currentTallest = $(this).height(); }
            });
            if (!px || !Number.prototype.pxToEm) currentTallest = currentTallest.pxToEm(); //use ems unless px is specified
            // for ie6, set height since min-height isn't supported
            if ($.browser.msie && $.browser.version == 6.0) { $(this).children().css({ 'height': currentTallest }); }
            $(this).children().css({ 'min-height': currentTallest });
        });
        return this;
    };

    $('.Downloads').equalHeights();


    /*download form hide show options*/


    $("#other_field > *").hide();
    $("#county").change(function () {
        $("#other_field > *").hide();
        if ($("#county").val()) //if selected has value, then show the selected one
            $("#" + $("#county").val()).show();
    });

    $(".other_field > *").hide();
    $("#establishment").change(function () {
        $(".other_field > *").hide();
        if ($("#establishment").val()) //if selected has value, then show the selected one
            $("#" + $("#establishment").val()).show();
    });

    /* download page toggle */
    $('#resource_form').hide();
    $('#toggleButton').click(function () {
        $('#resource_form').toggle();
        if ($('#resource_form').is(':visible')) {
            $(this).val('Hide');
        } else {
            $(this).val('Show');
        }
    });

    /* careers office expand collapse*/
    /*
    var showText='Expand';
    var hideText='Collapse';
    // initialise the visibility check
    var is_visible = false;
    $('.expand_careers').append('<a class="toggleLink">'+showText+'</a>');	
    $('.toggleLink').click(function() {
    if ($('.toggle').is(':visible')) {
    $('.toggle').hide();
    $('.toggleLink').html('Expand');
    } else {
    $('.toggle').show();
    $('.toggleLink').html('Collapse');
    }
    });
    */

    /* careers office tooltip*/

    function turnOn(o) {
        if (!o.t) {

            // store orginal contents as part of object
            o.t = o.title;
            o.c = o.innerHTML;

            // store tooltip build as part of the object
            o.h = o.c + '<span class="tooltip"><span class="ttbox"> ' + o.title + '</span><span class="ttarrow"></span></span>';
        }
        if ($(o).css('position') == "relative") {
            o.innerHTML = o.h;
            o.title = '';
        }
        $(o).find('span.tooltip').fadeIn('fast');
    }

    function turnOff(o) {
        $(o).find('span.tooltip').fadeOut('slow');
        o.innerHTML = o.c;
        o.title = o.t;
    }

    // loop through all objects with a title attribute
    var titles = $('.careers [title]');

    // use an efficient for loop as there may be a lot to cycle through
    for (var z = titles.length - 1; z > -1; z--) {

        // titled object must be position:relative
        $(titles[z]).addClass('tooltipParent');

        // titled object must appear in the keyboard focus
        $(titles[z]).attr('tabindex', '0');

        // mouse & keyboard functions
        $(titles[z])
	  .hover(function () { turnOn(this); }, function () { turnOff(this); })
	  .focus(function () { turnOn(this); })
	  .blur(function () { turnOff(this); });
    }

    var showChar = 500;
    var ellipsestext = "...";
    var moretext = "Read more";
    var lesstext = "Read less";
    $('.more').each(function () {
        var content = $(this).html();

        if (content.length > showChar) {

            var c = content.substr(0, showChar);
            var h = content.substr(showChar - 0, content.length - showChar);

            var html = c + '<span class="moreelipses">' + ellipsestext + '</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink">' + moretext + '</a></span>';

            $(this).html(html);
        }

    });

    $(".morelink").click(function () {
        if ($(this).hasClass("less")) {
            $(this).removeClass("less");
            $(this).html(moretext);
        } else {
            $(this).addClass("less");
            $(this).html(lesstext);
        }
        $(this).parent().prev().toggle();
        $(this).prev().toggle();
        return false;
    });
});