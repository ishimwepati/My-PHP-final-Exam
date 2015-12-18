/*!
 * jQuery Form Plugin
 * version: 3.46.0-2013.11.21
 * Requires jQuery v1.5 or later
 * Copyright (c) 2013 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp )
        return this.attr.apply(this, arguments);
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' )
        return val;
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++)
        elements[k] = null;

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++)
                if (serializedData[i])
                    formdata.append(serializedData[i][0], serializedData[i][1]);
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData)
                o.data = options.formData;
            else
                o.data = formdata;
            if(beforeSend)
                beforeSend.call(this, xhr, o);
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp )
                    el.prop('disabled', false);
                else
                    el.removeAttr('disabled');
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n)
                 $io.attr2('name', id);
            else
                id = n;
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error)
                    s.error.call(s.context, xhr, e, status);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, e]);
                if (s.complete)
                    s.complete.call(s.context, xhr, e);
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), a = $form.attr2('action');

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized')
                        setTimeout(checkState,50);
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent)
                    io.attachEvent('onload', cb);
                else
                    io.addEventListener('load', cb, false);
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut)
                    return;
            }
            if (io.detachEvent)
                io.detachEvent('onload', cb);
            else
                io.removeEventListener('load', cb, false);

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml)
                    s.dataType = 'xml';
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success)
                    s.success.call(s.context, data, 'success', xhr);
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g)
                    $.event.trigger("ajaxSuccess", [xhr, s]);
            }
            else if (status) {
                if (errMsg === undefined)
                    errMsg = xhr.statusText;
                if (s.error)
                    s.error.call(s.context, xhr, status, errMsg);
                deferred.reject(xhr, 'error', errMsg);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
            }

            if (g)
                $.event.trigger("ajaxComplete", [xhr, s]);

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete)
                s.complete.call(s.context, xhr, status);

            callbackProcessed = true;
            if (s.timeout)
                clearTimeout(timeoutHandle);

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget)
                    $io.remove();
                else  //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error)
                    $.error('parsererror');
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements)
                elements.push(el);
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements)
                elements.push(el);
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements)
                elements.push(el);
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array)
            $.merge(val, v);
        else
            val.push(v);
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes['value'] && !(op.attributes['value'].specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
		else if (t == "file") {
			if (/MSIE/.test(navigator.userAgent)) {
				$(this).replaceWith($(this).clone(true));
			} else {
				$(this).val('');
			}
		}
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) )
                this.value = '';
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug)
        return;
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));


/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(window, document, $) {

	var isInputSupported = 'placeholder' in document.createElement('input'),
	    isTextareaSupported = 'placeholder' in document.createElement('textarea'),
	    prototype = $.fn,
	    valHooks = $.valHooks,
	    hooks,
	    placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = prototype.placeholder = function() {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {

		placeholder = prototype.placeholder = function() {
			var $this = this;
			$this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.placeholder')
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder');
			return $this;
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;

		hooks = {
			'get': function(element) {
				var $element = $(element);
				return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
			},
			'set': function(element, value) {
				var $element = $(element);
				if (!$element.data('placeholder-enabled')) {
					return element.value = value;
				}
				if (value == '') {
					element.value = value;
					// Issue #56: Setting the placeholder causes problems if the element continues to have focus.
					if (element != document.activeElement) {
						// We can’t use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					}
				} else if ($element.hasClass('placeholder')) {
					clearPlaceholder.call(element, true, value) || (element.value = value);
				} else {
					element.value = value;
				}
				// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
				return $element;
			}
		};

		isInputSupported || (valHooks.input = hooks);
		isTextareaSupported || (valHooks.textarea = hooks);

		$(function() {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function() {
				// Clear the placeholder values so they don’t get submitted
				var $inputs = $('.placeholder', this).each(clearPlaceholder);
				setTimeout(function() {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function() {
			$('.placeholder').each(function() {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {},
		    rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function(i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this,
		    $input = $(input);
		if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass('placeholder');
				input == document.activeElement && input.select();
			}
		}
	}

	function setPlaceholder() {
		var $replacement,
		    input = this,
		    $input = $(input),
		    $origInput = $input,
		    id = this.id;
		if (input.value == '') {
			if (input.type == 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch(e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': true,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prev().attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass('placeholder');
			$input[0].value = $input.attr('placeholder');
		} else {
			$input.removeClass('placeholder');
		}
	}

}(this, document, jQuery));
/*
Copyright 2012 Igor Vaynberg

Version: 3.4.5 Timestamp: Mon Nov  4 08:22:42 PST 2013

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU
General Public License version 2 (the "GPL License"). You may choose either license to govern your
use of this software only upon the condition that you accept all of the terms of either the Apache
License or the GPL License.

You may obtain a copy of the Apache License and the GPL License at:

    http://www.apache.org/licenses/LICENSE-2.0
    http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the
Apache License or the GPL Licesnse is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the Apache License and the GPL License for
the specific language governing permissions and limitations under the Apache License and the GPL License.
*/
(function ($) {
    if(typeof $.fn.each2 == "undefined") {
        $.extend($.fn, {
            /*
            * 4-10 times faster .each replacement
            * use it carefully, as it overrides jQuery context of element on each iteration
            */
            each2 : function (c) {
                var j = $([0]), i = -1, l = this.length;
                while (
                    ++i < l
                    && (j.context = j[0] = this[i])
                    && c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
                );
                return this;
            }
        });
    }
})(jQuery);

(function ($, undefined) {
    "use strict";
    /*global document, window, jQuery, console */

    if (window.Select2 !== undefined) {
        return;
    }

    var KEY, AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer,
        lastMousePosition={x:0,y:0}, $document, scrollBarDimensions,

    KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        isArrow: function (k) {
            k = k.which ? k.which : k;
            switch (k) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
                return true;
            }
            return false;
        },
        isControl: function (e) {
            var k = e.which;
            switch (k) {
            case KEY.SHIFT:
            case KEY.CTRL:
            case KEY.ALT:
                return true;
            }

            if (e.metaKey) return true;

            return false;
        },
        isFunctionKey: function (k) {
            k = k.which ? k.which : k;
            return k >= 112 && k <= 123;
        }
    },
    MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",

    DIACRITICS = {"\u24B6":"A","\uFF21":"A","\u00C0":"A","\u00C1":"A","\u00C2":"A","\u1EA6":"A","\u1EA4":"A","\u1EAA":"A","\u1EA8":"A","\u00C3":"A","\u0100":"A","\u0102":"A","\u1EB0":"A","\u1EAE":"A","\u1EB4":"A","\u1EB2":"A","\u0226":"A","\u01E0":"A","\u00C4":"A","\u01DE":"A","\u1EA2":"A","\u00C5":"A","\u01FA":"A","\u01CD":"A","\u0200":"A","\u0202":"A","\u1EA0":"A","\u1EAC":"A","\u1EB6":"A","\u1E00":"A","\u0104":"A","\u023A":"A","\u2C6F":"A","\uA732":"AA","\u00C6":"AE","\u01FC":"AE","\u01E2":"AE","\uA734":"AO","\uA736":"AU","\uA738":"AV","\uA73A":"AV","\uA73C":"AY","\u24B7":"B","\uFF22":"B","\u1E02":"B","\u1E04":"B","\u1E06":"B","\u0243":"B","\u0182":"B","\u0181":"B","\u24B8":"C","\uFF23":"C","\u0106":"C","\u0108":"C","\u010A":"C","\u010C":"C","\u00C7":"C","\u1E08":"C","\u0187":"C","\u023B":"C","\uA73E":"C","\u24B9":"D","\uFF24":"D","\u1E0A":"D","\u010E":"D","\u1E0C":"D","\u1E10":"D","\u1E12":"D","\u1E0E":"D","\u0110":"D","\u018B":"D","\u018A":"D","\u0189":"D","\uA779":"D","\u01F1":"DZ","\u01C4":"DZ","\u01F2":"Dz","\u01C5":"Dz","\u24BA":"E","\uFF25":"E","\u00C8":"E","\u00C9":"E","\u00CA":"E","\u1EC0":"E","\u1EBE":"E","\u1EC4":"E","\u1EC2":"E","\u1EBC":"E","\u0112":"E","\u1E14":"E","\u1E16":"E","\u0114":"E","\u0116":"E","\u00CB":"E","\u1EBA":"E","\u011A":"E","\u0204":"E","\u0206":"E","\u1EB8":"E","\u1EC6":"E","\u0228":"E","\u1E1C":"E","\u0118":"E","\u1E18":"E","\u1E1A":"E","\u0190":"E","\u018E":"E","\u24BB":"F","\uFF26":"F","\u1E1E":"F","\u0191":"F","\uA77B":"F","\u24BC":"G","\uFF27":"G","\u01F4":"G","\u011C":"G","\u1E20":"G","\u011E":"G","\u0120":"G","\u01E6":"G","\u0122":"G","\u01E4":"G","\u0193":"G","\uA7A0":"G","\uA77D":"G","\uA77E":"G","\u24BD":"H","\uFF28":"H","\u0124":"H","\u1E22":"H","\u1E26":"H","\u021E":"H","\u1E24":"H","\u1E28":"H","\u1E2A":"H","\u0126":"H","\u2C67":"H","\u2C75":"H","\uA78D":"H","\u24BE":"I","\uFF29":"I","\u00CC":"I","\u00CD":"I","\u00CE":"I","\u0128":"I","\u012A":"I","\u012C":"I","\u0130":"I","\u00CF":"I","\u1E2E":"I","\u1EC8":"I","\u01CF":"I","\u0208":"I","\u020A":"I","\u1ECA":"I","\u012E":"I","\u1E2C":"I","\u0197":"I","\u24BF":"J","\uFF2A":"J","\u0134":"J","\u0248":"J","\u24C0":"K","\uFF2B":"K","\u1E30":"K","\u01E8":"K","\u1E32":"K","\u0136":"K","\u1E34":"K","\u0198":"K","\u2C69":"K","\uA740":"K","\uA742":"K","\uA744":"K","\uA7A2":"K","\u24C1":"L","\uFF2C":"L","\u013F":"L","\u0139":"L","\u013D":"L","\u1E36":"L","\u1E38":"L","\u013B":"L","\u1E3C":"L","\u1E3A":"L","\u0141":"L","\u023D":"L","\u2C62":"L","\u2C60":"L","\uA748":"L","\uA746":"L","\uA780":"L","\u01C7":"LJ","\u01C8":"Lj","\u24C2":"M","\uFF2D":"M","\u1E3E":"M","\u1E40":"M","\u1E42":"M","\u2C6E":"M","\u019C":"M","\u24C3":"N","\uFF2E":"N","\u01F8":"N","\u0143":"N","\u00D1":"N","\u1E44":"N","\u0147":"N","\u1E46":"N","\u0145":"N","\u1E4A":"N","\u1E48":"N","\u0220":"N","\u019D":"N","\uA790":"N","\uA7A4":"N","\u01CA":"NJ","\u01CB":"Nj","\u24C4":"O","\uFF2F":"O","\u00D2":"O","\u00D3":"O","\u00D4":"O","\u1ED2":"O","\u1ED0":"O","\u1ED6":"O","\u1ED4":"O","\u00D5":"O","\u1E4C":"O","\u022C":"O","\u1E4E":"O","\u014C":"O","\u1E50":"O","\u1E52":"O","\u014E":"O","\u022E":"O","\u0230":"O","\u00D6":"O","\u022A":"O","\u1ECE":"O","\u0150":"O","\u01D1":"O","\u020C":"O","\u020E":"O","\u01A0":"O","\u1EDC":"O","\u1EDA":"O","\u1EE0":"O","\u1EDE":"O","\u1EE2":"O","\u1ECC":"O","\u1ED8":"O","\u01EA":"O","\u01EC":"O","\u00D8":"O","\u01FE":"O","\u0186":"O","\u019F":"O","\uA74A":"O","\uA74C":"O","\u01A2":"OI","\uA74E":"OO","\u0222":"OU","\u24C5":"P","\uFF30":"P","\u1E54":"P","\u1E56":"P","\u01A4":"P","\u2C63":"P","\uA750":"P","\uA752":"P","\uA754":"P","\u24C6":"Q","\uFF31":"Q","\uA756":"Q","\uA758":"Q","\u024A":"Q","\u24C7":"R","\uFF32":"R","\u0154":"R","\u1E58":"R","\u0158":"R","\u0210":"R","\u0212":"R","\u1E5A":"R","\u1E5C":"R","\u0156":"R","\u1E5E":"R","\u024C":"R","\u2C64":"R","\uA75A":"R","\uA7A6":"R","\uA782":"R","\u24C8":"S","\uFF33":"S","\u1E9E":"S","\u015A":"S","\u1E64":"S","\u015C":"S","\u1E60":"S","\u0160":"S","\u1E66":"S","\u1E62":"S","\u1E68":"S","\u0218":"S","\u015E":"S","\u2C7E":"S","\uA7A8":"S","\uA784":"S","\u24C9":"T","\uFF34":"T","\u1E6A":"T","\u0164":"T","\u1E6C":"T","\u021A":"T","\u0162":"T","\u1E70":"T","\u1E6E":"T","\u0166":"T","\u01AC":"T","\u01AE":"T","\u023E":"T","\uA786":"T","\uA728":"TZ","\u24CA":"U","\uFF35":"U","\u00D9":"U","\u00DA":"U","\u00DB":"U","\u0168":"U","\u1E78":"U","\u016A":"U","\u1E7A":"U","\u016C":"U","\u00DC":"U","\u01DB":"U","\u01D7":"U","\u01D5":"U","\u01D9":"U","\u1EE6":"U","\u016E":"U","\u0170":"U","\u01D3":"U","\u0214":"U","\u0216":"U","\u01AF":"U","\u1EEA":"U","\u1EE8":"U","\u1EEE":"U","\u1EEC":"U","\u1EF0":"U","\u1EE4":"U","\u1E72":"U","\u0172":"U","\u1E76":"U","\u1E74":"U","\u0244":"U","\u24CB":"V","\uFF36":"V","\u1E7C":"V","\u1E7E":"V","\u01B2":"V","\uA75E":"V","\u0245":"V","\uA760":"VY","\u24CC":"W","\uFF37":"W","\u1E80":"W","\u1E82":"W","\u0174":"W","\u1E86":"W","\u1E84":"W","\u1E88":"W","\u2C72":"W","\u24CD":"X","\uFF38":"X","\u1E8A":"X","\u1E8C":"X","\u24CE":"Y","\uFF39":"Y","\u1EF2":"Y","\u00DD":"Y","\u0176":"Y","\u1EF8":"Y","\u0232":"Y","\u1E8E":"Y","\u0178":"Y","\u1EF6":"Y","\u1EF4":"Y","\u01B3":"Y","\u024E":"Y","\u1EFE":"Y","\u24CF":"Z","\uFF3A":"Z","\u0179":"Z","\u1E90":"Z","\u017B":"Z","\u017D":"Z","\u1E92":"Z","\u1E94":"Z","\u01B5":"Z","\u0224":"Z","\u2C7F":"Z","\u2C6B":"Z","\uA762":"Z","\u24D0":"a","\uFF41":"a","\u1E9A":"a","\u00E0":"a","\u00E1":"a","\u00E2":"a","\u1EA7":"a","\u1EA5":"a","\u1EAB":"a","\u1EA9":"a","\u00E3":"a","\u0101":"a","\u0103":"a","\u1EB1":"a","\u1EAF":"a","\u1EB5":"a","\u1EB3":"a","\u0227":"a","\u01E1":"a","\u00E4":"a","\u01DF":"a","\u1EA3":"a","\u00E5":"a","\u01FB":"a","\u01CE":"a","\u0201":"a","\u0203":"a","\u1EA1":"a","\u1EAD":"a","\u1EB7":"a","\u1E01":"a","\u0105":"a","\u2C65":"a","\u0250":"a","\uA733":"aa","\u00E6":"ae","\u01FD":"ae","\u01E3":"ae","\uA735":"ao","\uA737":"au","\uA739":"av","\uA73B":"av","\uA73D":"ay","\u24D1":"b","\uFF42":"b","\u1E03":"b","\u1E05":"b","\u1E07":"b","\u0180":"b","\u0183":"b","\u0253":"b","\u24D2":"c","\uFF43":"c","\u0107":"c","\u0109":"c","\u010B":"c","\u010D":"c","\u00E7":"c","\u1E09":"c","\u0188":"c","\u023C":"c","\uA73F":"c","\u2184":"c","\u24D3":"d","\uFF44":"d","\u1E0B":"d","\u010F":"d","\u1E0D":"d","\u1E11":"d","\u1E13":"d","\u1E0F":"d","\u0111":"d","\u018C":"d","\u0256":"d","\u0257":"d","\uA77A":"d","\u01F3":"dz","\u01C6":"dz","\u24D4":"e","\uFF45":"e","\u00E8":"e","\u00E9":"e","\u00EA":"e","\u1EC1":"e","\u1EBF":"e","\u1EC5":"e","\u1EC3":"e","\u1EBD":"e","\u0113":"e","\u1E15":"e","\u1E17":"e","\u0115":"e","\u0117":"e","\u00EB":"e","\u1EBB":"e","\u011B":"e","\u0205":"e","\u0207":"e","\u1EB9":"e","\u1EC7":"e","\u0229":"e","\u1E1D":"e","\u0119":"e","\u1E19":"e","\u1E1B":"e","\u0247":"e","\u025B":"e","\u01DD":"e","\u24D5":"f","\uFF46":"f","\u1E1F":"f","\u0192":"f","\uA77C":"f","\u24D6":"g","\uFF47":"g","\u01F5":"g","\u011D":"g","\u1E21":"g","\u011F":"g","\u0121":"g","\u01E7":"g","\u0123":"g","\u01E5":"g","\u0260":"g","\uA7A1":"g","\u1D79":"g","\uA77F":"g","\u24D7":"h","\uFF48":"h","\u0125":"h","\u1E23":"h","\u1E27":"h","\u021F":"h","\u1E25":"h","\u1E29":"h","\u1E2B":"h","\u1E96":"h","\u0127":"h","\u2C68":"h","\u2C76":"h","\u0265":"h","\u0195":"hv","\u24D8":"i","\uFF49":"i","\u00EC":"i","\u00ED":"i","\u00EE":"i","\u0129":"i","\u012B":"i","\u012D":"i","\u00EF":"i","\u1E2F":"i","\u1EC9":"i","\u01D0":"i","\u0209":"i","\u020B":"i","\u1ECB":"i","\u012F":"i","\u1E2D":"i","\u0268":"i","\u0131":"i","\u24D9":"j","\uFF4A":"j","\u0135":"j","\u01F0":"j","\u0249":"j","\u24DA":"k","\uFF4B":"k","\u1E31":"k","\u01E9":"k","\u1E33":"k","\u0137":"k","\u1E35":"k","\u0199":"k","\u2C6A":"k","\uA741":"k","\uA743":"k","\uA745":"k","\uA7A3":"k","\u24DB":"l","\uFF4C":"l","\u0140":"l","\u013A":"l","\u013E":"l","\u1E37":"l","\u1E39":"l","\u013C":"l","\u1E3D":"l","\u1E3B":"l","\u017F":"l","\u0142":"l","\u019A":"l","\u026B":"l","\u2C61":"l","\uA749":"l","\uA781":"l","\uA747":"l","\u01C9":"lj","\u24DC":"m","\uFF4D":"m","\u1E3F":"m","\u1E41":"m","\u1E43":"m","\u0271":"m","\u026F":"m","\u24DD":"n","\uFF4E":"n","\u01F9":"n","\u0144":"n","\u00F1":"n","\u1E45":"n","\u0148":"n","\u1E47":"n","\u0146":"n","\u1E4B":"n","\u1E49":"n","\u019E":"n","\u0272":"n","\u0149":"n","\uA791":"n","\uA7A5":"n","\u01CC":"nj","\u24DE":"o","\uFF4F":"o","\u00F2":"o","\u00F3":"o","\u00F4":"o","\u1ED3":"o","\u1ED1":"o","\u1ED7":"o","\u1ED5":"o","\u00F5":"o","\u1E4D":"o","\u022D":"o","\u1E4F":"o","\u014D":"o","\u1E51":"o","\u1E53":"o","\u014F":"o","\u022F":"o","\u0231":"o","\u00F6":"o","\u022B":"o","\u1ECF":"o","\u0151":"o","\u01D2":"o","\u020D":"o","\u020F":"o","\u01A1":"o","\u1EDD":"o","\u1EDB":"o","\u1EE1":"o","\u1EDF":"o","\u1EE3":"o","\u1ECD":"o","\u1ED9":"o","\u01EB":"o","\u01ED":"o","\u00F8":"o","\u01FF":"o","\u0254":"o","\uA74B":"o","\uA74D":"o","\u0275":"o","\u01A3":"oi","\u0223":"ou","\uA74F":"oo","\u24DF":"p","\uFF50":"p","\u1E55":"p","\u1E57":"p","\u01A5":"p","\u1D7D":"p","\uA751":"p","\uA753":"p","\uA755":"p","\u24E0":"q","\uFF51":"q","\u024B":"q","\uA757":"q","\uA759":"q","\u24E1":"r","\uFF52":"r","\u0155":"r","\u1E59":"r","\u0159":"r","\u0211":"r","\u0213":"r","\u1E5B":"r","\u1E5D":"r","\u0157":"r","\u1E5F":"r","\u024D":"r","\u027D":"r","\uA75B":"r","\uA7A7":"r","\uA783":"r","\u24E2":"s","\uFF53":"s","\u00DF":"s","\u015B":"s","\u1E65":"s","\u015D":"s","\u1E61":"s","\u0161":"s","\u1E67":"s","\u1E63":"s","\u1E69":"s","\u0219":"s","\u015F":"s","\u023F":"s","\uA7A9":"s","\uA785":"s","\u1E9B":"s","\u24E3":"t","\uFF54":"t","\u1E6B":"t","\u1E97":"t","\u0165":"t","\u1E6D":"t","\u021B":"t","\u0163":"t","\u1E71":"t","\u1E6F":"t","\u0167":"t","\u01AD":"t","\u0288":"t","\u2C66":"t","\uA787":"t","\uA729":"tz","\u24E4":"u","\uFF55":"u","\u00F9":"u","\u00FA":"u","\u00FB":"u","\u0169":"u","\u1E79":"u","\u016B":"u","\u1E7B":"u","\u016D":"u","\u00FC":"u","\u01DC":"u","\u01D8":"u","\u01D6":"u","\u01DA":"u","\u1EE7":"u","\u016F":"u","\u0171":"u","\u01D4":"u","\u0215":"u","\u0217":"u","\u01B0":"u","\u1EEB":"u","\u1EE9":"u","\u1EEF":"u","\u1EED":"u","\u1EF1":"u","\u1EE5":"u","\u1E73":"u","\u0173":"u","\u1E77":"u","\u1E75":"u","\u0289":"u","\u24E5":"v","\uFF56":"v","\u1E7D":"v","\u1E7F":"v","\u028B":"v","\uA75F":"v","\u028C":"v","\uA761":"vy","\u24E6":"w","\uFF57":"w","\u1E81":"w","\u1E83":"w","\u0175":"w","\u1E87":"w","\u1E85":"w","\u1E98":"w","\u1E89":"w","\u2C73":"w","\u24E7":"x","\uFF58":"x","\u1E8B":"x","\u1E8D":"x","\u24E8":"y","\uFF59":"y","\u1EF3":"y","\u00FD":"y","\u0177":"y","\u1EF9":"y","\u0233":"y","\u1E8F":"y","\u00FF":"y","\u1EF7":"y","\u1E99":"y","\u1EF5":"y","\u01B4":"y","\u024F":"y","\u1EFF":"y","\u24E9":"z","\uFF5A":"z","\u017A":"z","\u1E91":"z","\u017C":"z","\u017E":"z","\u1E93":"z","\u1E95":"z","\u01B6":"z","\u0225":"z","\u0240":"z","\u2C6C":"z","\uA763":"z"};

    $document = $(document);

    nextUid=(function() { var counter=1; return function() { return counter++; }; }());


    function stripDiacritics(str) {
        var ret, i, l, c;

        if (!str || str.length < 1) return str;

        ret = "";
        for (i = 0, l = str.length; i < l; i++) {
            c = str.charAt(i);
            ret += DIACRITICS[c] || c;
        }
        return ret;
    }

    function indexOf(value, array) {
        var i = 0, l = array.length;
        for (; i < l; i = i + 1) {
            if (equal(value, array[i])) return i;
        }
        return -1;
    }

    function measureScrollbar () {
        var $template = $( MEASURE_SCROLLBAR_TEMPLATE );
        $template.appendTo('body');

        var dim = {
            width: $template.width() - $template[0].clientWidth,
            height: $template.height() - $template[0].clientHeight
        };
        $template.remove();

        return dim;
    }

    /**
     * Compares equality of a and b
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        // Check whether 'a' or 'b' is a string (primitive or object).
        // The concatenation of an empty string (+'') converts its argument to a string's primitive.
        if (a.constructor === String) return a+'' === b+''; // a+'' - in case 'a' is a String object
        if (b.constructor === String) return b+'' === a+''; // b+'' - in case 'b' is a String object
        return false;
    }

    /**
     * Splits the string into an array of values, trimming each value. An empty array is returned for nulls or empty
     * strings
     * @param string
     * @param separator
     */
    function splitVal(string, separator) {
        var val, i, l;
        if (string === null || string.length < 1) return [];
        val = string.split(separator);
        for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $.trim(val[i]);
        return val;
    }

    function getSideBorderPadding(element) {
        return element.outerWidth(false) - element.width();
    }

    function installKeyUpChangeEvent(element) {
        var key="keyup-change-value";
        element.on("keydown", function () {
            if ($.data(element, key) === undefined) {
                $.data(element, key, element.val());
            }
        });
        element.on("keyup", function () {
            var val= $.data(element, key);
            if (val !== undefined && element.val() !== val) {
                $.removeData(element, key);
                element.trigger("keyup-change");
            }
        });
    }

    $document.on("mousemove", function (e) {
        lastMousePosition.x = e.pageX;
        lastMousePosition.y = e.pageY;
    });

    /**
     * filters mouse events so an event is fired only if the mouse moved.
     *
     * filters out mouse events that occur when mouse is stationary but
     * the elements under the pointer are scrolled.
     */
    function installFilteredMouseMove(element) {
        element.on("mousemove", function (e) {
            var lastpos = lastMousePosition;
            if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
                $(e.target).trigger("mousemove-filtered", e);
            }
        });
    }

    /**
     * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
     * within the last quietMillis milliseconds.
     *
     * @param quietMillis number of milliseconds to wait before invoking fn
     * @param fn function to be debounced
     * @param ctx object to be used as this reference within fn
     * @return debounced version of fn
     */
    function debounce(quietMillis, fn, ctx) {
        ctx = ctx || undefined;
        var timeout;
        return function () {
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function() {
                fn.apply(ctx, args);
            }, quietMillis);
        };
    }

    /**
     * A simple implementation of a thunk
     * @param formula function used to lazily initialize the thunk
     * @return {Function}
     */
    function thunk(formula) {
        var evaluated = false,
            value;
        return function() {
            if (evaluated === false) { value = formula(); evaluated = true; }
            return value;
        };
    };

    function installDebouncedScroll(threshold, element) {
        var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
        element.on("scroll", function (e) {
            if (indexOf(e.target, element.get()) >= 0) notify(e);
        });
    }

    function focus($el) {
        if ($el[0] === document.activeElement) return;

        /* set the focus in a 0 timeout - that way the focus is set after the processing
            of the current event has finished - which seems like the only reliable way
            to set focus */
        window.setTimeout(function() {
            var el=$el[0], pos=$el.val().length, range;

            $el.focus();

            /* make sure el received focus so we do not error out when trying to manipulate the caret.
                sometimes modals or others listeners may steal it after its set */
            if ($el.is(":visible") && el === document.activeElement) {

                /* after the focus is set move the caret to the end, necessary when we val()
                    just before setting focus */
                if(el.setSelectionRange)
                {
                    el.setSelectionRange(pos, pos);
                }
                else if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                }
            }
        }, 0);
    }

    function getCursorInfo(el) {
        el = $(el)[0];
        var offset = 0;
        var length = 0;
        if ('selectionStart' in el) {
            offset = el.selectionStart;
            length = el.selectionEnd - offset;
        } else if ('selection' in document) {
            el.focus();
            var sel = document.selection.createRange();
            length = document.selection.createRange().text.length;
            sel.moveStart('character', -el.value.length);
            offset = sel.text.length - length;
        }
        return { offset: offset, length: length };
    }

    function killEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    function killEventImmediately(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function measureTextWidth(e) {
        if (!sizer){
            var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
            sizer = $(document.createElement("div")).css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                display: "none",
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                fontStyle: style.fontStyle,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                textTransform: style.textTransform,
                whiteSpace: "nowrap"
            });
            sizer.attr("class","select2-sizer");
            $("body").append(sizer);
        }
        sizer.text(e.val());
        return sizer.width();
    }

    function syncCssClasses(dest, src, adapter) {
        var classes, replacements = [], adapted;

        classes = dest.attr("class");
        if (classes) {
            classes = '' + classes; // for IE which returns object
            $(classes.split(" ")).each2(function() {
                if (this.indexOf("select2-") === 0) {
                    replacements.push(this);
                }
            });
        }
        classes = src.attr("class");
        if (classes) {
            classes = '' + classes; // for IE which returns object
            $(classes.split(" ")).each2(function() {
                if (this.indexOf("select2-") !== 0) {
                    adapted = adapter(this);
                    if (adapted) {
                        replacements.push(adapted);
                    }
                }
            });
        }
        dest.attr("class", replacements.join(" "));
    }


    function markMatch(text, term, markup, escapeMarkup) {
        var match=stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
            tl=term.length;

        if (match<0) {
            markup.push(escapeMarkup(text));
            return;
        }

        markup.push(escapeMarkup(text.substring(0, match)));
        markup.push("<span class='select2-match'>");
        markup.push(escapeMarkup(text.substring(match, match + tl)));
        markup.push("</span>");
        markup.push(escapeMarkup(text.substring(match + tl, text.length)));
    }

    function defaultEscapeMarkup(markup) {
        var replace_map = {
            '\\': '&#92;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#47;'
        };

        return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
            return replace_map[match];
        });
    }

    /**
     * Produces an ajax-based query function
     *
     * @param options object containing configuration paramters
     * @param options.params parameter map for the transport ajax call, can contain such options as cache, jsonpCallback, etc. see $.ajax
     * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
     * @param options.url url for the data
     * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
     * @param options.dataType request data type: ajax, jsonp, other datatatypes supported by jQuery's $.ajax function or the transport function if specified
     * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
     * @param options.results a function(remoteData, pageNumber) that converts data returned form the remote request to the format expected by Select2.
     *      The expected format is an object containing the following keys:
     *      results array of objects that will be used as choices
     *      more (optional) boolean indicating whether there are more results available
     *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
     */
    function ajax(options) {
        var timeout, // current scheduled but not yet executed request
            handler = null,
            quietMillis = options.quietMillis || 100,
            ajaxUrl = options.url,
            self = this;

        return function (query) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                var data = options.data, // ajax data function
                    url = ajaxUrl, // ajax url string or function
                    transport = options.transport || $.fn.select2.ajaxDefaults.transport,
                    // deprecated - to be removed in 4.0  - use params instead
                    deprecated = {
                        type: options.type || 'GET', // set type of request (GET or POST)
                        cache: options.cache || false,
                        jsonpCallback: options.jsonpCallback||undefined,
                        dataType: options.dataType||"json"
                    },
                    params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);

                data = data ? data.call(self, query.term, query.page, query.context) : null;
                url = (typeof url === 'function') ? url.call(self, query.term, query.page, query.context) : url;

                if (handler) { handler.abort(); }

                if (options.params) {
                    if ($.isFunction(options.params)) {
                        $.extend(params, options.params.call(self));
                    } else {
                        $.extend(params, options.params);
                    }
                }

                $.extend(params, {
                    url: url,
                    dataType: options.dataType,
                    data: data,
                    success: function (data) {
                        // TODO - replace query.page with query so users have access to term, page, etc.
                        var results = options.results(data, query.page);
                        query.callback(results);
                    }
                });
                handler = transport.call(self, params);
            }, quietMillis);
        };
    }

    /**
     * Produces a query function that works with a local array
     *
     * @param options object containing configuration parameters. The options parameter can either be an array or an
     * object.
     *
     * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
     *
     * If the object form is used ti is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
     * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
     * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
     * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
     * the text.
     */
    function local(options) {
        var data = options, // data elements
            dataText,
            tmp,
            text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

         if ($.isArray(data)) {
            tmp = data;
            data = { results: tmp };
        }

         if ($.isFunction(data) === false) {
            tmp = data;
            data = function() { return tmp; };
        }

        var dataItem = data();
        if (dataItem.text) {
            text = dataItem.text;
            // if text is not a function we assume it to be a key name
            if (!$.isFunction(text)) {
                dataText = dataItem.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
                text = function (item) { return item[dataText]; };
            }
        }

        return function (query) {
            var t = query.term, filtered = { results: [] }, process;
            if (t === "") {
                query.callback(data());
                return;
            }

            process = function(datum, collection) {
                var group, attr;
                datum = datum[0];
                if (datum.children) {
                    group = {};
                    for (attr in datum) {
                        if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                    }
                    group.children=[];
                    $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                    if (group.children.length || query.matcher(t, text(group), datum)) {
                        collection.push(group);
                    }
                } else {
                    if (query.matcher(t, text(datum), datum)) {
                        collection.push(datum);
                    }
                }
            };

            $(data().results).each2(function(i, datum) { process(datum, filtered.results); });
            query.callback(filtered);
        };
    }

    // TODO javadoc
    function tags(data) {
        var isFunc = $.isFunction(data);
        return function (query) {
            var t = query.term, filtered = {results: []};
            $(isFunc ? data() : data).each(function () {
                var isObject = this.text !== undefined,
                    text = isObject ? this.text : this;
                if (t === "" || query.matcher(t, text)) {
                    filtered.results.push(isObject ? this : {id: this, text: this});
                }
            });
            query.callback(filtered);
        };
    }

    /**
     * Checks if the formatter function should be used.
     *
     * Throws an error if it is not a function. Returns true if it should be used,
     * false if no formatting should be performed.
     *
     * @param formatter
     */
    function checkFormatter(formatter, formatterName) {
        if ($.isFunction(formatter)) return true;
        if (!formatter) return false;
        throw new Error(formatterName +" must be a function or a falsy value");
    }

    function evaluate(val) {
        return $.isFunction(val) ? val() : val;
    }

    function countResults(results) {
        var count = 0;
        $.each(results, function(i, item) {
            if (item.children) {
                count += countResults(item.children);
            } else {
                count++;
            }
        });
        return count;
    }

    /**
     * Default tokenizer. This function uses breaks the input on substring match of any string from the
     * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
     * two options have to be defined in order for the tokenizer to work.
     *
     * @param input text user has typed so far or pasted into the search field
     * @param selection currently selected choices
     * @param selectCallback function(choice) callback tho add the choice to selection
     * @param opts select2's opts
     * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
     */
    function defaultTokenizer(input, selection, selectCallback, opts) {
        var original = input, // store the original so we can compare and know if we need to tell the search to update its text
            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
            token, // token
            index, // position at which the separator was found
            i, l, // looping variables
            separator; // the matched separator

        if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

        while (true) {
            index = -1;

            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
                separator = opts.tokenSeparators[i];
                index = input.indexOf(separator);
                if (index >= 0) break;
            }

            if (index < 0) break; // did not find any token separator in the input string, bail

            token = input.substring(0, index);
            input = input.substring(index + separator.length);

            if (token.length > 0) {
                token = opts.createSearchChoice.call(this, token, selection);
                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                    dupe = false;
                    for (i = 0, l = selection.length; i < l; i++) {
                        if (equal(opts.id(token), opts.id(selection[i]))) {
                            dupe = true; break;
                        }
                    }

                    if (!dupe) selectCallback(token);
                }
            }
        }

        if (original!==input) return input;
    }

    /**
     * Creates a new class
     *
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }

    AbstractSelect2 = clazz(Object, {

        // abstract
        bind: function (func) {
            var self = this;
            return function () {
                func.apply(self, arguments);
            };
        },

        // abstract
        init: function (opts) {
            var results, search, resultsSelector = ".select2-results";

            // prepare options
            this.opts = opts = this.prepareOpts(opts);

            this.id=opts.id;

            // destroy if called on an existing component
            if (opts.element.data("select2") !== undefined &&
                opts.element.data("select2") !== null) {
                opts.element.data("select2").destroy();
            }

            this.container = this.createContainer();

            this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
            this.containerSelector="#"+this.containerId.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
            this.container.attr("id", this.containerId);

            // cache the body so future lookups are cheap
            this.body = thunk(function() { return opts.element.closest("body"); });

            syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);

            this.container.attr("style", opts.element.attr("style"));
            this.container.css(evaluate(opts.containerCss));
            this.container.addClass(evaluate(opts.containerCssClass));

            this.elementTabIndex = this.opts.element.attr("tabindex");

            // swap container for the element
            this.opts.element
                .data("select2", this)
                .attr("tabindex", "-1")
                .before(this.container)
                .on("click.select2", killEvent); // do not leak click events

            this.container.data("select2", this);

            this.dropdown = this.container.find(".select2-drop");

            syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);

            this.dropdown.addClass(evaluate(opts.dropdownCssClass));
            this.dropdown.data("select2", this);
            this.dropdown.on("click", killEvent);

            this.results = results = this.container.find(resultsSelector);
            this.search = search = this.container.find("input.select2-input");

            this.queryCount = 0;
            this.resultsPage = 0;
            this.context = null;

            // initialize the container
            this.initContainer();

            this.container.on("click", killEvent);

            installFilteredMouseMove(this.results);
            this.dropdown.on("mousemove-filtered touchstart touchmove touchend", resultsSelector, this.bind(this.highlightUnderEvent));

            installDebouncedScroll(80, this.results);
            this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));

            // do not propagate change event from the search field out of the component
            $(this.container).on("change", ".select2-input", function(e) {e.stopPropagation();});
            $(this.dropdown).on("change", ".select2-input", function(e) {e.stopPropagation();});

            // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
            if ($.fn.mousewheel) {
                results.mousewheel(function (e, delta, deltaX, deltaY) {
                    var top = results.scrollTop();
                    if (deltaY > 0 && top - deltaY <= 0) {
                        results.scrollTop(0);
                        killEvent(e);
                    } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                        results.scrollTop(results.get(0).scrollHeight - results.height());
                        killEvent(e);
                    }
                });
            }

            installKeyUpChangeEvent(search);
            search.on("keyup-change input paste", this.bind(this.updateResults));
            search.on("focus", function () { search.addClass("select2-focused"); });
            search.on("blur", function () { search.removeClass("select2-focused");});

            this.dropdown.on("mouseup", resultsSelector, this.bind(function (e) {
                if ($(e.target).closest(".select2-result-selectable").length > 0) {
                    this.highlightUnderEvent(e);
                    this.selectHighlighted(e);
                }
            }));

            // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
            // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
            // dom it will trigger the popup close, which is not what we want
            this.dropdown.on("click mouseup mousedown", function (e) { e.stopPropagation(); });

            if ($.isFunction(this.opts.initSelection)) {
                // initialize selection based on the current value of the source element
                this.initSelection();

                // if the user has provided a function that can set selection based on the value of the source element
                // we monitor the change event on the element and trigger it, allowing for two way synchronization
                this.monitorSource();
            }

            if (opts.maximumInputLength !== null) {
                this.search.attr("maxlength", opts.maximumInputLength);
            }

            var disabled = opts.element.prop("disabled");
            if (disabled === undefined) disabled = false;
            this.enable(!disabled);

            var readonly = opts.element.prop("readonly");
            if (readonly === undefined) readonly = false;
            this.readonly(readonly);

            // Calculate size of scrollbar
            scrollBarDimensions = scrollBarDimensions || measureScrollbar();

            this.autofocus = opts.element.prop("autofocus");
            opts.element.prop("autofocus", false);
            if (this.autofocus) this.focus();

            this.nextSearchTerm = undefined;
        },

        // abstract
        destroy: function () {
            var element=this.opts.element, select2 = element.data("select2");

            this.close();

            if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }

            if (select2 !== undefined) {
                select2.container.remove();
                select2.dropdown.remove();
                element
                    .removeClass("select2-offscreen")
                    .removeData("select2")
                    .off(".select2")
                    .prop("autofocus", this.autofocus || false);
                if (this.elementTabIndex) {
                    element.attr({tabindex: this.elementTabIndex});
                } else {
                    element.removeAttr("tabindex");
                }
                element.show();
            }
        },

        // abstract
        optionToData: function(element) {
            if (element.is("option")) {
                return {
                    id:element.prop("value"),
                    text:element.text(),
                    element: element.get(),
                    css: element.attr("class"),
                    disabled: element.prop("disabled"),
                    locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true)
                };
            } else if (element.is("optgroup")) {
                return {
                    text:element.attr("label"),
                    children:[],
                    element: element.get(),
                    css: element.attr("class")
                };
            }
        },

        // abstract
        prepareOpts: function (opts) {
            var element, select, idKey, ajaxUrl, self = this;

            element = opts.element;

            if (element.get(0).tagName.toLowerCase() === "select") {
                this.select = select = opts.element;
            }

            if (select) {
                // these options are not allowed when attached to a select because they are picked up off the element itself
                $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in opts) {
                        throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                    }
                });
            }

            opts = $.extend({}, {
                populateResults: function(container, results, query) {
                    var populate, id=this.opts.id;

                    populate=function(results, container, depth) {

                        var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;

                        results = opts.sortResults(results, container, query);

                        for (i = 0, l = results.length; i < l; i = i + 1) {

                            result=results[i];

                            disabled = (result.disabled === true);
                            selectable = (!disabled) && (id(result) !== undefined);

                            compound=result.children && result.children.length > 0;

                            node=$("<li></li>");
                            node.addClass("select2-results-dept-"+depth);
                            node.addClass("select2-result");
                            node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                            if (disabled) { node.addClass("select2-disabled"); }
                            if (compound) { node.addClass("select2-result-with-children"); }
                            node.addClass(self.opts.formatResultCssClass(result));

                            label=$(document.createElement("div"));
                            label.addClass("select2-result-label");

                            formatted=opts.formatResult(result, label, query, self.opts.escapeMarkup);
                            if (formatted!==undefined) {
                                label.html(formatted);
                            }

                            node.append(label);

                            if (compound) {

                                innerContainer=$("<ul></ul>");
                                innerContainer.addClass("select2-result-sub");
                                populate(result.children, innerContainer, depth+1);
                                node.append(innerContainer);
                            }

                            node.data("select2-data", result);
                            container.append(node);
                        }
                    };

                    populate(results, container, 0);
                }
            }, $.fn.select2.defaults, opts);

            if (typeof(opts.id) !== "function") {
                idKey = opts.id;
                opts.id = function (e) { return e[idKey]; };
            }

            if ($.isArray(opts.element.data("select2Tags"))) {
                if ("tags" in opts) {
                    throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
                }
                opts.tags=opts.element.data("select2Tags");
            }

            if (select) {
                opts.query = this.bind(function (query) {
                    var data = { results: [], more: false },
                        term = query.term,
                        children, placeholderOption, process;

                    process=function(element, collection) {
                        var group;
                        if (element.is("option")) {
                            if (query.matcher(term, element.text(), element)) {
                                collection.push(self.optionToData(element));
                            }
                        } else if (element.is("optgroup")) {
                            group=self.optionToData(element);
                            element.children().each2(function(i, elm) { process(elm, group.children); });
                            if (group.children.length>0) {
                                collection.push(group);
                            }
                        }
                    };

                    children=element.children();

                    // ignore the placeholder option if there is one
                    if (this.getPlaceholder() !== undefined && children.length > 0) {
                        placeholderOption = this.getPlaceholderOption();
                        if (placeholderOption) {
                            children=children.not(placeholderOption);
                        }
                    }

                    children.each2(function(i, elm) { process(elm, data.results); });

                    query.callback(data);
                });
                // this is needed because inside val() we construct choices from options and there id is hardcoded
                opts.id=function(e) { return e.id; };
                opts.formatResultCssClass = function(data) { return data.css; };
            } else {
                if (!("query" in opts)) {

                    if ("ajax" in opts) {
                        ajaxUrl = opts.element.data("ajax-url");
                        if (ajaxUrl && ajaxUrl.length > 0) {
                            opts.ajax.url = ajaxUrl;
                        }
                        opts.query = ajax.call(opts.element, opts.ajax);
                    } else if ("data" in opts) {
                        opts.query = local(opts.data);
                    } else if ("tags" in opts) {
                        opts.query = tags(opts.tags);
                        if (opts.createSearchChoice === undefined) {
                            opts.createSearchChoice = function (term) { return {id: $.trim(term), text: $.trim(term)}; };
                        }
                        if (opts.initSelection === undefined) {
                            opts.initSelection = function (element, callback) {
                                var data = [];
                                $(splitVal(element.val(), opts.separator)).each(function () {
                                    var obj = { id: this, text: this },
                                        tags = opts.tags;
                                    if ($.isFunction(tags)) tags=tags();
                                    $(tags).each(function() { if (equal(this.id, obj.id)) { obj = this; return false; } });
                                    data.push(obj);
                                });

                                callback(data);
                            };
                        }
                    }
                }
            }
            if (typeof(opts.query) !== "function") {
                throw "query function not defined for Select2 " + opts.element.attr("id");
            }

            return opts;
        },

        /**
         * Monitor the original element for changes and update select2 accordingly
         */
        // abstract
        monitorSource: function () {
            var el = this.opts.element, sync, observer;

            el.on("change.select2", this.bind(function (e) {
                if (this.opts.element.data("select2-change-triggered") !== true) {
                    this.initSelection();
                }
            }));

            sync = this.bind(function () {

                // sync enabled state
                var disabled = el.prop("disabled");
                if (disabled === undefined) disabled = false;
                this.enable(!disabled);

                var readonly = el.prop("readonly");
                if (readonly === undefined) readonly = false;
                this.readonly(readonly);

                syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
                this.container.addClass(evaluate(this.opts.containerCssClass));

                syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
                this.dropdown.addClass(evaluate(this.opts.dropdownCssClass));

            });

            // IE8-10
            el.on("propertychange.select2", sync);

            // hold onto a reference of the callback to work around a chromium bug
            if (this.mutationCallback === undefined) {
                this.mutationCallback = function (mutations) {
                    mutations.forEach(sync);
                }
            }

            // safari, chrome, firefox, IE11
            observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
            if (observer !== undefined) {
                if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
                this.propertyObserver = new observer(this.mutationCallback);
                this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
            }
        },

        // abstract
        triggerSelect: function(data) {
            var evt = $.Event("select2-selecting", { val: this.id(data), object: data });
            this.opts.element.trigger(evt);
            return !evt.isDefaultPrevented();
        },

        /**
         * Triggers the change event on the source element
         */
        // abstract
        triggerChange: function (details) {

            details = details || {};
            details= $.extend({}, details, { type: "change", val: this.val() });
            // prevents recursive triggering
            this.opts.element.data("select2-change-triggered", true);
            this.opts.element.trigger(details);
            this.opts.element.data("select2-change-triggered", false);

            // some validation frameworks ignore the change event and listen instead to keyup, click for selects
            // so here we trigger the click event manually
            this.opts.element.click();

            // ValidationEngine ignorea the change event and listens instead to blur
            // so here we trigger the blur event manually if so desired
            if (this.opts.blurOnChange)
                this.opts.element.blur();
        },

        //abstract
        isInterfaceEnabled: function()
        {
            return this.enabledInterface === true;
        },

        // abstract
        enableInterface: function() {
            var enabled = this._enabled && !this._readonly,
                disabled = !enabled;

            if (enabled === this.enabledInterface) return false;

            this.container.toggleClass("select2-container-disabled", disabled);
            this.close();
            this.enabledInterface = enabled;

            return true;
        },

        // abstract
        enable: function(enabled) {
            if (enabled === undefined) enabled = true;
            if (this._enabled === enabled) return;
            this._enabled = enabled;

            this.opts.element.prop("disabled", !enabled);
            this.enableInterface();
        },

        // abstract
        disable: function() {
            this.enable(false);
        },

        // abstract
        readonly: function(enabled) {
            if (enabled === undefined) enabled = false;
            if (this._readonly === enabled) return false;
            this._readonly = enabled;

            this.opts.element.prop("readonly", enabled);
            this.enableInterface();
            return true;
        },

        // abstract
        opened: function () {
            return this.container.hasClass("select2-dropdown-open");
        },

        // abstract
        positionDropdown: function() {
            var $dropdown = this.dropdown,
                offset = this.container.offset(),
                height = this.container.outerHeight(false),
                width = this.container.outerWidth(false),
                dropHeight = $dropdown.outerHeight(false),
                $window = $(window),
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                viewPortRight = $window.scrollLeft() + windowWidth,
                viewportBottom = $window.scrollTop() + windowHeight,
                dropTop = offset.top + height,
                dropLeft = offset.left,
                enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
                enoughRoomAbove = (offset.top - dropHeight) >= this.body().scrollTop(),
                dropWidth = $dropdown.outerWidth(false),
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight,
                aboveNow = $dropdown.hasClass("select2-drop-above"),
                bodyOffset,
                above,
                changeDirection,
                css,
                resultsListNode;

            // always prefer the current above/below alignment, unless there is not enough room
            // @MICAH HACK FOR FIREFOX WEIRDNESS
//            if (aboveNow) {
//                above = true;
//                if (!enoughRoomAbove && enoughRoomBelow) {
//                    changeDirection = true;
//                    above = false;
//                }
//            } else {
//                above = false;
//                if (!enoughRoomBelow && enoughRoomAbove) {
//                    changeDirection = true;
//                    above = true;
//                }
//            }
            above=false;
            // @MICAH END HACK FOR FIREFOX WIERDNESS

            //if we are changing direction we need to get positions when dropdown is hidden;
            if (changeDirection) {
                $dropdown.hide();
                offset = this.container.offset();
                height = this.container.outerHeight(false);
                width = this.container.outerWidth(false);
                dropHeight = $dropdown.outerHeight(false);
                viewPortRight = $window.scrollLeft() + windowWidth;
                viewportBottom = $window.scrollTop() + windowHeight;
                dropTop = offset.top + height;
                dropLeft = offset.left;
                dropWidth = $dropdown.outerWidth(false);
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight;
                $dropdown.show();
            }

            if (this.opts.dropdownAutoWidth) {
                resultsListNode = $('.select2-results', $dropdown)[0];
                $dropdown.addClass('select2-drop-auto-width');
                $dropdown.css('width', '');
                // Add scrollbar width to dropdown if vertical scrollbar is present
                dropWidth = $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
                dropWidth > width ? width = dropWidth : dropWidth = width;
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight;
            }
            else {
                this.container.removeClass('select2-drop-auto-width');
            }

            //console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
            //console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body().scrollTop(), "enough?", enoughRoomAbove);

            // fix positioning when body has an offset and is not position: static
            if (this.body().css('position') !== 'static') {
                bodyOffset = this.body().offset();
                dropTop -= bodyOffset.top;
                dropLeft -= bodyOffset.left;
            }

            if (!enoughRoomOnRight) {
               dropLeft = offset.left + width - dropWidth;
            }

            css =  {
                left: dropLeft,
                width: width
            };

            if (above) {
                css.bottom = windowHeight - offset.top;
                css.top = 'auto';
                this.container.addClass("select2-drop-above");
                $dropdown.addClass("select2-drop-above");
            }
            else {
                css.top = dropTop;
                css.bottom = 'auto';
                this.container.removeClass("select2-drop-above");
                $dropdown.removeClass("select2-drop-above");
            }
            css = $.extend(css, evaluate(this.opts.dropdownCss));

            $dropdown.css(css);
        },

        // abstract
        shouldOpen: function() {
            var event;

            if (this.opened()) return false;

            if (this._enabled === false || this._readonly === true) return false;

            event = $.Event("select2-opening");
            this.opts.element.trigger(event);
            return !event.isDefaultPrevented();
        },

        // abstract
        clearDropdownAlignmentPreference: function() {
            // clear the classes used to figure out the preference of where the dropdown should be opened
            this.container.removeClass("select2-drop-above");
            this.dropdown.removeClass("select2-drop-above");
        },

        /**
         * Opens the dropdown
         *
         * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
         * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
         */
        // abstract
        open: function () {

            if (!this.shouldOpen()) return false;

            this.opening();

            return true;
        },

        /**
         * Performs the opening of the dropdown
         */
        // abstract
        opening: function() {
            var cid = this.containerId,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid,
                mask;

            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

            this.clearDropdownAlignmentPreference();

            if(this.dropdown[0] !== this.body().children().last()[0]) {
                this.dropdown.detach().appendTo(this.body());
            }

            // create the dropdown mask if doesnt already exist
            mask = $("#select2-drop-mask");
            if (mask.length == 0) {
                mask = $(document.createElement("div"));
                mask.attr("id","select2-drop-mask").attr("class","select2-drop-mask");
                mask.hide();
                mask.appendTo(this.body());
                mask.on("mousedown touchstart click", function (e) {
                    var dropdown = $("#select2-drop"), self;
                    if (dropdown.length > 0) {
                        self=dropdown.data("select2");
                        if (self.opts.selectOnBlur) {
                            self.selectHighlighted({noFocus: true});
                        }
                        self.close({focus:true});
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }

            // ensure the mask is always right before the dropdown
            if (this.dropdown.prev()[0] !== mask[0]) {
                this.dropdown.before(mask);
            }

            // move the global id to the correct dropdown
            $("#select2-drop").removeAttr("id");
            this.dropdown.attr("id", "select2-drop");

            // show the elements
            mask.show();

            this.positionDropdown();
            this.dropdown.show();
            this.positionDropdown();

            this.dropdown.addClass("select2-drop-active");

            // attach listeners to events that can change the position of the container and thus require
            // the position of the dropdown to be updated as well so it does not come unglued from the container
            var that = this;
            this.container.parents().add(window).each(function () {
                $(this).on(resize+" "+scroll+" "+orient, function (e) {
                    that.positionDropdown();
                });
            });


        },

        // abstract
        close: function () {
            if (!this.opened()) return;

            var cid = this.containerId,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid;

            // unbind event listeners
            this.container.parents().add(window).each(function () { $(this).off(scroll).off(resize).off(orient); });

            this.clearDropdownAlignmentPreference();

            $("#select2-drop-mask").hide();
            this.dropdown.removeAttr("id"); // only the active dropdown has the select2-drop id
            this.dropdown.hide();
            this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
            this.results.empty();


            this.clearSearch();
            this.search.removeClass("select2-active");
            this.opts.element.trigger($.Event("select2-close"));
        },

        /**
         * Opens control, sets input value, and updates results.
         */
        // abstract
        externalSearch: function (term) {
            this.open();
            this.search.val(term);
            this.updateResults(false);
        },

        // abstract
        clearSearch: function () {

        },

        //abstract
        getMaximumSelectionSize: function() {
            return evaluate(this.opts.maximumSelectionSize);
        },

        // abstract
        ensureHighlightVisible: function () {
            var results = this.results, children, index, child, hb, rb, y, more;

            index = this.highlight();

            if (index < 0) return;

            if (index == 0) {

                // if the first element is highlighted scroll all the way to the top,
                // that way any unselectable headers above it will also be scrolled
                // into view

                results.scrollTop(0);
                return;
            }

            children = this.findHighlightableChoices().find('.select2-result-label');

            child = $(children[index]);

            hb = child.offset().top + child.outerHeight(true);

            // if this is the last child lets also make sure select2-more-results is visible
            if (index === children.length - 1) {
                more = results.find("li.select2-more-results");
                if (more.length > 0) {
                    hb = more.offset().top + more.outerHeight(true);
                }
            }

            rb = results.offset().top + results.outerHeight(true);
            if (hb > rb) {
                results.scrollTop(results.scrollTop() + (hb - rb));
            }
            y = child.offset().top - results.offset().top;

            // make sure the top of the element is visible
            if (y < 0 && child.css('display') != 'none' ) {
                results.scrollTop(results.scrollTop() + y); // y is negative
            }
        },

        // abstract
        findHighlightableChoices: function() {
            return this.results.find(".select2-result-selectable:not(.select2-disabled, .select2-selected)");
        },

        // abstract
        moveHighlight: function (delta) {
            var choices = this.findHighlightableChoices(),
                index = this.highlight();

            while (index > -1 && index < choices.length) {
                index += delta;
                var choice = $(choices[index]);
                if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
                    this.highlight(index);
                    break;
                }
            }
        },

        // abstract
        highlight: function (index) {
            var choices = this.findHighlightableChoices(),
                choice,
                data;

            if (arguments.length === 0) {
                return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
            }

            if (index >= choices.length) index = choices.length - 1;
            if (index < 0) index = 0;

            this.removeHighlight();

            choice = $(choices[index]);
            choice.addClass("select2-highlighted");

            this.ensureHighlightVisible();

            data = choice.data("select2-data");
            if (data) {
                this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
            }
        },

        removeHighlight: function() {
            this.results.find(".select2-highlighted").removeClass("select2-highlighted");
        },

        // abstract
        countSelectableResults: function() {
            return this.findHighlightableChoices().length;
        },

        // abstract
        highlightUnderEvent: function (event) {
            var el = $(event.target).closest(".select2-result-selectable");
            if (el.length > 0 && !el.is(".select2-highlighted")) {
                var choices = this.findHighlightableChoices();
                this.highlight(choices.index(el));
            } else if (el.length == 0) {
                // if we are over an unselectable item remove all highlights
                this.removeHighlight();
            }
        },

        // abstract
        loadMoreIfNeeded: function () {
            var results = this.results,
                more = results.find("li.select2-more-results"),
                below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
                page = this.resultsPage + 1,
                self=this,
                term=this.search.val(),
                context=this.context;

            if (more.length === 0) return;
            below = more.offset().top - results.offset().top - results.height();

            if (below <= this.opts.loadMorePadding) {
                more.addClass("select2-active");
                this.opts.query({
                        element: this.opts.element,
                        term: term,
                        page: page,
                        context: context,
                        matcher: this.opts.matcher,
                        callback: this.bind(function (data) {

                    // ignore a response if the select2 has been closed before it was received
                    if (!self.opened()) return;


                    self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});
                    self.postprocessResults(data, false, false);

                    if (data.more===true) {
                        more.detach().appendTo(results).text(self.opts.formatLoadMore(page+1));
                        window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                    } else {
                        more.remove();
                    }
                    self.positionDropdown();
                    self.resultsPage = page;
                    self.context = data.context;
                    this.opts.element.trigger({ type: "select2-loaded", items: data });
                })});
            }
        },

        /**
         * Default tokenizer function which does nothing
         */
        tokenize: function() {

        },

        /**
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResults: function (initial) {
            var search = this.search,
                results = this.results,
                opts = this.opts,
                data,
                self = this,
                input,
                term = search.val(),
                lastTerm = $.data(this.container, "select2-last-term"),
                // sequence number used to drop out-of-order responses
                queryNumber;

            // prevent duplicate queries against the same term
            if (initial !== true && lastTerm && equal(term, lastTerm)) return;

            $.data(this.container, "select2-last-term", term);

            // if the search is currently hidden we do not alter the results
            if (initial !== true && (this.showSearchInput === false || !this.opened())) {
                return;
            }

            function postRender() {
                search.removeClass("select2-active");
                self.positionDropdown();
            }

            function render(html) {
                results.html(html);
                postRender();
            }

            queryNumber = ++this.queryCount;

            var maxSelSize = this.getMaximumSelectionSize();
            if (maxSelSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
                    render("<li class='select2-selection-limit'>" + opts.formatSelectionTooBig(maxSelSize) + "</li>");
                    return;
                }
            }

            if (search.val().length < opts.minimumInputLength) {
                if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                    render("<li class='select2-no-results'>" + opts.formatInputTooShort(search.val(), opts.minimumInputLength) + "</li>");
                } else {
                    render("");
                }
                if (initial && this.showSearch) this.showSearch(true);
                return;
            }

            if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
                if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
                    render("<li class='select2-no-results'>" + opts.formatInputTooLong(search.val(), opts.maximumInputLength) + "</li>");
                } else {
                    render("");
                }
                return;
            }

            if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
                render("<li class='select2-searching'>" + opts.formatSearching() + "</li>");
            }

            search.addClass("select2-active");

            this.removeHighlight();

            // give the tokenizer a chance to pre-process the input
            input = this.tokenize();
            if (input != undefined && input != null) {
                search.val(input);
            }

            this.resultsPage = 1;

            opts.query({
                element: opts.element,
                    term: search.val(),
                    page: this.resultsPage,
                    context: null,
                    matcher: opts.matcher,
                    callback: this.bind(function (data) {
                var def; // default choice

                // ignore old responses
                if (queryNumber != this.queryCount) {
                  return;
                }

                // ignore a response if the select2 has been closed before it was received
                if (!this.opened()) {
                    this.search.removeClass("select2-active");
                    return;
                }

                // save context, if any
                this.context = (data.context===undefined) ? null : data.context;
                // create a default choice and prepend it to the list
                if (this.opts.createSearchChoice && search.val() !== "") {
                    def = this.opts.createSearchChoice.call(self, search.val(), data.results);
                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
                        if ($(data.results).filter(
                            function () {
                                return equal(self.id(this), self.id(def));
                            }).length === 0) {
                            data.results.unshift(def);
                        }
                    }
                }

                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
                    render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
                    return;
                }

                results.empty();
                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
                    results.append("<li class='select2-more-results'>" + self.opts.escapeMarkup(opts.formatLoadMore(this.resultsPage)) + "</li>");
                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                }

                this.postprocessResults(data, initial);

                postRender();

                this.opts.element.trigger({ type: "select2-loaded", items: data });
            })});
        },

        // abstract
        cancel: function () {
            this.close();
        },

        // abstract
        blur: function () {
            // if selectOnBlur == true, select the currently highlighted option
            if (this.opts.selectOnBlur)
                this.selectHighlighted({noFocus: true});

            this.close();
            this.container.removeClass("select2-container-active");
            // synonymous to .is(':focus'), which is available in jquery >= 1.6
            if (this.search[0] === document.activeElement) { this.search.blur(); }
            this.clearSearch();
            this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
        },

        // abstract
        focusSearch: function () {
            focus(this.search);
        },

        // abstract
        selectHighlighted: function (options) {
            var index=this.highlight(),
                highlighted=this.results.find(".select2-highlighted"),
                data = highlighted.closest('.select2-result').data("select2-data");

            if (data) {
                this.highlight(index);
                this.onSelect(data, options);
            } else if (options && options.noFocus) {
                this.close();
            }
        },

        // abstract
        getPlaceholder: function () {
            var placeholderOption;
            return this.opts.element.attr("placeholder") ||
                this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
                this.opts.element.data("placeholder") ||
                this.opts.placeholder ||
                ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined);
        },

        // abstract
        getPlaceholderOption: function() {
            if (this.select) {
                var firstOption = this.select.children('option').first();
                if (this.opts.placeholderOption !== undefined ) {
                    //Determine the placeholder option based on the specified placeholderOption setting
                    return (this.opts.placeholderOption === "first" && firstOption) ||
                           (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select));
                } else if (firstOption.text() === "" && firstOption.val() === "") {
                    //No explicit placeholder option specified, use the first if it's blank
                    return firstOption;
                }
            }
        },

        /**
         * Get the desired width for the container element.  This is
         * derived first from option `width` passed to select2, then
         * the inline 'style' on the original element, and finally
         * falls back to the jQuery calculated element width.
         */
        // abstract
        initContainerWidth: function () {
            function resolveContainerWidth() {
                var style, attrs, matches, i, l, attr;

                if (this.opts.width === "off") {
                    return null;
                } else if (this.opts.width === "element"){
                    return this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px';
                } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                    // check if there is inline style on the element that contains width
                    style = this.opts.element.attr('style');
                    if (style !== undefined) {
                        attrs = style.split(';');
                        for (i = 0, l = attrs.length; i < l; i = i + 1) {
                            attr = attrs[i].replace(/\s/g, '');
                            matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
                            if (matches !== null && matches.length >= 1)
                                return matches[1];
                        }
                    }

                    if (this.opts.width === "resolve") {
                        // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                        // when attached to input type=hidden or elements hidden via css
                        style = this.opts.element.css('width');
                        if (style.indexOf("%") > 0) return style;

                        // finally, fallback on the calculated width of the element
                        return (this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px');
                    }

                    return null;
                } else if ($.isFunction(this.opts.width)) {
                    return this.opts.width();
                } else {
                    return this.opts.width;
               }
            };

            var width = resolveContainerWidth.call(this);
            if (width !== null) {
                this.container.css("width", width);
            }
        }
    });

    SingleSelect2 = clazz(AbstractSelect2, {

        // single

        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container"
            }).html([
                "<a href='javascript:void(0)' onclick='return false;' class='select2-choice' tabindex='-1'>",
                "   <span class='select2-chosen'>&nbsp;</span><abbr class='select2-search-choice-close'></abbr>",
                "   <span class='select2-arrow'><b></b></span>",
                "</a>",
                "<input class='select2-focusser select2-offscreen' type='text'/>",
                "<div class='select2-drop select2-display-none'>",
                "   <div class='select2-search'>",
                "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'/>",
                "   </div>",
                "   <ul class='select2-results'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // single
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.focusser.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // single
        opening: function () {
            var el, range, len;

            if (this.opts.minimumResultsForSearch >= 0) {
                this.showSearch(true);
            }

            this.parent.opening.apply(this, arguments);

            if (this.showSearchInput !== false) {
                // IE appends focusser.val() at the end of field :/ so we manually insert it at the beginning using a range
                // all other browsers handle this just fine

                this.search.val(this.focusser.val());
            }
            this.search.focus();
            // move the cursor to the end after focussing, otherwise it will be at the beginning and
            // new text will appear *before* focusser.val()
            el = this.search.get(0);
            if (el.createTextRange) {
                range = el.createTextRange();
                range.collapse(false);
                range.select();
            } else if (el.setSelectionRange) {
                len = this.search.val().length;
                el.setSelectionRange(len, len);
            }

            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() === "") {
                if(this.nextSearchTerm != undefined){
                    this.search.val(this.nextSearchTerm);
                    this.search.select();
                }
            }

            this.focusser.prop("disabled", true).val("");
            this.updateResults(true);
            this.opts.element.trigger($.Event("select2-open"));
        },

        // single
        close: function (params) {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);

            params = params || {focus: true};
            this.focusser.removeAttr("disabled");

            if (params.focus) {
                this.focusser.focus();
            }
        },

        // single
        focus: function () {
            if (this.opened()) {
                this.close();
            } else {
                this.focusser.removeAttr("disabled");
                this.focusser.focus();
            }
        },

        // single
        isFocused: function () {
            return this.container.hasClass("select2-container-active");
        },

        // single
        cancel: function () {
            this.parent.cancel.apply(this, arguments);
            this.focusser.removeAttr("disabled");
            this.focusser.focus();
        },

        // single
        destroy: function() {
            $("label[for='" + this.focusser.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);
        },

        // single
        initContainer: function () {

            var selection,
                container = this.container,
                dropdown = this.dropdown;

            if (this.opts.minimumResultsForSearch < 0) {
                this.showSearch(false);
            } else {
                this.showSearch(true);
            }

            this.selection = selection = container.find(".select2-choice");

            this.focusser = container.find(".select2-focusser");

            // rewrite labels from original element to focusser
            this.focusser.attr("id", "s2id_autogen"+nextUid());

            $("label[for='" + this.opts.element.attr("id") + "']")
                .attr('for', this.focusser.attr('id'));

            this.focusser.attr("tabindex", this.elementTabIndex);

            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus: true});
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                }
            }));

            this.search.on("blur", this.bind(function(e) {
                // a workaround for chrome to keep the search field focussed when the scroll bar is used to scroll the dropdown.
                // without this the search field loses focus which is annoying
                if (document.activeElement === this.body().get(0)) {
                    window.setTimeout(this.bind(function() {
                        this.search.focus();
                    }), 0);
                }
            }));

            this.focusser.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DOWN || e.which == KEY.UP
                    || (e.which == KEY.ENTER && this.opts.openOnEnter)) {

                    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

                    this.open();
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
                    if (this.opts.allowClear) {
                        this.clear();
                    }
                    killEvent(e);
                    return;
                }
            }));


            installKeyUpChangeEvent(this.focusser);
            this.focusser.on("keyup-change input", this.bind(function(e) {
                if (this.opts.minimumResultsForSearch >= 0) {
                    e.stopPropagation();
                    if (this.opened()) return;
                    this.open();
                }
            }));

            selection.on("mousedown", "abbr", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                this.clear();
                killEventImmediately(e);
                this.close();
                this.selection.focus();
            }));

            selection.on("mousedown", this.bind(function (e) {

                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }

                if (this.opened()) {
                    this.close();
                } else if (this.isInterfaceEnabled()) {
                    this.open();
                }

                killEvent(e);
            }));

            dropdown.on("mousedown", this.bind(function() { this.search.focus(); }));

            selection.on("focus", this.bind(function(e) {
                killEvent(e);
            }));

            this.focusser.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            })).on("blur", this.bind(function() {
                if (!this.opened()) {
                    this.container.removeClass("select2-container-active");
                    this.opts.element.trigger($.Event("select2-blur"));
                }
            }));
            this.search.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");
            this.setPlaceholder();

        },

        // single
        clear: function(triggerChange) {
            var data=this.selection.data("select2-data");
            if (data) { // guard against queued quick consecutive clicks
                var evt = $.Event("select2-clearing");
                this.opts.element.trigger(evt);
                if (evt.isDefaultPrevented()) {
                    return;
                }
                var placeholderOption = this.getPlaceholderOption();
                this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
                this.selection.find(".select2-chosen").empty();
                this.selection.removeData("select2-data");
                this.setPlaceholder();

                if (triggerChange !== false){
                    this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
                    this.triggerChange({removed:data});
                }
            }
        },

        /**
         * Sets selection based on source element's value
         */
        // single
        initSelection: function () {
            var selected;
            if (this.isPlaceholderOptionSelected()) {
                this.updateSelection(null);
                this.close();
                this.setPlaceholder();
            } else {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(selected){
                    if (selected !== undefined && selected !== null) {
                        self.updateSelection(selected);
                        self.close();
                        self.setPlaceholder();
                    }
                });
            }
        },

        isPlaceholderOptionSelected: function() {
            var placeholderOption;
            if (!this.getPlaceholder()) return false; // no placeholder specified so no option should be considered
            return ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected"))
                || (this.opts.element.val() === "")
                || (this.opts.element.val() === undefined)
                || (this.opts.element.val() === null);
        },

        // single
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {
                    var selected = element.find("option").filter(function() { return this.selected });
                    // a single select box always has a value, no need to null check 'selected'
                    callback(self.optionToData(selected));
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var id = element.val();
                    //search in data by id, storing the actual matching item
                    var match = null;
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = equal(id, opts.id(el));
                            if (is_match) {
                                match = el;
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            callback(match);
                        }
                    });
                };
            }

            return opts;
        },

        // single
        getPlaceholder: function() {
            // if a placeholder is specified on a single select without a valid placeholder option ignore it
            if (this.select) {
                if (this.getPlaceholderOption() === undefined) {
                    return undefined;
                }
            }

            return this.parent.getPlaceholder.apply(this, arguments);
        },

        // single
        setPlaceholder: function () {
            var placeholder = this.getPlaceholder();

            if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {

                // check for a placeholder option if attached to a select
                if (this.select && this.getPlaceholderOption() === undefined) return;

                this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));

                this.selection.addClass("select2-default");

                this.container.removeClass("select2-allowclear");
            }
        },

        // single
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var selected = 0, self = this, showSearchInput = true;

            // find the selected element in the result list

            this.findHighlightableChoices().each2(function (i, elm) {
                if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                    selected = i;
                    return false;
                }
            });

            // and highlight it
            if (noHighlightUpdate !== false) {
                if (initial === true && selected >= 0) {
                    this.highlight(selected);
                } else {
                    this.highlight(0);
                }
            }

            // hide the search box if this is the first we got the results and there are enough of them for search

            if (initial === true) {
                var min = this.opts.minimumResultsForSearch;
                if (min >= 0) {
                    this.showSearch(countResults(data.results) >= min);
                }
            }
        },

        // single
        showSearch: function(showSearchInput) {
            if (this.showSearchInput === showSearchInput) return;

            this.showSearchInput = showSearchInput;

            this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
            this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
            //add "select2-with-searchbox" to the container if search box is shown
            $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
        },

        // single
        onSelect: function (data, options) {

            if (!this.triggerSelect(data)) { return; }

            var old = this.opts.element.val(),
                oldData = this.data();

            this.opts.element.val(this.id(data));
            this.updateSelection(data);

            this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });

            this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());
            this.close();

            if (!options || !options.noFocus)
                this.focusser.focus();

            if (!equal(old, this.id(data))) { this.triggerChange({added:data,removed:oldData}); }
        },

        // single
        updateSelection: function (data) {

            var container=this.selection.find(".select2-chosen"), formatted, cssClass;

            this.selection.data("select2-data", data);

            container.empty();
            if (data !== null) {
                formatted=this.opts.formatSelection(data, container, this.opts.escapeMarkup);
            }
            if (formatted !== undefined) {
                container.append(formatted);
            }
            cssClass=this.opts.formatSelectionCssClass(data, container);
            if (cssClass !== undefined) {
                container.addClass(cssClass);
            }

            this.selection.removeClass("select2-default");

            if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
                this.container.addClass("select2-allowclear");
            }
        },

        // single
        val: function () {
            var val,
                triggerChange = false,
                data = null,
                self = this,
                oldData = this.data();

            if (arguments.length === 0) {
                return this.opts.element.val();
            }

            val = arguments[0];

            if (arguments.length > 1) {
                triggerChange = arguments[1];
            }

            if (this.select) {
                this.select
                    .val(val)
                    .find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                        data = self.optionToData(elm);
                        return false;
                    });
                this.updateSelection(data);
                this.setPlaceholder();
                if (triggerChange) {
                    this.triggerChange({added: data, removed:oldData});
                }
            } else {
                // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
                if (!val && val !== 0) {
                    this.clear(triggerChange);
                    return;
                }
                if (this.opts.initSelection === undefined) {
                    throw new Error("cannot call val() if initSelection() is not defined");
                }
                this.opts.element.val(val);
                this.opts.initSelection(this.opts.element, function(data){
                    self.opts.element.val(!data ? "" : self.id(data));
                    self.updateSelection(data);
                    self.setPlaceholder();
                    if (triggerChange) {
                        self.triggerChange({added: data, removed:oldData});
                    }
                });
            }
        },

        // single
        clearSearch: function () {
            this.search.val("");
            this.focusser.val("");
        },

        // single
        data: function(value) {
            var data,
                triggerChange = false;

            if (arguments.length === 0) {
                data = this.selection.data("select2-data");
                if (data == undefined) data = null;
                return data;
            } else {
                if (arguments.length > 1) {
                    triggerChange = arguments[1];
                }
                if (!value) {
                    this.clear(triggerChange);
                } else {
                    data = this.data();
                    this.opts.element.val(!value ? "" : this.id(value));
                    this.updateSelection(value);
                    if (triggerChange) {
                        this.triggerChange({added: value, removed:data});
                    }
                }
            }
        }
    });

    MultiSelect2 = clazz(AbstractSelect2, {

        // multi
        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container select2-container-multi"
            }).html([
                "<ul class='select2-choices'>",
                "  <li class='select2-search-field'>",
                "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
                "  </li>",
                "</ul>",
                "<div class='select2-drop select2-drop-multi select2-display-none'>",
                "   <ul class='select2-results'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // multi
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            // TODO validate placeholder is a string if specified

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install sthe selection initializer
                opts.initSelection = function (element, callback) {

                    var data = [];

                    element.find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                        data.push(self.optionToData(elm));
                    });
                    callback(data);
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var ids = splitVal(element.val(), opts.separator);
                    //search in data by array of ids, storing matching items in a list
                    var matches = [];
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = $.grep(ids, function(id) {
                                return equal(id, opts.id(el));
                            }).length;
                            if (is_match) {
                                matches.push(el);
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            // reorder matches based on the order they appear in the ids array because right now
                            // they are in the order in which they appear in data array
                            var ordered = [];
                            for (var i = 0; i < ids.length; i++) {
                                var id = ids[i];
                                for (var j = 0; j < matches.length; j++) {
                                    var match = matches[j];
                                    if (equal(id, opts.id(match))) {
                                        ordered.push(match);
                                        matches.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                            callback(ordered);
                        }
                    });
                };
            }

            return opts;
        },

        // multi
        selectChoice: function (choice) {

            var selected = this.container.find(".select2-search-choice-focus");
            if (selected.length && choice && choice[0] == selected[0]) {

            } else {
                if (selected.length) {
                    this.opts.element.trigger("choice-deselected", selected);
                }
                selected.removeClass("select2-search-choice-focus");
                if (choice && choice.length) {
                    this.close();
                    choice.addClass("select2-search-choice-focus");
                    this.opts.element.trigger("choice-selected", choice);
                }
            }
        },

        // multi
        destroy: function() {
            $("label[for='" + this.search.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);
        },

        // multi
        initContainer: function () {

            var selector = ".select2-choices", selection;

            this.searchContainer = this.container.find(".select2-search-field");
            this.selection = selection = this.container.find(selector);

            var _this = this;
            this.selection.on("click", ".select2-search-choice:not(.select2-locked)", function (e) {
                //killEvent(e);
                _this.search[0].focus();
                _this.selectChoice($(this));
            });

            // rewrite labels from original element to focusser
            this.search.attr("id", "s2id_autogen"+nextUid());
            $("label[for='" + this.opts.element.attr("id") + "']")
                .attr('for', this.search.attr('id'));

            this.search.on("input paste", this.bind(function() {
                if (!this.isInterfaceEnabled()) return;
                if (!this.opened()) {
                    this.open();
                }
            }));

            this.search.attr("tabindex", this.elementTabIndex);

            this.keydowns = 0;
            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                ++this.keydowns;
                var selected = selection.find(".select2-search-choice-focus");
                var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
                var next = selected.next(".select2-search-choice:not(.select2-locked)");
                var pos = getCursorInfo(this.search);

                if (selected.length &&
                    (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)) {
                    var selectedChoice = selected;
                    if (e.which == KEY.LEFT && prev.length) {
                        selectedChoice = prev;
                    }
                    else if (e.which == KEY.RIGHT) {
                        selectedChoice = next.length ? next : null;
                    }
                    else if (e.which === KEY.BACKSPACE) {
                        this.unselect(selected.first());
                        this.search.width(10);
                        selectedChoice = prev.length ? prev : next;
                    } else if (e.which == KEY.DELETE) {
                        this.unselect(selected.first());
                        this.search.width(10);
                        selectedChoice = next.length ? next : null;
                    } else if (e.which == KEY.ENTER) {
                        selectedChoice = null;
                    }

                    this.selectChoice(selectedChoice);
                    killEvent(e);
                    if (!selectedChoice || !selectedChoice.length) {
                        this.open();
                    }
                    return;
                } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1)
                    || e.which == KEY.LEFT) && (pos.offset == 0 && !pos.length)) {

                    this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
                    killEvent(e);
                    return;
                } else {
                    this.selectChoice(null);
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus:true});
                        this.close();
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                    return;
                }

                if (e.which === KEY.ENTER) {
                    if (this.opts.openOnEnter === false) {
                        return;
                    } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
                        return;
                    }
                }

                this.open();

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }

                if (e.which === KEY.ENTER) {
                    // prevent form from being submitted
                    killEvent(e);
                }

            }));

            this.search.on("keyup", this.bind(function (e) {
                this.keydowns = 0;
                this.resizeSearch();
            })
            );

            this.search.on("blur", this.bind(function(e) {
                this.container.removeClass("select2-container-active");
                this.search.removeClass("select2-focused");
                this.selectChoice(null);
                if (!this.opened()) this.clearSearch();
                e.stopImmediatePropagation();
                this.opts.element.trigger($.Event("select2-blur"));
            }));

            this.container.on("click", selector, this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                if ($(e.target).closest(".select2-search-choice").length > 0) {
                    // clicked inside a select2 search choice, do not open
                    return;
                }
                this.selectChoice(null);
                this.clearPlaceholder();
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.open();
                this.focusSearch();
                e.preventDefault();
            }));

            this.container.on("focus", selector, this.bind(function () {
                if (!this.isInterfaceEnabled()) return;
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
                this.clearPlaceholder();
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");

            // set the placeholder if necessary
            this.clearSearch();
        },

        // multi
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.search.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // multi
        initSelection: function () {
            var data;
            if (this.opts.element.val() === "" && this.opts.element.text() === "") {
                this.updateSelection([]);
                this.close();
                // set the placeholder if necessary
                this.clearSearch();
            }
            if (this.select || this.opts.element.val() !== "") {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(data){
                    if (data !== undefined && data !== null) {
                        self.updateSelection(data);
                        self.close();
                        // set the placeholder if necessary
                        self.clearSearch();
                    }
                });
            }
        },

        // multi
        clearSearch: function () {
            var placeholder = this.getPlaceholder(),
                maxWidth = this.getMaxSearchWidth();

            if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
                this.search.val(placeholder).addClass("select2-default");
                // stretch the search box to full width of the container so as much of the placeholder is visible as possible
                // we could call this.resizeSearch(), but we do not because that requires a sizer and we do not want to create one so early because of a firefox bug, see #944
                this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
            } else {
                this.search.val("").width(10);
            }
        },

        // multi
        clearPlaceholder: function () {
            if (this.search.hasClass("select2-default")) {
                this.search.val("").removeClass("select2-default");
            }
        },

        // multi
        opening: function () {
            this.clearPlaceholder(); // should be done before super so placeholder is not used to search
            this.resizeSearch();

            this.parent.opening.apply(this, arguments);

            this.focusSearch();

            this.updateResults(true);
            this.search.focus();
            this.opts.element.trigger($.Event("select2-open"));
        },

        // multi
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
        },

        // multi
        focus: function () {
            this.close();
            this.search.focus();
        },

        // multi
        isFocused: function () {
            return this.search.hasClass("select2-focused");
        },

        // multi
        updateSelection: function (data) {
            var ids = [], filtered = [], self = this;

            // filter out duplicates
            $(data).each(function () {
                if (indexOf(self.id(this), ids) < 0) {
                    ids.push(self.id(this));
                    filtered.push(this);
                }
            });
            data = filtered;

            this.selection.find(".select2-search-choice").remove();
            $(data).each(function () {
                self.addSelectedChoice(this);
            });
            self.postprocessResults();
        },

        // multi
        tokenize: function() {
            var input = this.search.val();
            input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
            if (input != null && input != undefined) {
                this.search.val(input);
                if (input.length > 0) {
                    this.open();
                }
            }

        },

        // multi
        onSelect: function (data, options) {

            if (!this.triggerSelect(data)) { return; }

            this.addSelectedChoice(data);

            this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });

            if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect===true);

            if (this.opts.closeOnSelect) {
                this.close();
                this.search.width(10);
            } else {
                if (this.countSelectableResults()>0) {
                    this.search.width(10);
                    this.resizeSearch();
                    if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
                        // if we reached max selection size repaint the results so choices
                        // are replaced with the max selection reached message
                        this.updateResults(true);
                    }
                    this.positionDropdown();
                } else {
                    // if nothing left to select close
                    this.close();
                    this.search.width(10);
                }
            }

            // since its not possible to select an element that has already been
            // added we do not need to check if this is a new element before firing change
            this.triggerChange({ added: data });

            if (!options || !options.noFocus)
                this.focusSearch();
        },

        // multi
        cancel: function () {
            this.close();
            this.focusSearch();
        },

        addSelectedChoice: function (data) {
            var enableChoice = !data.locked,
                enabledItem = $(
                    "<li class='select2-search-choice'>" +
                    "    <div></div>" +
                    "    <a href='#' onclick='return false;' class='select2-search-choice-close' tabindex='-1'></a>" +
                    "</li>"),
                disabledItem = $(
                    "<li class='select2-search-choice select2-locked'>" +
                    "<div></div>" +
                    "</li>");
            var choice = enableChoice ? enabledItem : disabledItem,
                id = this.id(data),
                val = this.getVal(),
                formatted,
                cssClass;

            formatted=this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
            if (formatted != undefined) {
                choice.find("div").replaceWith("<div>"+formatted+"</div>");
            }
            cssClass=this.opts.formatSelectionCssClass(data, choice.find("div"));
            if (cssClass != undefined) {
                choice.addClass(cssClass);
            }

            if(enableChoice){
              choice.find(".select2-search-choice-close")
                  .on("mousedown", killEvent)
                  .on("click dblclick", this.bind(function (e) {
                  if (!this.isInterfaceEnabled()) return;

                  $(e.target).closest(".select2-search-choice").fadeOut('fast', this.bind(function(){
                      this.unselect($(e.target));
                      this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                      this.close();
                      this.focusSearch();
                  })).dequeue();
                  killEvent(e);
              })).on("focus", this.bind(function () {
                  if (!this.isInterfaceEnabled()) return;
                  this.container.addClass("select2-container-active");
                  this.dropdown.addClass("select2-drop-active");
              }));
            }

            choice.data("select2-data", data);
            choice.insertBefore(this.searchContainer);

            val.push(id);
            this.setVal(val);
        },

        // multi
        unselect: function (selected) {
            var val = this.getVal(),
                data,
                index;
            selected = selected.closest(".select2-search-choice");

            if (selected.length === 0) {
                throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
            }

            data = selected.data("select2-data");

            if (!data) {
                // prevent a race condition when the 'x' is clicked really fast repeatedly the event can be queued
                // and invoked on an element already removed
                return;
            }

            while((index = indexOf(this.id(data), val)) >= 0) {
                val.splice(index, 1);
                this.setVal(val);
                if (this.select) this.postprocessResults();
            }

            var evt = $.Event("select2-removing");
            evt.val = this.id(data);
            evt.choice = data;
            this.opts.element.trigger(evt);

            if (evt.isDefaultPrevented()) {
                return;
            }

            selected.remove();

            this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
            this.triggerChange({ removed: data });
        },

        // multi
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var val = this.getVal(),
                choices = this.results.find(".select2-result"),
                compound = this.results.find(".select2-result-with-children"),
                self = this;

            choices.each2(function (i, choice) {
                var id = self.id(choice.data("select2-data"));
                if (indexOf(id, val) >= 0) {
                    choice.addClass("select2-selected");
                    // mark all children of the selected parent as selected
                    choice.find(".select2-result-selectable").addClass("select2-selected");
                }
            });

            compound.each2(function(i, choice) {
                // hide an optgroup if it doesnt have any selectable children
                if (!choice.is('.select2-result-selectable')
                    && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
                    choice.addClass("select2-selected");
                }
            });

            if (this.highlight() == -1 && noHighlightUpdate !== false){
                self.highlight(0);
            }

            //If all results are chosen render formatNoMAtches
            if(!this.opts.createSearchChoice && !choices.filter('.select2-result:not(.select2-selected)').length > 0){
                if(!data || data && !data.more && this.results.find(".select2-no-results").length === 0) {
                    if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
                        this.results.append("<li class='select2-no-results'>" + self.opts.formatNoMatches(self.search.val()) + "</li>");
                    }
                }
            }

        },

        // multi
        getMaxSearchWidth: function() {
            return this.selection.width() - getSideBorderPadding(this.search);
        },

        // multi
        resizeSearch: function () {
            var minimumWidth, left, maxWidth, containerLeft, searchWidth,
                sideBorderPadding = getSideBorderPadding(this.search);

            minimumWidth = measureTextWidth(this.search) + 10;

            left = this.search.offset().left;

            maxWidth = this.selection.width();
            containerLeft = this.selection.offset().left;

            searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;

            if (searchWidth < minimumWidth) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth < 40) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth <= 0) {
              searchWidth = minimumWidth;
            }

            this.search.width(Math.floor(searchWidth));
        },

        // multi
        getVal: function () {
            var val;
            if (this.select) {
                val = this.select.val();
                return val === null ? [] : val;
            } else {
                val = this.opts.element.val();
                return splitVal(val, this.opts.separator);
            }
        },

        // multi
        setVal: function (val) {
            var unique;
            if (this.select) {
                this.select.val(val);
            } else {
                unique = [];
                // filter out duplicates
                $(val).each(function () {
                    if (indexOf(this, unique) < 0) unique.push(this);
                });
                this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
            }
        },

        // multi
        buildChangeDetails: function (old, current) {
            var current = current.slice(0),
                old = old.slice(0);

            // remove intersection from each array
            for (var i = 0; i < current.length; i++) {
                for (var j = 0; j < old.length; j++) {
                    if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
                        current.splice(i, 1);
                        if(i>0){
                        	i--;
                        }
                        old.splice(j, 1);
                        j--;
                    }
                }
            }

            return {added: current, removed: old};
        },


        // multi
        val: function (val, triggerChange) {
            var oldData, self=this;

            if (arguments.length === 0) {
                return this.getVal();
            }

            oldData=this.data();
            if (!oldData.length) oldData=[];

            // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
            if (!val && val !== 0) {
                this.opts.element.val("");
                this.updateSelection([]);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange({added: this.data(), removed: oldData});
                }
                return;
            }

            // val is a list of ids
            this.setVal(val);

            if (this.select) {
                this.opts.initSelection(this.select, this.bind(this.updateSelection));
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(oldData, this.data()));
                }
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("val() cannot be called if initSelection() is not defined");
                }

                this.opts.initSelection(this.opts.element, function(data){
                    var ids=$.map(data, self.id);
                    self.setVal(ids);
                    self.updateSelection(data);
                    self.clearSearch();
                    if (triggerChange) {
                        self.triggerChange(self.buildChangeDetails(oldData, self.data()));
                    }
                });
            }
            this.clearSearch();
        },

        // multi
        onSortStart: function() {
            if (this.select) {
                throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
            }

            // collapse search field into 0 width so its container can be collapsed as well
            this.search.width(0);
            // hide the container
            this.searchContainer.hide();
        },

        // multi
        onSortEnd:function() {

            var val=[], self=this;

            // show search and move it to the end of the list
            this.searchContainer.show();
            // make sure the search container is the last item in the list
            this.searchContainer.appendTo(this.searchContainer.parent());
            // since we collapsed the width in dragStarted, we resize it here
            this.resizeSearch();

            // update selection
            this.selection.find(".select2-search-choice").each(function() {
                val.push(self.opts.id($(this).data("select2-data")));
            });
            this.setVal(val);
            this.triggerChange();
        },

        // multi
        data: function(values, triggerChange) {
            var self=this, ids, old;
            if (arguments.length === 0) {
                 return this.selection
                     .find(".select2-search-choice")
                     .map(function() { return $(this).data("select2-data"); })
                     .get();
            } else {
                old = this.data();
                if (!values) { values = []; }
                ids = $.map(values, function(e) { return self.opts.id(e); });
                this.setVal(ids);
                this.updateSelection(values);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(old, this.data()));
                }
            }
        }
    });

    $.fn.select2 = function () {

        var args = Array.prototype.slice.call(arguments, 0),
            opts,
            select2,
            method, value, multiple,
            allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
            valueMethods = ["opened", "isFocused", "container", "dropdown"],
            propertyMethods = ["val", "data"],
            methodsMap = { search: "externalSearch" };

        this.each(function () {
            if (args.length === 0 || typeof(args[0]) === "object") {
                opts = args.length === 0 ? {} : $.extend({}, args[0]);
                opts.element = $(this);

                if (opts.element.get(0).tagName.toLowerCase() === "select") {
                    multiple = opts.element.prop("multiple");
                } else {
                    multiple = opts.multiple || false;
                    if ("tags" in opts) {opts.multiple = multiple = true;}
                }

                select2 = multiple ? new MultiSelect2() : new SingleSelect2();
                select2.init(opts);
            } else if (typeof(args[0]) === "string") {

                if (indexOf(args[0], allowedMethods) < 0) {
                    throw "Unknown method: " + args[0];
                }

                value = undefined;
                select2 = $(this).data("select2");
                if (select2 === undefined) return;

                method=args[0];

                if (method === "container") {
                    value = select2.container;
                } else if (method === "dropdown") {
                    value = select2.dropdown;
                } else {
                    if (methodsMap[method]) method = methodsMap[method];

                    value = select2[method].apply(select2, args.slice(1));
                }
                if (indexOf(args[0], valueMethods) >= 0
                    || (indexOf(args[0], propertyMethods) && args.length == 1)) {
                    return false; // abort the iteration, ready to return first matched value
                }
            } else {
                throw "Invalid arguments to select2 plugin: " + args;
            }
        });
        return (value === undefined) ? this : value;
    };

    // plugin defaults, accessible to users
    $.fn.select2.defaults = {
        width: "copy",
        loadMorePadding: 0,
        closeOnSelect: true,
        openOnEnter: true,
        containerCss: {},
        dropdownCss: {},
        containerCssClass: "",
        dropdownCssClass: "",
        formatResult: function(result, container, query, escapeMarkup) {
            var markup=[];
            markMatch(result.text, query.term, markup, escapeMarkup);
            return markup.join("");
        },
        formatSelection: function (data, container, escapeMarkup) {
            return data ? escapeMarkup(data.text) : undefined;
        },
        sortResults: function (results, container, query) {
            return results;
        },
        formatResultCssClass: function(data) {return undefined;},
        formatSelectionCssClass: function(data, container) {return undefined;},
        formatNoMatches: function () { return "No matches found"; },
        formatInputTooShort: function (input, min) { var n = min - input.length; return "Please enter " + n + " more character" + (n == 1? "" : "s"); },
        formatInputTooLong: function (input, max) { var n = input.length - max; return "Please delete " + n + " character" + (n == 1? "" : "s"); },
        formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
        formatLoadMore: function (pageNumber) { return "Loading more results..."; },
        formatSearching: function () { return "Searching..."; },
        minimumResultsForSearch: 0,
        minimumInputLength: 0,
        maximumInputLength: null,
        maximumSelectionSize: 0,
        id: function (e) { return e.id; },
        matcher: function(term, text) {
            return stripDiacritics(''+text).toUpperCase().indexOf(stripDiacritics(''+term).toUpperCase()) >= 0;
        },
        separator: ",",
        tokenSeparators: [],
        tokenizer: defaultTokenizer,
        escapeMarkup: defaultEscapeMarkup,
        blurOnChange: false,
        selectOnBlur: false,
        adaptContainerCssClass: function(c) { return c; },
        adaptDropdownCssClass: function(c) { return null; },
        nextSearchTerm: function(selectedObject, currentSearchTerm) { return undefined; }
    };

    $.fn.select2.ajaxDefaults = {
        transport: $.ajax,
        params: {
            type: "GET",
            cache: false,
            dataType: "json"
        }
    };

    // exports
    window.Select2 = {
        query: {
            ajax: ajax,
            local: local,
            tags: tags
        }, util: {
            debounce: debounce,
            markMatch: markMatch,
            escapeMarkup: defaultEscapeMarkup,
            stripDiacritics: stripDiacritics
        }, "class": {
            "abstract": AbstractSelect2,
            "single": SingleSelect2,
            "multi": MultiSelect2
        }
    };

}(jQuery));

/*!
Chosen, a Select Box Enhancer for jQuery and Prototype
by Patrick Filler for Harvest, http://getharvest.com

Version 1.3.0
Full source at https://github.com/harvesthq/chosen
Copyright (c) 2011-2014 Harvest http://getharvest.com

MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
This file is generated by `grunt build`, do not edit it by hand.
*/

(function() {
  var $, AbstractChosen, Chosen, SelectParser, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        children: 0,
        disabled: group.disabled,
        classes: group.className
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function(text) {
      var map, unsafe_chars;
      if ((text == null) || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function(chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
      this.on_ready();
    }

    AbstractChosen.prototype.set_default_values = function() {
      var _this = this;
      this.click_test_action = function(evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function(evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      return this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
    };

    AbstractChosen.prototype.set_default_text = function() {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout((function() {
            return _this.container_mousedown();
          }), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout((function() {
          return _this.blur_test();
        }), 100);
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, _i, _len, _ref;
      content = '';
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        if (data.group) {
          content += this.result_add_group(data);
        } else {
          content += this.result_add_option(data);
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(data.text);
          }
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      var classes, group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      classes = [];
      classes.push("group-result");
      if (group.classes) {
        classes.push(group.classes);
      }
      group_el = document.createElement("li");
      group_el.className = classes.join(" ");
      group_el.innerHTML = group.search_text;
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function() {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function() {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function() {
      var escapedSearchText, option, regex, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      zregex = new RegExp(escapedSearchText, 'i');
      regex = this.get_search_regex(escapedSearchText);
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          if (!(option.group && !this.group_search)) {
            option.search_text = option.group ? option.label : option.text;
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(zregex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.get_search_regex = function(escaped_search_string) {
      var regex_anchor;
      regex_anchor = this.search_contains ? "" : "^";
      return new RegExp(regex_anchor + escaped_search_string, 'i');
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function() {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            return this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            return this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            return this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.results_search();
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function(evt) {
      var _this = this;
      return setTimeout((function() {
        return _this.results_search();
      }), 50);
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function(evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function(evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function(evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function(element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.browser_is_supported = function() {
      if (window.navigator.appName === "Microsoft Internet Explorer") {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
        return false;
      }
      if (/Android/i.test(window.navigator.userAgent)) {
        if (/Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy' && chosen instanceof Chosen) {
          chosen.destroy();
        } else if (!(chosen instanceof Chosen)) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'style': "width: " + (this.container_width()) + ";",
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      if (this.is_multiple) {
        this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop"><ul class="chosen-results"></ul></div>');
      } else {
        this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop"><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>');
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      return this.set_label_behavior();
    };

    Chosen.prototype.on_ready = function() {
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      var _this = this;
      this.container.bind('touchstart.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('touchend.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mousedown.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function(evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function(evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function(evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function(evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function(evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt) {
        _this.search_results_mousewheel(evt);
      });
      this.search_results.bind('touchstart.chosen', function(evt) {
        _this.search_results_touchstart(evt);
      });
      this.search_results.bind('touchmove.chosen', function(evt) {
        _this.search_results_touchmove(evt);
      });
      this.search_results.bind('touchend.chosen', function(evt) {
        _this.search_results_touchend(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function(evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function(evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function(evt) {
        _this.container_mousedown(evt);
      });
      this.form_field_jq.bind("chosen:close.chosen", function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('blur.chosen', function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function(evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function(evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function(evt) {
        _this.input_focus(evt);
      });
      this.search_field.bind('cut.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      this.search_field.bind('paste.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function(evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field_jq[0].disabled;
      if (this.is_disabled) {
        this.container.addClass('chosen-disabled');
        this.search_field[0].disabled = true;
        if (!this.is_multiple) {
          this.selected_item.unbind("focus.chosen", this.activate_action);
        }
        return this.close_field();
      } else {
        this.container.removeClass('chosen-disabled');
        this.search_field[0].disabled = false;
        if (!this.is_multiple) {
          return this.selected_item.bind("focus.chosen", this.activate_action);
        }
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      if (!this.is_disabled) {
        if (evt && evt.type === "mousedown" && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.val("");
            }
            $(this.container[0].ownerDocument).bind('click.chosen', this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
            evt.preventDefault();
            this.results_toggle();
          }
          return this.activate_field();
        }
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta;
      if (evt.originalEvent) {
        delta = evt.originalEvent.deltaY || -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      return this.search_field_scale();
    };

    Chosen.prototype.activate_field = function() {
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      var active_container;
      active_container = $(evt.target).closest('.chosen-container');
      if (active_container.length && this.container[0] === active_container[0]) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function() {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.search_field.val());
      this.winnow_results();
      return this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      var _this = this;
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', function(evt) {
          if (_this.is_multiple) {
            return _this.container_mousedown(evt);
          } else {
            return _this.activate_field();
          }
        });
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link,
        _this = this;
      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + item.html + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.bind('click.chosen', function(evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        this.show_search_field_default();
        if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.form_field_jq.trigger("change");
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          this.reset_single_select_options();
        }
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(item.text);
        }
        if (!((evt.metaKey || evt.ctrlKey) && this.is_multiple)) {
          this.results_hide();
        }
        this.search_field.val("");
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.form_field_jq.trigger("change", {
            'selected': this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").text(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.form_field_jq.trigger("change", {
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_text = function() {
      if (this.search_field.val() === this.default_text) {
        return "";
      } else {
        return $('<div/>').text($.trim(this.search_field.val())).html();
      }
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;
      no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
      no_results_html.find("span").first().html(terms);
      this.search_results.append(no_results_html);
      return this.form_field_jq.trigger("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.keydown_checker = function(evt) {
      var stroke, _ref1;
      stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.search_field.val().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 32:
          if (this.disable_search) {
            evt.preventDefault();
          }
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    Chosen.prototype.search_field_scale = function() {
      var div, f_width, h, style, style_block, styles, w, _i, _len;
      if (this.is_multiple) {
        h = 0;
        w = 0;
        style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          style_block += style + ":" + this.search_field.css(style) + ";";
        }
        div = $('<div />', {
          'style': style_block
        });
        div.text(this.search_field.val());
        $('body').append(div);
        w = div.width() + 25;
        div.remove();
        f_width = this.container.outerWidth();
        if (w > f_width - 10) {
          w = f_width - 10;
        }
        return this.search_field.css({
          'width': w + 'px'
        });
      }
    };

    return Chosen;

  })(AbstractChosen);

}).call(this);

/*
Sequence.js (http://www.sequencejs.com)
Version: 1.0.1.2
Author: Ian Lunn @IanLunn
Author URL: http://www.ianlunn.co.uk/
Github: https://github.com/IanLunn/Sequence

This is a FREE script and is available under a MIT License:
http://www.opensource.org/licenses/mit-license.php

Sequence.js and its dependencies are (c) Ian Lunn Design 2012 - 2013 unless otherwise stated.

Sequence also relies on the following open source scripts:

- jQuery imagesLoaded 2.1.0 (http://github.com/desandro/imagesloaded)
	Paul Irish et al
	Available under a MIT License: http://www.opensource.org/licenses/mit-license.php

- jQuery TouchWipe 1.1.1 (http://www.netcu.de/jquery-touchwipe-iphone-ipad-library)
	Andreas Waltl, netCU Internetagentur (http://www.netcu.de)
	Available under a MIT License: http://www.opensource.org/licenses/mit-license.php

- Modernizr 2.6.1 Custom Build (http://modernizr.com/) (Named Modernizr for Sequence to prevent conflicts)
	Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
	Available under the BSD and MIT licenses: www.modernizr.com/license/
	*/

;(function($) {
	var windowLoaded = false;
	$(window).bind("load", function() {
		windowLoaded = true;
	});

	function Sequence(element, options, defaults, get) {
		var self = this;
		self.container = $(element); //the Sequence containing element
		self.canvas = self.container.children('.sequence-canvas'); //the Sequence canvas which holds Sequence's frames (<li> elements)
		self.frames = self.canvas.children('li'); //the Sequence frames (top level <li> elements within the Sequence canvas)

		self._modernizrForSequence(); //get the custom build necessary for Sequence

		var prefixes = { //convert JS transition/animation names to CSS names
			'WebkitTransition' : '-webkit-',
			'WebkitAnimation'  : '-webkit-',
			'MozTransition'    : '-moz-',
			'MozAnimation '    : '-moz-',
			'OTransition'      : '-o-',
			'OAnimation'       : '-o-',
			'msTransition'     : '-ms-',
			'msAnimation'      : '-ms-',
			'transition'       : '',
			'animation'        : ''
		};
		
		var transitionsAndAnimations = { //convert JS transition names to JS transition end and animation end event names (also apply a classname of .sequence to the event)
			'WebkitTransition' : 'webkitTransitionEnd.sequence',
			'WebkitAnimation'  : 'webkitAnimationEnd.sequence',
			'MozTransition'    : 'transitionend.sequence',
			'MozAnimation'     : 'animationend.sequence',
			'OTransition'      : 'otransitionend.sequence',
			'OAnimation'       : 'oanimationend.sequence',
			'msTransition'     : 'MSTransitionEnd.sequence',
			'msAnimation'      : 'MSAnimationEnd.sequence',
			'transition'       : 'transitionend.sequence',
			'animation'        : 'animationend.sequence'
		};

		self.transitionPrefix = prefixes[ModernizrForSequence.prefixed('transition')], //work out the CSS transition prefix for the browser being used (-webkit- for example)
		self.animationPrefix = prefixes[ModernizrForSequence.prefixed('animation')], //work out the CSS animation prefix for the browser being used

		self.transitionProperties = {},
		self.transitionEnd = transitionsAndAnimations[ModernizrForSequence.prefixed('transition')] + ' ' + transitionsAndAnimations[ModernizrForSequence.prefixed('animation')], //work out the JS transitionEnd name for the browser being used (webkitTransitionEnd webkitAnimationEnd for example)
		self.numberOfFrames = self.frames.length, //number of frames (<li>) Sequence consists of

		self.transitionsSupported = (self.transitionPrefix !== undefined) ? true : false, //determine if transitions are supported
		self.hasTouch = ("ontouchstart" in window) ? true : false, //determine if this is a touch enabled device
		self.isPaused = false, //whether Sequence is paused
		self.isBeingHoveredOver = false, //whether the Sequence canvas is currently being hovered over

		self.container.removeClass('sequence-destroyed'); //if Sequence is destroyed using .destroy(), it is given a clas of "destroy", remove that now if present

		//CALLBACKS
		self.paused = function() {},												//executes when Sequence is paused
		self.unpaused = function() {},											//executes when Sequence is unpaused

		self.beforeNextFrameAnimatesIn = function() {},			//executes before the next frame animates in
		self.afterNextFrameAnimatesIn = function() {},			//executes after the next frame animates in
		self.beforeCurrentFrameAnimatesOut = function() {},	//executes before the current frame animates out
		self.afterCurrentFrameAnimatesOut = function() {},	//executes after the current frame animates out

		self.afterLoaded = function() {};										//executes after Sequence is initiated
		self.destroyed = function() {};											//executes when Sequence is destroyed via the destory() function

		//INIT
		self.settings = $.extend({}, defaults, options); //combine default options with developer defined ones
		self.settings.preloader = self._renderUiElements(self.settings.preloader, '.sequence-preloader'); //set up the preloader and save it
		self.isStartingFrame = (self.settings.animateStartingFrameIn) ? true : false; //determine if the first frame should animate in
		self.settings.unpauseDelay = (self.settings.unpauseDelay === null) ? self.settings.autoPlayDelay : self.settings.unpauseDelay; //if the unpauseDelay is not specified, make it the same as the autoPlayDelay speed
		self.getHashTagFrom = (self.settings.hashDataAttribute) ? "data-sequence-hashtag": "id"; //get the hashtag from the ID or data attribute?
		self.frameHashID = []; //array that matches frames with has IDs
		self.direction = self.settings.autoPlayDirection;

		if(self.settings.hideFramesUntilPreloaded && self.settings.preloader !== undefined  && self.settings.preloader !== false) { //if using a preloader and hiding frames until preloading has completed...
			self.frames.hide(); //hide Sequence's frames
		}

		if(self.transitionPrefix === "-o-") { //if Opera prefixes are required...
			self.transitionsSupported = self._operaTest(); //run a test to see if Opera correctly supports transitions (Opera 11 has bugs relating to transitions)
		}

		self.frames.removeClass("animate-in"); //remove any instance of "animate-in", which should be used incase JS is disabled

		//functionality to run once Sequence has preloaded
		function oncePreloaded() {
			self.afterLoaded(); //callback
			if(self.settings.hideFramesUntilPreloaded && self.settings.preloader !== undefined  && self.settings.preloader !== false) {
				self.frames.show();
			}
			if(self.settings.preloader !== undefined  && self.settings.preloader !== false){
				if(self.settings.hidePreloaderUsingCSS && self.transitionsSupported) {
					self.prependPreloadingCompleteTo = (self.settings.prependPreloadingComplete === true) ? self.settings.preloader : $(self.settings.prependPreloadingComplete);
					self.prependPreloadingCompleteTo.addClass("preloading-complete");
					setTimeout(init, self.settings.hidePreloaderDelay);
				}else{
					self.settings.preloader.fadeOut(self.settings.hidePreloaderDelay, function() {
						clearInterval(self.defaultPreloader);
						init();
					});
				}
			}else{
				init();
			}
		}

		var preloadTheseFramesLength = self.settings.preloadTheseFrames.length; //how many frames to preload?
		var preloadTheseImagesLength = self.settings.preloadTheseImages.length; //how many single images to load?

		// Useful for integration with js module loaders (e.g. requireJS) where window.load may have fired prior to this script executing.
		// Should be used with care.  Modernizr normally likes to execute in the <head> tags.
		if (self.settings.windowLoaded === true) {
			windowLoaded = self.settings.windowLoaded;
		}

		function saveImagesToArray(length, srcOnly) {
			var imagesToPreload = []; //saves the images that are to be preloaded
			if(!srcOnly){
				for(var i = length; i > 0; i--){ //for each frame to be preloaded...
					self.frames.eq(self.settings.preloadTheseFrames[i-1]-1).find("img").each(function() { //find <img>'s in specific frames, and for each found...
						imagesToPreload.push($(this)[0]); //add it to the array of images to be preloaded
					});
				}
			}else{
				for(var j = length; j > 0; j--) { //for each frame to be preloaded...
					imagesToPreload.push($("body").find('img[src="'+self.settings.preloadTheseImages[j-1]+'"]')); //find any <img> with the given source and add it to the array of images to be preloaded
				}
			}
			return imagesToPreload;
		}

		//jQuery imagesLoaded plugin v2.1.0 (http://github.com/desandro/imagesloaded)
		function imagesLoaded(imagesToPreload, callback) {
			var BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
			var $this = imagesToPreload,
			deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
			hasNotify = $.isFunction(deferred.notify),
			$images = $this.find('img').add( $this.filter('img') ),
			loaded = [],
			proper = [],
			broken = [];

			//Register deferred callbacks
			if($.isPlainObject(callback)) {
				$.each(callback, function(key, value) {
					if(key === 'callback') {
						callback = value;
					}else if(deferred) {
						deferred[key](value);
					}
				});
			}

			function doneLoading() {
				var $proper = $(proper),
				$broken = $(broken);

				if(deferred) {
					if(broken.length) {
						deferred.reject($images, $proper, $broken);
					}else{
						deferred.resolve($images);
					}
				}

				if($.isFunction(callback)) {
					callback.call($this, $images, $proper, $broken);
				}
			}

			function imgLoaded( img, isBroken ) {
				if(img.src === BLANK || $.inArray(img, loaded) !== -1) { // don't proceed if BLANK image, or image is already loaded
					return;
			}

				loaded.push(img); // store element in loaded images array

				if(isBroken) { // keep track of broken and properly loaded images
					broken.push(img);
				}else{
					proper.push(img);
				}

				$.data(img, 'imagesLoaded', {isBroken: isBroken, src: img.src }); // cache image and its state for future calls

				if(hasNotify) { // trigger deferred progress method if present
					deferred.notifyWith($(img), [isBroken, $images, $(proper), $(broken)]);
				}

				if($images.length === loaded.length) { // call doneLoading and clean listeners if all images are loaded
					setTimeout(doneLoading);
					$images.unbind('.imagesLoaded');
				}
			}

			if(!$images.length) { // if no images, trigger immediately
				doneLoading();
			}else{
				$images.bind('load.imagesLoaded error.imagesLoaded', function(event) {
					imgLoaded(event.target, event.type === 'error'); // trigger imgLoaded
				}).each(function(i, el) {
					var src = el.src;
					var cached = $.data(el, 'imagesLoaded'); // find out if this image has been already checked for status if it was, and src has not changed, call imgLoaded on it
					if(cached && cached.src === src) {
						imgLoaded(el, cached.isBroken);
						return;
					}

					if(el.complete && el.naturalWidth !== undefined) { // if complete is true and browser supports natural sizes, try to check for image status manually
						imgLoaded(el, el.naturalWidth === 0 || el.naturalHeight === 0);
						return;
					}

					// cached images don't fire load sometimes, so we reset src, but only when dealing with IE, or image is complete (loaded) and failed manual check webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
					if(el.readyState || el.complete) {
						el.src = BLANK;
						el.src = src;
					}
				});
			}
		}

		if(self.settings.preloader !== undefined && self.settings.preloader !== false && (preloadTheseFramesLength !== 0 || preloadTheseImagesLength !== 0)) { //if using the preloader and the dev has specified some images should preload...
			var frameImagesToPreload = saveImagesToArray(preloadTheseFramesLength); //get images from particular Sequence frames to be preloaded
			var individualImagesToPreload = saveImagesToArray(preloadTheseImagesLength, true); //get images with specific source values to be preloaded
			var imagesToPreload = $(frameImagesToPreload.concat(individualImagesToPreload)); //combine frame images and individual images

			imagesLoaded(imagesToPreload, oncePreloaded);
		}else{ //if not using the preloader...
			if(windowLoaded === true) { //if the window has already loaded...
				oncePreloaded(); //run the init functionality when the preloader has finished
				$(this).unbind("load.sequence"); //unbind the load event as it's no longer needed
			}else{ //if the window hasn't already loaded...
				$(window).bind("load.sequence", function() { //when the window loads...	
					oncePreloaded(); //run the init functionality when the preloader has finished
					$(this).unbind("load.sequence"); //unbind the load event as it's no longer needed
				});
			}
		}

		function init() {
			$(self.settings.preloader).remove(); //remove the preloader element

			self.nextButton = self._renderUiElements(self.settings.nextButton, ".sequence-next"); //set up the next button
			self.prevButton = self._renderUiElements(self.settings.prevButton, ".sequence-prev"); //set up the previous button
			self.pauseButton = self._renderUiElements(self.settings.pauseButton, ".sequence-pause"); //set up the pause button
			self.pagination = self._renderUiElements(self.settings.pagination, ".sequence-pagination"); //set up the pagination

			if((self.nextButton !== undefined && self.nextButton !== false) && self.settings.showNextButtonOnInit === true){self.nextButton.show();} //if using a next button, show it
			if((self.prevButton !== undefined && self.prevButton !== false) && self.settings.showPrevButtonOnInit === true){self.prevButton.show();} //if using a previous button, show it
			if((self.pauseButton !== undefined && self.pauseButton !== false) && self.settings.showPauseButtonOnInit === true){self.pauseButton.show();} //if using a pause button, show it

			if(self.settings.pauseIcon !== false) {
				self.pauseIcon = self._renderUiElements(self.settings.pauseIcon, ".sequence-pause-icon");
				if(self.pauseIcon !== undefined) {
					self.pauseIcon.hide();
				}
			}else{
				self.pauseIcon = undefined;
			}

			if(self.pagination !== undefined && self.pagination !== false) {
				self.paginationLinks = self.pagination.children(); //get each pagination link

				self.paginationLinks.on('click.sequence', function() { //when a pagination link is clicked...
					var associatedFrameNumber = $(this).index() + 1; //get the number of the frame this link is associated with
					self.goTo(associatedFrameNumber); //go to the associate frame
				});

				if(self.settings.showPaginationOnInit === true) {
					self.pagination.show();
				}
			}

			self.nextFrameID = self.settings.startingFrameID;

			if(self.settings.hashTags === true) { //if using hashtags...
				self.frames.each(function() { //for each frame...
					self.frameHashID.push($(this).prop(self.getHashTagFrom)); //add the hashtag to an array
				});

				self.currentHashTag = location.hash.replace("#", ""); //get the current hashtag
				if(self.currentHashTag === undefined || self.currentHashTag === "") { //if there is no hashtag...
					self.nextFrameID = self.settings.startingFrameID; //use the startingFrameID
				}else{
					self.frameHashIndex = $.inArray(self.currentHashTag, self.frameHashID); //get the index of the frame that matches the hashtag
					if(self.frameHashIndex !== -1){  //if the hashtag matches a Sequence frame ID...
						self.nextFrameID = self.frameHashIndex + 1; //use the frame associated to the hashtag
					}else{
						self.nextFrameID = self.settings.startingFrameID; //use the startingFrameID
					}
				}
			}

			self.nextFrame = self.frames.eq(self.nextFrameID-1); //get the next frame
			self.nextFrameChildren = self.nextFrame.children(); //get the elements within the next frame to be animated

			if(self.pagination !== undefined) { //if using pagination, make the starting frame the current one in pagination
				$(self.paginationLinks[self.settings.startingFrameID-1]).addClass('current'); //add the 'current' class to the current frame
			}

			if(self.transitionsSupported) { //initiate the full featured Sequence if transitions are supported...
				if(!self.settings.animateStartingFrameIn) { //start first frame in animated in position
					self.currentFrameID = self.nextFrameID;

					if(self.settings.moveActiveFrameToTop) {
						self.nextFrame.css('z-index', self.numberOfFrames);
					}

					self._resetElements(self.transitionPrefix, self.nextFrameChildren, "0s");
					self.nextFrame.addClass("animate-in");
					if(self.settings.hashTags && self.settings.hashChangesOnFirstFrame) {
						self.currentHashTag = self.nextFrame.prop(self.getHashTagFrom);
						document.location.hash = "#"+self.currentHashTag;
					}

					setTimeout(function() {
						self._resetElements(self.transitionPrefix, self.nextFrameChildren, "");
					}, 100);

					self._resetAutoPlay(true, self.settings.autoPlayDelay);
				}else if(self.settings.reverseAnimationsWhenNavigatingBackwards && self.settings.autoPlayDirection -1 && self.settings.animateStartingFrameIn) { //animate in backwards
					self._resetElements(self.transitionPrefix, self.nextFrameChildren, "0s");
					self.nextFrame.addClass("animate-out");
					self.goTo(self.nextFrameID, -1, true);
				}else{ //animate in forwards
					self.goTo(self.nextFrameID, 1, true);
				}
			}else{ //initiate a basic slider for browsers that don't support CSS3 transitions
				self.container.addClass("sequence-fallback");
				self.currentFrameID = self.nextFrameID;
				if(self.settings.hashTags && self.settings.hashChangesOnFirstFrame){
					self.currentHashTag = self.nextFrame.prop(self.getHashTagFrom);
					document.location.hash = "#"+self.currentHashTag;
				}

				self.frames.addClass("animate-in"); //move each frame into its animate-in position
				self.frames.not(':eq('+(self.nextFrameID-1)+')').css({"display": "none", "opacity": 0}); //set all frames (except the next one) to display: none, opacity: 0
				self._resetAutoPlay(true, self.settings.autoPlayDelay);
			}
			//END INIT
			//EVENTS
			if(self.nextButton !== undefined) { //if a next button is defined...
				self.nextButton.bind('click.sequence', function() { //when the next button is clicked...
					self.next(); //go to the next frame
				});
			}

			if(self.prevButton !== undefined) { //if a previous button is defined...
				self.prevButton.bind('click.sequence', function() { //when the previous button is clicked...
					self.prev(); //go to the previous frame
				});
			}

			if(self.pauseButton !== undefined) { //if a pause button is defined...
				self.pauseButton.bind('click.sequence', function() { //when the pause button is clicked...
					self.pause(true); //pause Sequence and set hardPause to true
				});
			}

			function keyEvents(keyPressed, keyDirections) {
				var keyCode;
				var keyCodes;

				for(keyCodes in keyDirections) {
					if(keyCodes === "left" || keyCodes === "right") {
						keyCode = defaultKeys[keyCodes];
					}else{
						keyCode = keyCodes;
					}

					if(keyPressed === parseFloat(keyCode)) { //if the key pressed is associated with a function...
						self._initCustomKeyEvent(keyDirections[keyCodes]); //initiate the function
					}
				}
			}

			if(self.settings.keyNavigation) {
				var defaultKeys = {
					'left'	: 37,
					'right'	: 39
				};

				$(document).bind('keydown.sequence', function(e) { //when a key is pressed...
					var keyCodeChar = String.fromCharCode(e.keyCode);
					if((keyCodeChar > 0 && keyCodeChar <= self.numberOfFrames) && (self.settings.numericKeysGoToFrames)) {
						self.nextFrameID = keyCodeChar;
						self.goTo(self.nextFrameID); //go to specified frame
					}

					keyEvents(e.keyCode, self.settings.keyEvents); //run default keyevents
					keyEvents(e.keyCode, self.settings.customKeyEvents); //run custom keyevents
				});
			}
			
			self.canvas.on({
				'mouseenter.sequence': function() { //when the mouse enter the Sequence element...
					if(self.settings.pauseOnHover && self.settings.autoPlay && !self.hasTouch) { //if using pauseOnHover and autoPlay on non touch devices
						self.isBeingHoveredOver = true;
						if(!self.isHardPaused) { //if Sequence is hard paused (via a pause button)...
							self.pause(); //pause autoPlay
						}
					}
				},
				'mouseleave.sequence': function() { //when the mouse leaves the Sequence element...
					if(self.settings.pauseOnHover && self.settings.autoPlay && !self.hasTouch) { //if using pauseOnHover and autoPlay on non touch devices
						self.isBeingHoveredOver = false;
						if(!self.isHardPaused) { //if Sequence is not hard paused (via a pause button)...
							self.unpause(); //unpause autoPlay
						}
					}
				}
			});

			if(self.settings.hashTags) { //if hashchange is enabled in the settings...
				$(window).bind('hashchange.sequence', function() { //when the hashtag changes...
					var newTag = location.hash.replace("#", ""); //grab the new hashtag

					if(self.currentHashTag !== newTag) { //if the last hashtag is not the same as the current one...
						self.currentHashTag = newTag; //save the new tag
						self.frameHashIndex = $.inArray(self.currentHashTag, self.frameHashID); //get the index of the frame that matches the hashtag
						if(self.frameHashIndex !== -1) { //if the hashtag matches a Sequence frame ID...
							self.nextFrameID = self.frameHashIndex + 1; //set that frame as the next one
								self.goTo(self.nextFrameID); //go to the next frame
							}
						}
					});
			}

			function cancelTouch() {
				self.canvas.on("touchmove.sequence", onTouchMove);
				startX = null;
				isMoving = false;
			}

			function onTouchMove(e) {
				if(self.settings.swipePreventsDefault) {
					e.preventDefault();
				}
				if(isMoving) {
					var x = e.originalEvent.touches[0].pageX;
					var y = e.originalEvent.touches[0].pageY;
					var dx = startX - x;
					var dy = startY - y;
					if(Math.abs(dx) >= self.settings.swipeThreshold) {
						cancelTouch();
						if(dx > 0) {
							self._initCustomKeyEvent(self.settings.swipeEvents.left);
						}else{
							self._initCustomKeyEvent(self.settings.swipeEvents.right);
						}
					}else if(Math.abs(dy) >= self.settings.swipeThreshold) {
						cancelTouch();
						if(dy > 0) {
							self._initCustomKeyEvent(self.settings.swipeEvents.down);
						}else{
							self._initCustomKeyEvent(self.settings.swipeEvents.up);
						}
					}
				}
			}

			function onTouchStart(e) {
				if(e.originalEvent.touches.length === 1) {
					startX = e.originalEvent.touches[0].pageX;
					startY = e.originalEvent.touches[0].pageY;
					isMoving = true;
					self.canvas.on("touchmove.sequence", onTouchMove);
				}
			}

			if(self.settings.swipeNavigation && self.hasTouch) { //if using swipeNavigation and the device has touch capabilities...
				//jQuery TouchWipe v1.1.1 (http://www.netcu.de/jquery-touchwipe-iphone-ipad-library)
				var startX;
				var startY;
				var isMoving = false;

				self.canvas.on("touchstart.sequence", onTouchStart);
			}
			//END EVENTS
		}
	} //END CONSTRUCTOR

	Sequence.prototype = {

		//PUBLIC METHODS
		/*
		start autoPlay -- causing Sequence to automatically change frame every x amount of milliseconds
		
		delay: a time in ms before starting the autoPlay feature (if unspecified, the default will be used)
		*/
		startAutoPlay: function(delay) {
			var self = this;
			delay = (delay === undefined) ? self.settings.autoPlayDelay : delay; //if a delay isn't specified, use the default
			self.unpause();

			self._resetAutoPlay(); //stop autoPlay before starting it again
			self.autoPlayTimer = setTimeout(function() { //start a new autoPlay timer and...
				if(self.settings.autoPlayDirection === 1) { //go to either the next or previous frame
					self.next();
				}else{
					self.prev();
				}
			}, delay); //after a specified delay
		},

		//stop causing Sequence to automatically change frame every x amount of seconds
		stopAutoPlay: function() {
			var self = this;
			self.pause(true);
			clearTimeout(self.autoPlayTimer); //stop the autoPlay timer
		},

		/*
		Toggle startAutoPlay (unpausing autoPlay) and stopAutoPlay (pausing autoPlay)

		hardPause: if true, Sequence's pauseOnHover will not execute. Useful for pause buttons.

		Note: Sequence 0.7.3 and below didn't have an .unpause() function -- .pause() would pause/unpause
		based on the current state. .unpause() is now included for clarity but the .pause() function will
		still toggle between paused and unpaused states.
		*/
		pause: function(hardPause) {
			var self = this;
			if(!self.isSoftPaused) { //if pausing Sequence...
				if(self.pauseButton !== undefined) { //if a pause button is defined...
					self.pauseButton.addClass("paused"); //add the class of "paused" to the pause button
					if(self.pauseIcon !== undefined) { //if a pause icon is defined...
						self.pauseIcon.show(); //show the pause icon
					}
				}
				self.paused(); //callback when Sequence is paused
				self.isSoftPaused = true;
				self.isHardPaused = (hardPause) ? true : false; //if hardPausing, set hardPause to true
				self.isPaused = true;
				self._resetAutoPlay(); //stop autoPlay
			}else{ //if unpausing Sequence...
				self.unpause();
			}
		},

		/*
		Start the autoPlay feature, as well as deal with any changes to pauseButtons, pauseIcons and public variables etc
		
		callback: if false, the unpause callback will not be initiated (this is because unpause is used internally during the stop and start of each frame)
		*/
		unpause: function(callback) {
			var self = this;
			if(self.pauseButton !== undefined) { //if a pause button is defined...
				self.pauseButton.removeClass("paused"); //remove the class of "paused" from the pause button
				if(self.pauseIcon !== undefined) { //if a pause icon is defined...
					self.pauseIcon.hide(); //hide the pause icon
				}
			}

			self.isSoftPaused = false;
			self.isHardPaused = false;
			self.isPaused = false;

			if(!self.active) {
				if(callback !== false) {
					self.unpaused(); //callback when Sequence is unpaused
				}
				self._resetAutoPlay(true, self.settings.unpauseDelay); //start autoPlay after a delay specified via the unpauseDelay setting
			}else{
				self.delayUnpause = true; //Sequence is animating so delay the unpause event until the animation completes
			}
		},

		//Go to the frame ahead of the current one
		next: function() {
			var self = this;
			id = (self.currentFrameID !== self.numberOfFrames) ? self.currentFrameID + 1 : 1; //work out the next frame ID
			if(self.active === false || self.active === undefined) { //if Sequence isn't currently animating...
				self.goTo(id, 1); //go to the next frame
			}else{ //if Sequence is currently animating...
				self.goTo(id, 1, true); //go immediately to the next frame (ignoring the transition threshold)
			}
		},

		//Go to the frame prior to the current one
		prev: function() {
			var self = this;
			id = (self.currentFrameID === 1) ? self.numberOfFrames : self.currentFrameID - 1; //work out the prev frame ID
			if(self.active === false || self.active === undefined) { //if Sequence isn't currently animating...
				self.goTo(id, -1); //go to the prev frame
			}else{ //if Sequence is currently animating...
				self.goTo(id, -1, true); //go immediately to the prev frame (ignoring the transition threshold)
			}
		},

		/*
		Go to a specific frame
		
		id: number of the frame to go to
		direction: direction to get to that frame (1 = forward, -1 = reverse)
		ignoreTransitionThreshold: if true, ignore the transitionThreshold setting and immediately go to the specified frame
		*/
		goTo: function(id, direction, ignoreTransitionThreshold) {
			var self = this;
			self.nextFrameID = parseFloat(id);
			var transitionThreshold = (ignoreTransitionThreshold === true) ? 0 : self.settings.transitionThreshold; //if transitionThreshold is to be ignored, set it to zero

			if((self.nextFrameID === self.currentFrameID) //if the next frame the user is trying to go to is the same as the currently active one...
			|| (self.settings.navigationSkip && self.navigationSkipThresholdActive) //or navigationSkip is enabled and the navigationSkipThreshold is active (which prevents frame from being navigated too fast)...
			|| (!self.settings.navigationSkip && self.active) //or navigationSkip is disbaled but Sequence is animating...
			|| (!self.transitionsSupported && self.active) //or Sequence is in fallback mode and Sequence is animating...
			|| (!self.settings.cycle && direction === 1 && self.currentFrameID === self.numberOfFrames) //or cycling is disabled, the user is navigating forward and this is the last frame...
			|| (!self.settings.cycle && direction === -1 && self.currentFrameID === 1) //or cycling is disabled, the user is navigating backwards and this is the first frame...
			|| (self.settings.preventReverseSkipping && self.direction !== direction && self.active)) { //or Sequence is animating and the user is trying to change the direction of navigation...
				return false; //don't go to another frame
			}else if(self.settings.navigationSkip && self.active) { //if navigationSkip is enabled and Sequence is animating (a frame is being skipped before it has finished animating)...
				self.navigationSkipThresholdActive = true; //the navigationSkipThreshold is now active
				if(self.settings.fadeFrameWhenSkipped) { //if a frame should fade when skipped...
					self.nextFrame.stop().animate({"opacity": 0}, self.settings.fadeFrameTime); //fade
				}

				clearTimeout(self.transitionThresholdTimer);

				setTimeout(function() { //start the navigationSkipThreshold timer to prevent being able to navigate too quickly
					self.navigationSkipThresholdActive = false; //once the timer is complete, navigationSkip can occur again
				}, self.settings.navigationSkipThreshold);
			}

			if(!self.active || self.settings.navigationSkip) { //if there are no animations running or navigationSkip is enabled...
				self.active = true; //Sequence is now animating
				self._resetAutoPlay(); //stop any autoPlay timer that may be running

				if(direction === undefined) { //if no direction to navigate was defined...
					self.direction = (self.nextFrameID > self.currentFrameID) ? 1 : -1; //work out which way to go based on what frame is currently active
				}else{
					self.direction = direction; //go to the developer defined frame
				}

				self.currentFrame = self.canvas.children(".animate-in"); //find which frame is active -- the frame currently being viewed (and about to be animated out)
				self.nextFrame = self.frames.eq(self.nextFrameID-1); //grab the next frame
				self.currentFrameChildren = self.currentFrame.children();	//save the child elements of the current frame
				self.nextFrameChildren = self.nextFrame.children(); //save the child elements of the next frame

				if(self.pagination !== undefined) { //if using pagination...
					self.paginationLinks.removeClass('current'); //remove the 'current' class from all pagination links
					$(self.paginationLinks[self.nextFrameID-1]).addClass('current'); //add the 'current' class to the current frame
				}

				if(self.transitionsSupported) { //if the browser supports CSS3 transitions...
					if(self.currentFrame.length !== undefined) { //if there is a current frame (one that is in it's animate-in position)...
						self.beforeCurrentFrameAnimatesOut(); //callback
						if(self.settings.moveActiveFrameToTop) { //if the active frame should move to the top...
							self.currentFrame.css("z-index", 1); //move this frame to the bottom as it is now inactive
						}
						self._resetElements(self.transitionPrefix, self.nextFrameChildren, "0s"); //give the next frame elements a transition-duration and transition-delay of 0s so they don't transition to their reset position
						if(!self.settings.reverseAnimationsWhenNavigatingBackwards || self.direction === 1) { //if user hit next button...
							self.nextFrame.removeClass("animate-out"); //reset the next frame back to its starting position
							self._resetElements(self.transitionPrefix, self.currentFrameChildren, "");  //remove any inline styles from the elements to be animated so styles via the "animate-out" class can take full effect
						}else if(self.settings.reverseAnimationsWhenNavigatingBackwards && self.direction === -1) { //if the user hit prev button
							self.nextFrame.addClass("animate-out"); //reset the next frame back to its animate-out position
							self._reverseTransitionProperties(); //reverse the transition-duration, transition-delay and transition-timing-function
						}
					}else{
						self.isStartingFrame = false; //no longer the first frame
					}

					self.active = true; //Sequence is now animating
					self.currentFrame.unbind(self.transitionEnd); //remove the animation end event
					self.nextFrame.unbind(self.transitionEnd); //remove the animation end event

					if(self.settings.fadeFrameWhenSkipped && self.settings.navigationSkip) { //if a frame may have faded out when it was previously skipped...
						self.nextFrame.css("opacity", 1); //show it again
					}

					self.beforeNextFrameAnimatesIn(); //callback
					if(self.settings.moveActiveFrameToTop) { //if an active frame should be moved to the top...
						self.nextFrame.css('z-index', self.numberOfFrames);
					}

					//modifications to the current and next frame's elements to get them ready to animate
					if(!self.settings.reverseAnimationsWhenNavigatingBackwards || self.direction === 1) { //if user hit next button...
						setTimeout(function() { //50ms timeout to give the browser a chance to modify the DOM sequentially
							self._resetElements(self.transitionPrefix, self.nextFrameChildren, ""); //remove any inline styles from the elements to be animated so styles via the "animate-in" class can take full effect
							self._waitForAnimationsToComplete(self.nextFrame, self.nextFrameChildren, "in"); //wait for the next frame to animate in
							if(self.afterCurrentFrameAnimatesOut !== "function () {}" || (self.settings.transitionThreshold === true && ignoreTransitionThreshold !== true)) { //if the afterCurrentFrameAnimatesOut is being used...
								self._waitForAnimationsToComplete(self.currentFrame, self.currentFrameChildren, "out", true, 1); //wait for the current frame to animate out as well
							}
						}, 50);

						//final class changes to make animations happen
						setTimeout(function() { //50ms timeout to give the browser a chance to modify the DOM sequentially
							if(self.settings.transitionThreshold === false || self.settings.transitionThreshold === 0 || ignoreTransitionThreshold === true) { //if not using a transitionThreshold...
								self.currentFrame.toggleClass("animate-out animate-in"); //remove the "animate-in" class and add the "animate-out" class to the current frame
								self.nextFrame.addClass("animate-in"); //add the "animate-in" class
							}else { //if using a transitionThreshold...
								self.currentFrame.toggleClass("animate-out animate-in"); //remove the "animate-in" class and add the "animate-out" class to the current frame
								if(self.settings.transitionThreshold !== true) { //if there's no transitionThreshold or the dev specified a transitionThreshold in milliseconds
									self.transitionThresholdTimer = setTimeout(function() { //cause the next frame to animate in after a certain period
										self.nextFrame.addClass("animate-in"); //add the "animate-in" class
									}, transitionThreshold);
								}
							}
						}, 50);
					}else if(self.settings.reverseAnimationsWhenNavigatingBackwards && self.direction === -1) { //if the user hit prev button
						setTimeout(function() { //50ms timeout to give the browser a chance to modify the DOM sequentially
							//remove any inline styles from the elements so styles via the "animate-in" and "animate-out" class can take full effect
							self._resetElements(self.transitionPrefix, self.currentFrameChildren, "");
							self._resetElements(self.transitionPrefix, self.nextFrameChildren, "");
							self._reverseTransitionProperties(); //reverse the transition-duration, transition-delay and transition-timing-function

							self._waitForAnimationsToComplete(self.nextFrame, self.nextFrameChildren, "in"); //wait for the next frame to animate in
							if(self.afterCurrentFrameAnimatesOut !== "function () {}" || (self.settings.transitionThreshold === true && ignoreTransitionThreshold !== true)) { //if the afterCurrentFrameAnimatesOut is being used...
								self._waitForAnimationsToComplete(self.currentFrame, self.currentFrameChildren, "out", true, -1); //wait for the current frame to animate out as well
							}
						}, 50);

						//final class changes to make animations happen
						setTimeout(function() { //50ms timeout to give the browser a chance to modify the DOM sequentially
							if(self.settings.transitionThreshold === false || self.settings.transitionThreshold === 0 || ignoreTransitionThreshold === true) { //if not using a transitionThreshold...
								self.currentFrame.removeClass("animate-in"); //remove the "animate-in" class from the current frame
								self.nextFrame.toggleClass("animate-out animate-in"); //add the "animate-out" class and remove the "animate-in" class from the next frame
							}else{ //if using a transitionThreshold...
								self.currentFrame.removeClass("animate-in");
								if(self.settings.transitionThreshold !== true) { //if there's no transitionThreshold or the dev specified a transitionThreshold in milliseconds
									self.transitionThresholdTimer = setTimeout(function() { //cause the next frame to animate in after a certain period
										self.nextFrame.toggleClass("animate-out animate-in"); //add the "animate-in" class and remove the "animate-out" class
									}, transitionThreshold);
								}
							}
						}, 50);
					}
				}else{ //if the browser doesn't support CSS3 transitions...
					function animationComplete() {
						self._setHashTag();
						self.active = false;
						self._resetAutoPlay(true, self.settings.autoPlayDelay);
					}

					switch(self.settings.fallback.theme) {
						case "fade": //if using the fade fallback theme...
							self.frames.css({"position": "relative"}); //this allows for fadein/out in IE
							self.beforeCurrentFrameAnimatesOut();
							self.currentFrame = self.frames.eq(self.currentFrameID-1);
							self.currentFrame.animate({"opacity": 0}, self.settings.fallback.speed, function() { //hide the current frame
								self.currentFrame.css({"display": "none", "z-index": "1"});
								self.afterCurrentFrameAnimatesOut();
								self.beforeNextFrameAnimatesIn();
								self.nextFrame.css({"display": "block", "z-index": self.numberOfFrames}).animate({"opacity": 1}, 500, function() {
									self.afterNextFrameAnimatesIn();
								}); //make the next frame the current one and show it
								animationComplete();
							});

							self.frames.css({"position": "relative"}); //this allows for fadein/out in IE
						break;

						case "slide": //if using the slide fallback theme...
						default:
							//create objects which will save the .css() and .animation() objects
							var animateOut = {};
							var animateIn = {};
							var moveIn = {};

							//construct the .css() and .animation() objects
							if(self.direction === 1) {
								animateOut.left = "-100%";
								animateIn.left = "100%";
							}else{
								animateOut.left = "100%";
								animateIn.left = "-100%";
							}

							moveIn.left = "0";
							moveIn.opacity = 1;

							self.currentFrame = self.frames.eq(self.currentFrameID-1);
							self.beforeCurrentFrameAnimatesOut();
							self.currentFrame.animate(animateOut, self.settings.fallback.speed, function() {
								self.currentFrame.css({"display": "none", "z-index": "1"});
								self.afterCurrentFrameAnimatesOut();
							}); //cause the current frame to animate out
							self.beforeNextFrameAnimatesIn(); //callback
							self.nextFrame.show().css(animateIn);
							self.nextFrame.css({"display": "block", "z-index": self.numberOfFrames}).animate(moveIn, self.settings.fallback.speed, function() { //cause the next frame to animate in
								animationComplete();
								self.afterNextFrameAnimatesIn(); //callback
							});
						break;
					}
				}
				self.currentFrameID = self.nextFrameID; //make the currentFrameID the same as the one that is to animate in
			}
		},

		/* 
			removes Sequence from the element it's attached to

			callback: a callback to run once .destroy() has finished (or see the sequence.destroyed() callback)
		*/
		destroy: function(callback) {
			var self = this;

			self.container.addClass('sequence-destroyed'); //add a class of "destroyed" in case the developer wants to animate opacity etc

			//REMOVE EVENTS
			if(self.nextButton !== undefined) { //remove the next button click event if a next button is defined
				self.nextButton.unbind('click.sequence');
			}
			if(self.prevButton !== undefined) { //remove the previous button click event if a previous button is defined
				self.prevButton.unbind('click.sequence');
			}
			if(self.pauseButton !== undefined) { //remove the pause button click event if a pause button is defined
				self.pauseButton.unbind('click.sequence');
			}

			if(self.pagination !== undefined) {
				self.paginationLinks.unbind('click.sequence');
			}

			$(document).unbind('keydown.sequence'); //unbind key events
			self.canvas.unbind('mouseenter.sequence, mouseleave.sequence, touchstart.sequence, touchmove.sequence'); //unbind mouse and touch events
			$(window).unbind('hashchange.sequence'); //unbind hashchange

			//CLEAR TIMERS
			self.stopAutoPlay();
			clearTimeout(self.transitionThresholdTimer);

			//TIDY UP THE DOM
			self.canvas.children('li').remove(); //because Sequence rearranges frames so the active one is always on top, remove them all...
			self.canvas.prepend(self.frames); //then add them back in, in their original order
			self.frames.removeClass('animate-in animate-out').removeAttr('style'); //remove classes and inline styles from all frames
			self.frames.eq(self.currentFrameID-1).addClass('animate-in'); //keep the current frame in it's animate-in position

			//HIDE UI ELEMENTS
			if(self.nextButton !== undefined && self.nextButton !== false) { //if a next button is defined and was shown on initiation, hide it
				self.nextButton.hide();
			}
			if(self.prevButton !== undefined && self.prevButton !== false) { //if a prev button is defined and was shown on initiation, hide it
				self.prevButton.hide();
			}
			if(self.pauseButton !== undefined && self.pauseButton !== false) { //if a pause button is defined and was shown on initiation, hide it
				self.pauseButton.hide();
			}
			if(self.pauseIcon !== undefined && self.pauseIcon !== false) { //if a pause icon is defined, hide it
				self.pauseIcon.hide();
			}
			if(self.pagination !== undefined && self.pagination !== false) { //if pagination is defined and was shown on initiation, hide it
				self.pagination.hide();
			}

			//CALLBACKS - a callback can either be passed into the destroy() function or by using the sequence.destroyed() publc method
			if(callback !== undefined) {
				callback(); //callback past into the function
			}

			self.destroyed(); //callback
			self.container.removeData(); //remove data
		},
		//END PUBLIC METHODS

		//PRIVATE METHODS

		//trigger keyEvents, customKeyEvents and swipeEvents
		_initCustomKeyEvent: function(event) {
			var self = this;

			switch(event) {
				case "next":
				self.next();
				break;
				case "prev":
				self.prev();
				break;
				case "pause":
				self.pause(true);
				break;
			}
		},

		/*
		reset the transition-duration and transition-delay properties of an element
		
		elementToReset = the element that is to have it's properties reset
		cssValue = the value to be given to the transition-duration and transition-delay properties
		*/
		_resetElements: function(prefix, elementToReset, cssValue) {
			var self = this;

			elementToReset.css(
				self._prefixCSS(prefix, {
					"transition-duration": cssValue,
					"transition-delay": cssValue,
					"transition-timing-function": ""
				})
			);
		},

		/*
		when navigating backwards and reverseAnimationsWhenNavigatingBackwards is true, take the transition properties for forward animation and manipulate the animated elements to create a perfect reversal
		*/
		_reverseTransitionProperties: function() {
			var self = this;

			var currentFrameChildrenDurations = []; //saves the duration for each of the current frame's element
			var nextFrameChildrenDurations = []; //saves the duration for each of the next frame's element

			self.currentFrameChildren.each(function() { //get the overall duration (including delay) for each animated element in the current frame
				currentFrameChildrenDurations.push(parseFloat($(this).css(self.transitionPrefix+'transition-duration').replace('s', '')) + parseFloat($(this).css(self.transitionPrefix+'transition-delay').replace('s', '')));
			});

			self.nextFrameChildren.each(function() { //get the overall duration (including delay) for each animated element in the current frame
				nextFrameChildrenDurations.push(parseFloat($(this).css(self.transitionPrefix+'transition-duration').replace('s', '')) + parseFloat($(this).css(self.transitionPrefix+'transition-delay').replace('s', '')));
			});

			var maximumCurrentFrameDuration = Math.max.apply(Math, currentFrameChildrenDurations); //find which transition duration is the longest
			var maximumNextFrameDuration = Math.max.apply(Math, nextFrameChildrenDurations); //find which transition duration is the longest
			var transitionDifference = maximumCurrentFrameDuration - maximumNextFrameDuration; //get the overal transition difference between the current and next frame
			var currentDelay = 0;
			var nextDelay = 0;

			if(transitionDifference < 0 && !self.settings.preventDelayWhenReversingAnimations) { //if the current frame has a greater duration than the next frame...
				/* note: because the current frame will take longer to animate out than the next to animate in, when this animation is reversed, the current frame will have a delay applied before it animates out. By default, Sequence will aim to avoid this (via the preventDelayWhenReversingAnimations option) because a delay on the current frame may confuse the user. The delay is removed, which means the reversal of animation is slightly out of sync */
				currentDelay = Math.abs(transitionDifference);
			}else if(transitionDifference > 0) { //if the next frame has a greater duration than the current frame, add the difference on as a delay
				nextDelay = Math.abs(transitionDifference);
			}

			var reverseEachProperty = function(transitionProperties, currentFrameChildren, maximumFrameDuration, frameDelay) {

				function convertTimingFunctionToCubicBezier(timingFunction) {

					timingFunction = timingFunction.split(',')[0]; //only use one timing function

					var timingFunctionToCubicBezier = {
					    "linear" : "cubic-bezier(0.0,0.0,1.0,1.0)",
					    "ease"   : "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
					    "ease-in": "cubic-bezier(0.42, 0.0, 1.0, 1.0)",
					    "ease-in-out": "cubic-bezier(0.42, 0.0, 0.58, 1.0)",
					    "ease-out": "cubic-bezier(0.0, 0.0, 0.58, 1.0)"
					};

					if(timingFunction.indexOf("cubic-bezier") < 0) { //if the timing-function returned isn't a cubic-bezier()
					  timingFunction = timingFunctionToCubicBezier[timingFunction]; //convert it to one
					}

					return timingFunction; //return a cubic-bezier()
				}

				currentFrameChildren.each(function() {

					var duration = parseFloat($(this).css(self.transitionPrefix+'transition-duration').replace('s', '')); //get the elements transition-duration
					var delay = parseFloat($(this).css(self.transitionPrefix+'transition-delay').replace('s', '')); //get the elements transition-delay
					var transitionFunction = $(this).css(self.transitionPrefix+'transition-timing-function'); //get the elements transiion-timing-function
					
					if(transitionFunction.indexOf('cubic') === -1) { //if the function isn't a cubic-bezier (the Blink engine returns keywords instead)...
						var transitionFunction = convertTimingFunctionToCubicBezier(transitionFunction); //convert the keyword to cubic-bezier()
					}

					if (self.settings.reverseEaseWhenNavigatingBackwards) {
						var cubicBezier = transitionFunction.replace('cubic-bezier(', '').replace(')', '').split(','); //remove the CSS function and just get the array
						$.each(cubicBezier, function(index, value) { //for each point that makes up the cubic bezier...
							cubicBezier[index] = parseFloat(value); //turn the point into a number (rather than text)
						});

						//reverse the cubic bezier
						var reversedCubicBezier = [
						1 - cubicBezier[2],
						1 - cubicBezier[3],
						1 - cubicBezier[0],
						1 - cubicBezier[1]
						];
						transitionFunction = 'cubic-bezier('+reversedCubicBezier+')'; //add the reversed cubic bezier back into a CSS function
					}

					var frameDuration = duration + delay; //get the overall duration of the element

					transitionProperties["transition-duration"] = duration + 's'; //reapply the element's transition-duration (to override any inline styles)
					transitionProperties["transition-delay"] = (maximumFrameDuration - frameDuration + frameDelay) + 's'; //add a delay if required
					transitionProperties["transition-timing-function"] = transitionFunction; //reapply the reversed transition function
					$(this).css(
						self._prefixCSS(self.transitionPrefix, transitionProperties) //set the new transition properties
						);
				});
			};

			reverseEachProperty(self.transitionProperties, self.currentFrameChildren, maximumCurrentFrameDuration, currentDelay); //reverse properties for each of the current frame's elements
			reverseEachProperty(self.transitionProperties, self.nextFrameChildren, maximumNextFrameDuration, nextDelay); //reverse properties for each of the next frame's elements
		},

		/*
		adds the browser vendors prefix onto multiple CSS properties
		
		prefix = the prefix for the browser Sequence is being viewed in (-webkit- for example)
		properties = the properties to be prefixed (transition-duration for example)
		*/
		_prefixCSS: function(prefix, properties) {
			var self = this;

			var css = {};
			for(var property in properties) { //for each property to be modified...
				css[prefix + property] = properties[property]; //add the prefix to the property name
			}
			return css; //return the prefixed CSS
		},

		/*
		internal function used to start and stop autoPlay
		start: if true, autoPlay will be started, else it'll be stopped
		delay: a time in ms before starting the autoPlay feature (if unspecified, the default will be used)
		*/
		_resetAutoPlay: function(start, delay) {
			var self = this;

			if(start === true) { //if starting autoPlay
				if(self.settings.autoPlay && !self.isSoftPaused) { //if using autoPlay and Sequence isn't paused...
					clearTimeout(self.autoPlayTimer); //stop the autoPlay timer
					self.autoPlayTimer = setTimeout(function() { //start a new autoPlay timer and...
						if(self.settings.autoPlayDirection === 1) { //go to either the next or previous frame
							self.next();
						}else{
							self.prev();
						}
					}, delay); //after a specified delay
				}
			}else{ //if stopping autoPlay
				clearTimeout(self.autoPlayTimer); //stop the autoPlay timer
			}
		},

		/*functionality to initiate the preloader, next/previous buttons and so on
	
		devOption: true = the developer wants to use the default selector. false = don't use a uiElement. string = the developer defined selector to use for the UI element
		defaultOption: the default selector to use for the UI element, when the developer specifies false for devOption
		*/
		_renderUiElements: function(devOption, defaultOption) {
			var self = this;

			switch(devOption) {
				case false: //don't set up a uiElement
				return undefined;

				case true: //use the default uiElement
					if(defaultOption === ".sequence-preloader") { //if setting up the preloader...
						self._defaultPreloader(self.container, self.transitionsSupported, self.animationPrefix); //get the default preloader
					}
					return $(defaultOption, self.container); //return the default element

				default: //if using a developer defined selector...
					return $(devOption, self.container); //return the developer defined element
			}
		},

		/*
		prevents the next frame from animating until the current frame has finished animating

		frame: the frame <li> which is animating
		self.currentFrameChildren: the animated direct child elements of the frame
		transitionPhase: whether the elements are animating "in" to an active position or "out" of an active position
		inAfterwards: whether the next frame should animate in afterwards
		direction: the direction of animation
		*/
		_waitForAnimationsToComplete: function(frame, currentFrameChildren, transitionPhase, inAfterwards, direction) {
			var self = this;

			if(transitionPhase === "out") { //if waiting on a frame's element to animate out...
				var onceComplete = function() {
					self.afterCurrentFrameAnimatesOut(); //callback

					if(self.settings.transitionThreshold === true) {
						if(direction === 1) {
							self.nextFrame.addClass("animate-in"); //add the "animate-in" class
						}else if(direction === -1) {
							self.nextFrame.toggleClass("animate-out animate-in");
						}
					}
				};
			}else if(transitionPhase === "in") { //if waiting on a frame's element to animate in...
				var onceComplete = function() {
					self.afterNextFrameAnimatesIn(); //callback
					self._setHashTag(); //set the hashtag to represent the newly active frame

					self.active = false; //Sequence is not animating

					if(!self.isHardPaused && !self.isBeingHoveredOver) { //if Sequence isn't hard paused (via a pause button for example) or being hovered over...
						if(!self.delayUnpause) { //if unpausing isn't delayed (Sequence wasn't animating when unpause was invoked)...
							self.unpause(false); //unpause Sequence but don't run the unpause callback
						}else{ //if unpausing was delay because Sequence was animating when unpause was invoked...
							self.delayUnpause = false;
							self.unpause(); //unpause Sequence
						}
					}
				};
			}

			currentFrameChildren.data('animationEnded', false); // set the data attribute of each animated element to indicate that the animation has not yet ended
			frame.bind(self.transitionEnd, function(e) { //when an element finishes animating...
				$(e.target).data('animationEnded', true); // set the data attrbiute to indicate that the element has finished it's animation

				// now check if all elements have finished animating
				var allAnimationsEnded = true;
				currentFrameChildren.each(function() { //for each element being animated within a frame...
					if($(this).data('animationEnded') === false) { //if the animation hasn't ended...
						allAnimationsEnded = false; //not all animations have ended yet
						return false; //break out of the animationEnded check early
					}
				});

				if(allAnimationsEnded) { //if all animations have ended...
					frame.unbind(self.transitionEnd); //stop waiting for animations to end
					onceComplete();
				}
			});
		},

		_setHashTag: function() {
			var self = this;

			if(self.settings.hashTags) { //if hashTags is enabled...
				self.currentHashTag = self.nextFrame.prop(self.getHashTagFrom); //get the hashtag name
				self.frameHashIndex = $.inArray(self.currentHashTag, self.frameHashID); //get the index of the frame that matches the hashtag
				if(self.frameHashIndex !== -1 && (self.settings.hashChangesOnFirstFrame || (!self.isStartingFrame || !self.transitionsSupported))) { //if the hashtag matches a Sequence frame ID...
					self.nextFrameID = self.frameHashIndex + 1;
					document.location.hash = "#"+self.currentHashTag;
				}else{
					self.nextFrameID = self.settings.startingFrameID;
					self.isStartingFrame = false;
				}
			}
		},

		/* Modernizr 2.6.1 (Custom Build) | MIT & BSD
		 * Build: http://modernizr.com/download/#-svg-prefixed-testprop-testallprops-domprefixes
		 */
		_modernizrForSequence: function() {
			;window.ModernizrForSequence=function(a,b,c){function x(a){i.cssText=a}function y(a,b){return x(prefixes.join(a+";")+(b||""))}function z(a,b){return typeof a===b}function A(a,b){return!!~(""+a).indexOf(b)}function B(a,b){for(var d in a){var e=a[d];if(!A(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function C(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:z(f,"function")?f.bind(d||b):f}return!1}function D(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+m.join(d+" ")+d).split(" ");return z(b,"string")||z(b,"undefined")?B(e,b):(e=(a+" "+n.join(d+" ")+d).split(" "),C(e,b,c))}var d="2.6.1",e={},f=b.documentElement,g="modernizrForSequence",h=b.createElement(g),i=h.style,j,k={}.toString,l="Webkit Moz O ms",m=l.split(" "),n=l.toLowerCase().split(" "),o={svg:"http://www.w3.org/2000/svg"},p={},q={},r={},s=[],t=s.slice,u,v={}.hasOwnProperty,w;!z(v,"undefined")&&!z(v.call,"undefined")?w=function(a,b){return v.call(a,b)}:w=function(a,b){return b in a&&z(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=self;if(typeof c!="function")throw new TypeError;var d=t.call(arguments,1),e=function(){if(self instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(t.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(t.call(arguments)))};return e}),p.svg=function(){return!!b.createElementNS&&!!b.createElementNS(o.svg,"svg").createSVGRect};for(var E in p)w(p,E)&&(u=E.toLowerCase(),e[u]=p[E](),s.push((e[u]?"":"no-")+u));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)w(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},x(""),h=j=null,e._version=d,e._domPrefixes=n,e._cssomPrefixes=m,e.testProp=function(a){return B([a])},e.testAllProps=D,e.prefixed=function(a,b,c){return b?D(a,b,c):D(a,"pfx")},e}(self,self.document);
		},

		/* Set up Sequence's default preloader
		 * prependTo = which element to prepend the preloader to
		 * transitions = whether CSS3 transitions are supported
		 * prefix = the prefix for the browser Sequence is being viewed in
		 */
		_defaultPreloader: function(prependTo, transitions, prefix) {
			var icon = '<div class="sequence-preloader"><svg class="preloading" xmlns="http://www.w3.org/2000/svg"><circle class="circle" cx="6" cy="6" r="6" /><circle class="circle" cx="22" cy="6" r="6" /><circle class="circle" cx="38" cy="6" r="6" /></svg></div>';

			$("head").append("<style>.sequence-preloader{height: 100%;position: absolute;width: 100%;z-index: 999999;}@"+prefix+"keyframes preload{0%{opacity: 1;}50%{opacity: 0;}100%{opacity: 1;}}.sequence-preloader .preloading .circle{fill: #ff9442;display: inline-block;height: 12px;position: relative;top: -50%;width: 12px;"+prefix+"animation: preload 1s infinite; animation: preload 1s infinite;}.preloading{display:block;height: 12px;margin: 0 auto;top: 50%;margin-top:-6px;position: relative;width: 48px;}.sequence-preloader .preloading .circle:nth-child(2){"+prefix+"animation-delay: .15s; animation-delay: .15s;}.sequence-preloader .preloading .circle:nth-child(3){"+prefix+"animation-delay: .3s; animation-delay: .3s;}.preloading-complete{opacity: 0;visibility: hidden;"+prefix+"transition-duration: 1s; transition-duration: 1s;}div.inline{background-color: #ff9442; margin-right: 4px; float: left;}</style>");
			prependTo.prepend(icon);
			if(!ModernizrForSequence.svg && !transitions) { //if SVG isn't supported, remain calm and add this fallback instead...
				$(".sequence-preloader").prepend('<div class="preloading"><div class="circle inline"></div><div class="circle inline"></div><div class="circle inline"></div></div>');
				setInterval(function() {
					$(".sequence-preloader .circle").fadeToggle(500);
				}, 500);
			}else if(!transitions) { //if transitions aren't supported, toggle the opacity instead
				setInterval(function() {
					$(".sequence-preloader").fadeToggle(500);
				}, 500);
			}
		},

		//a quick test to work out if Opera supports transitions properly (to work around the fact that Opera 11 supports transitions but doesn't return a transition value properly)
		_operaTest: function() {
			$("body").append('<span id="sequence-opera-test"></span>');
			var $operaTest = $("#sequence-opera-test");
			$operaTest.css("-o-transition", "1s"); //add a transition value to the Opera test
			if($operaTest.css("-o-transition") !== "1s") { //if the expected value isn't returned...
				$operaTest.remove();
				return false; //cause Opera to go into the fallback theme
			}else{
				$operaTest.remove();
				return true;
			}
		}
		//END PRIVATE METHODS

	}; //END PROTOTYPE

	var defaults = {
		//General Settings
		startingFrameID: 1, //The frame (the list item `<li>`) that should first be displayed when Sequence loads
		cycle: true, //Whether Sequence should navigate to the first frame after the last frame and vice versa
		animateStartingFrameIn: false, //Whether the first frame should animate in to its active position
		transitionThreshold: false, //The delay between a frame animating out and the next animating in (false = no delay, true = the next frame will animate in only once the current frame has animated out)
		reverseAnimationsWhenNavigatingBackwards: true, //Whether animations should be reversed when a user navigates backwards by clicking a previous button/swiping/pressing the left key
		reverseEaseWhenNavigatingBackwards: true, //Whether the ease function should be reversed when a user navigates backwards
		preventDelayWhenReversingAnimations: false, //Whether a delay should be removed when animations are reversed. This delay is removed by default to prevent user confusion
		moveActiveFrameToTop: true, //Whether a frame should be given a higher `z-index` than other frames whilst it is active, to bring it above the others
		windowLoaded: false, //Set to true if it is known that the window.onload event has already fired.  Useful with javascript module loaders (such as RequireJS).

		//Autoplay Settings
		autoPlay: false, //Cause Sequence to automatically change between frames over a period of time, as defined in autoPlayDelay
		autoPlayDirection: 1, //The direction in which Sequence should auto play
		autoPlayDelay: 5000, //The duration in milliseconds at which frames should remain on screen before animating to the next

		//Frame Skipping Settings
		navigationSkip: true, //Whether the user can navigate through frames before each frame has finished animating
		navigationSkipThreshold: 250, //Amount of time that must pass before the next frame can be navigated to
		fadeFrameWhenSkipped: true, //If a frame is skipped before it finishes animating, it will quickly fade out
		fadeFrameTime: 150, //If fadeFrameWhenSkipped is true, how quickly a frame should fade out when skipped (in milliseconds)
		preventReverseSkipping: false, //Whether the user can change the direction of navigation during frames animating (if navigating forward, the user can only skip forwards when other frames are animating).

		//Next/Prev Button Settings
		nextButton: false, //if true, Sequence will use an element with class ".sequence-next" as the next button, else specify your own selector. false = don't use an in-built next button
		showNextButtonOnInit: true, //if true, Sequence will make the next button display: block; once Sequence has loaded (give the next button selector display: none; in the CSS to hide it until its usable)
		prevButton: false, //if true, Sequence will use an element with class ".sequence-prev" as the previous button, else specify your own selector. false = don't use an in-built previous button
		showPrevButtonOnInit: true, //if true, Sequence will make the previous button display: block; once Sequence has loaded (give the previous button selector display: none; in the CSS to hide it until its usable)

		//Pause Settings
		pauseButton: false, //if true, Sequence will use an element with class ".sequence-pause" as the pause button, else specify your own selector. false = don't use an in-built pause button
		unpauseDelay: null, //the time to wait before navigating to the next frame when Sequence is unpaused. Note that if an unpauseDelay is not specified, the default is the same as the autoPlayDelay setting
		pauseOnHover: true, //pause Sequence when the Sequence container is hovered over
		pauseIcon: false, 	//if true, Sequence will use an element with class ".sequence-pause-icon" as the pause icon, else specify your own selector. false = don't use an in-built pause icon (the pause icon will display when Sequence is paused)
		showPauseButtonOnInit: true, //if true, Sequence will make the pause button display: block; once Sequence has loaded (give the pause button selector display: none; in the CSS to hide it until its usable)

		//Pagination Settings
		pagination: false, //if true, Sequence will use an element with class ".sequence-pagination" as the paginated navigation, else specify your own selector. false = don't use in-built pagination
		showPaginationOnInit: true,  //if true, Sequence will make the pagination display: block; once Sequence has loaded (give the pagination selector display: none; in the CSS to hide it until its usable)

		//Preloader Settings
		preloader: false,
		preloadTheseFrames: [1], //all images in these frames will load before Sequence initiates
		preloadTheseImages: [ //specify particular images to load before Sequence initiates
			/* Example usage
			"images/catEatingSalad.jpg",
			"images/meDressedAsBatman.png"
			*/
		],
		/*Note: You can use preloadTheseFrames and preloadTheseImages together. You might want to load all images in frame 1 and just one big image from frame 2 for example*/
		hideFramesUntilPreloaded: true,
		prependPreloadingComplete: true,
		hidePreloaderUsingCSS: true,
		hidePreloaderDelay: 0,

		//Keyboard settings
		keyNavigation: true, //false prevents the following keyboard settings
		numericKeysGoToFrames: true,
		keyEvents: {
			left: "prev",
			right: "next"
		},
		customKeyEvents: {
			/* Example usage
			65: "prev",	//a
			68: "next",	//d
			83: "prev",	//s
			87: "next"	//w
			*/
		},

		//Touch Swipe Settings
		swipeNavigation: true,
		swipeThreshold: 20,
		swipePreventsDefault: false, //be careful if setting this to true
		swipeEvents: {
			left: "prev",
			right: "next",
			up: false,
			down: false
		},

		//hashTags Settings
		//when using hashTags, please include a reference to Ben Alman's jQuery HashChange plugin above your reference to Sequence.js

		//info: http://benalman.com/projects/jquery-hashchange-plugin/
		//plugin: https://raw.github.com/cowboy/jquery-hashchange/v1.3/jquery.ba-hashchange.min.js
		//GitHub: https://github.com/cowboy/jquery-hashchange
		hashTags: false, //when a frame is navigated to, change the hashtag to the frames ID
		hashDataAttribute: false, //false = the hashTag is taken from a frames ID attribute | true = the hashTag is taken from the data attribute "data-sequence-hash"
		hashChangesOnFirstFrame: false, //false = the hashTag won't change for the first frame but will for those after

		//Fallback Theme Settings (For browsers that don't support CSS3 transitions)
		fallback: {
			theme: "slide",
			speed: 500
		}
	};

	$.fn.sequence = function(options) {
		return this.each(function() {
			if (!$.data(this, 'sequence')) { //prevent multiple initiations on the same element
				$.data(this, 'sequence', new Sequence($(this), options, defaults));
      }
		});
	};
})(jQuery);

typeof JSON!="object"&&(JSON={}),function(){"use strict";function f(e){return e<10?"0"+e:e}function quote(e){return escapable.lastIndex=0,escapable.test(e)?'"'+e.replace(escapable,function(e){var t=meta[e];return typeof t=="string"?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function str(e,t){var n,r,i,s,o=gap,u,a=t[e];a&&typeof a=="object"&&typeof a.toJSON=="function"&&(a=a.toJSON(e)),typeof rep=="function"&&(a=rep.call(t,e,a));switch(typeof a){case"string":return quote(a);case"number":return isFinite(a)?String(a):"null";case"boolean":case"null":return String(a);case"object":if(!a)return"null";gap+=indent,u=[];if(Object.prototype.toString.apply(a)==="[object Array]"){s=a.length;for(n=0;n<s;n+=1)u[n]=str(n,a)||"null";return i=u.length===0?"[]":gap?"[\n"+gap+u.join(",\n"+gap)+"\n"+o+"]":"["+u.join(",")+"]",gap=o,i}if(rep&&typeof rep=="object"){s=rep.length;for(n=0;n<s;n+=1)typeof rep[n]=="string"&&(r=rep[n],i=str(r,a),i&&u.push(quote(r)+(gap?": ":":")+i))}else for(r in a)Object.prototype.hasOwnProperty.call(a,r)&&(i=str(r,a),i&&u.push(quote(r)+(gap?": ":":")+i));return i=u.length===0?"{}":gap?"{\n"+gap+u.join(",\n"+gap)+"\n"+o+"}":"{"+u.join(",")+"}",gap=o,i}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(e){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(e){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(e,t,n){var r;gap="",indent="";if(typeof n=="number")for(r=0;r<n;r+=1)indent+=" ";else typeof n=="string"&&(indent=n);rep=t;if(!t||typeof t=="function"||typeof t=="object"&&typeof t.length=="number")return str("",{"":e});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(e,t){var n,r,i=e[t];if(i&&typeof i=="object")for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(r=walk(i,n),r!==undefined?i[n]=r:delete i[n]);return reviver.call(e,t,i)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(e){return"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return j=eval("("+text+")"),typeof reviver=="function"?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}(),function(e,t){"use strict";var n=e.History=e.History||{},r=e.jQuery;if(typeof n.Adapter!="undefined")throw new Error("History.js Adapter has already been loaded...");n.Adapter={bind:function(e,t,n){r(e).bind(t,n)},trigger:function(e,t,n){r(e).trigger(t,n)},extractEventData:function(e,n,r){var i=n&&n.originalEvent&&n.originalEvent[e]||r&&r[e]||t;return i},onDomLoad:function(e){r(e)}},typeof n.init!="undefined"&&n.init()}(window),function(e,t){"use strict";var n=e.document,r=e.setTimeout||r,i=e.clearTimeout||i,s=e.setInterval||s,o=e.History=e.History||{};if(typeof o.initHtml4!="undefined")throw new Error("History.js HTML4 Support has already been loaded...");o.initHtml4=function(){if(typeof o.initHtml4.initialized!="undefined")return!1;o.initHtml4.initialized=!0,o.enabled=!0,o.savedHashes=[],o.isLastHash=function(e){var t=o.getHashByIndex(),n;return n=e===t,n},o.isHashEqual=function(e,t){return e=encodeURIComponent(e).replace(/%25/g,"%"),t=encodeURIComponent(t).replace(/%25/g,"%"),e===t},o.saveHash=function(e){return o.isLastHash(e)?!1:(o.savedHashes.push(e),!0)},o.getHashByIndex=function(e){var t=null;return typeof e=="undefined"?t=o.savedHashes[o.savedHashes.length-1]:e<0?t=o.savedHashes[o.savedHashes.length+e]:t=o.savedHashes[e],t},o.discardedHashes={},o.discardedStates={},o.discardState=function(e,t,n){var r=o.getHashByState(e),i;return i={discardedState:e,backState:n,forwardState:t},o.discardedStates[r]=i,!0},o.discardHash=function(e,t,n){var r={discardedHash:e,backState:n,forwardState:t};return o.discardedHashes[e]=r,!0},o.discardedState=function(e){var t=o.getHashByState(e),n;return n=o.discardedStates[t]||!1,n},o.discardedHash=function(e){var t=o.discardedHashes[e]||!1;return t},o.recycleState=function(e){var t=o.getHashByState(e);return o.discardedState(e)&&delete o.discardedStates[t],!0},o.emulated.hashChange&&(o.hashChangeInit=function(){o.checkerFunction=null;var t="",r,i,u,a,f=Boolean(o.getHash());return o.isInternetExplorer()?(r="historyjs-iframe",i=n.createElement("iframe"),i.setAttribute("id",r),i.setAttribute("src","#"),i.style.display="none",n.body.appendChild(i),i.contentWindow.document.open(),i.contentWindow.document.close(),u="",a=!1,o.checkerFunction=function(){if(a)return!1;a=!0;var n=o.getHash(),r=o.getHash(i.contentWindow.document);return n!==t?(t=n,r!==n&&(u=r=n,i.contentWindow.document.open(),i.contentWindow.document.close(),i.contentWindow.document.location.hash=o.escapeHash(n)),o.Adapter.trigger(e,"hashchange")):r!==u&&(u=r,f&&r===""?o.back():o.setHash(r,!1)),a=!1,!0}):o.checkerFunction=function(){var n=o.getHash()||"";return n!==t&&(t=n,o.Adapter.trigger(e,"hashchange")),!0},o.intervalList.push(s(o.checkerFunction,o.options.hashChangeInterval)),!0},o.Adapter.onDomLoad(o.hashChangeInit)),o.emulated.pushState&&(o.onHashChange=function(t){var n=t&&t.newURL||o.getLocationHref(),r=o.getHashByUrl(n),i=null,s=null,u=null,a;return o.isLastHash(r)?(o.busy(!1),!1):(o.doubleCheckComplete(),o.saveHash(r),r&&o.isTraditionalAnchor(r)?(o.Adapter.trigger(e,"anchorchange"),o.busy(!1),!1):(i=o.extractState(o.getFullUrl(r||o.getLocationHref()),!0),o.isLastSavedState(i)?(o.busy(!1),!1):(s=o.getHashByState(i),a=o.discardedState(i),a?(o.getHashByIndex(-2)===o.getHashByState(a.forwardState)?o.back(!1):o.forward(!1),!1):(o.pushState(i.data,i.title,encodeURI(i.url),!1),!0))))},o.Adapter.bind(e,"hashchange",o.onHashChange),o.pushState=function(t,n,r,i){r=encodeURI(r).replace(/%25/g,"%");if(o.getHashByUrl(r))throw new Error("History.js does not support states with fragment-identifiers (hashes/anchors).");if(i!==!1&&o.busy())return o.pushQueue({scope:o,callback:o.pushState,args:arguments,queue:i}),!1;o.busy(!0);var s=o.createStateObject(t,n,r),u=o.getHashByState(s),a=o.getState(!1),f=o.getHashByState(a),l=o.getHash(),c=o.expectedStateId==s.id;return o.storeState(s),o.expectedStateId=s.id,o.recycleState(s),o.setTitle(s),u===f?(o.busy(!1),!1):(o.saveState(s),c||o.Adapter.trigger(e,"statechange"),!o.isHashEqual(u,l)&&!o.isHashEqual(u,o.getShortUrl(o.getLocationHref()))&&o.setHash(u,!1),o.busy(!1),!0)},o.replaceState=function(t,n,r,i){r=encodeURI(r).replace(/%25/g,"%");if(o.getHashByUrl(r))throw new Error("History.js does not support states with fragment-identifiers (hashes/anchors).");if(i!==!1&&o.busy())return o.pushQueue({scope:o,callback:o.replaceState,args:arguments,queue:i}),!1;o.busy(!0);var s=o.createStateObject(t,n,r),u=o.getHashByState(s),a=o.getState(!1),f=o.getHashByState(a),l=o.getStateByIndex(-2);return o.discardState(a,s,l),u===f?(o.storeState(s),o.expectedStateId=s.id,o.recycleState(s),o.setTitle(s),o.saveState(s),o.Adapter.trigger(e,"statechange"),o.busy(!1)):o.pushState(s.data,s.title,s.url,!1),!0}),o.emulated.pushState&&o.getHash()&&!o.emulated.hashChange&&o.Adapter.onDomLoad(function(){o.Adapter.trigger(e,"hashchange")})},typeof o.init!="undefined"&&o.init()}(window),function(e,t){"use strict";var n=e.console||t,r=e.document,i=e.navigator,s=e.sessionStorage||!1,o=e.setTimeout,u=e.clearTimeout,a=e.setInterval,f=e.clearInterval,l=e.JSON,c=e.alert,h=e.History=e.History||{},p=e.history;try{s.setItem("TEST","1"),s.removeItem("TEST")}catch(d){s=!1}l.stringify=l.stringify||l.encode,l.parse=l.parse||l.decode;if(typeof h.init!="undefined")throw new Error("History.js Core has already been loaded...");h.init=function(e){return typeof h.Adapter=="undefined"?!1:(typeof h.initCore!="undefined"&&h.initCore(),typeof h.initHtml4!="undefined"&&h.initHtml4(),!0)},h.initCore=function(d){if(typeof h.initCore.initialized!="undefined")return!1;h.initCore.initialized=!0,h.options=h.options||{},h.options.hashChangeInterval=h.options.hashChangeInterval||100,h.options.safariPollInterval=h.options.safariPollInterval||500,h.options.doubleCheckInterval=h.options.doubleCheckInterval||500,h.options.disableSuid=h.options.disableSuid||!1,h.options.storeInterval=h.options.storeInterval||1e3,h.options.busyDelay=h.options.busyDelay||250,h.options.debug=h.options.debug||!1,h.options.initialTitle=h.options.initialTitle||r.title,h.options.html4Mode=h.options.html4Mode||!1,h.options.delayInit=h.options.delayInit||!1,h.intervalList=[],h.clearAllIntervals=function(){var e,t=h.intervalList;if(typeof t!="undefined"&&t!==null){for(e=0;e<t.length;e++)f(t[e]);h.intervalList=null}},h.debug=function(){(h.options.debug||!1)&&h.log.apply(h,arguments)},h.log=function(){var e=typeof n!="undefined"&&typeof n.log!="undefined"&&typeof n.log.apply!="undefined",t=r.getElementById("log"),i,s,o,u,a;e?(u=Array.prototype.slice.call(arguments),i=u.shift(),typeof n.debug!="undefined"?n.debug.apply(n,[i,u]):n.log.apply(n,[i,u])):i="\n"+arguments[0]+"\n";for(s=1,o=arguments.length;s<o;++s){a=arguments[s];if(typeof a=="object"&&typeof l!="undefined")try{a=l.stringify(a)}catch(f){}i+="\n"+a+"\n"}return t?(t.value+=i+"\n-----\n",t.scrollTop=t.scrollHeight-t.clientHeight):e||c(i),!0},h.getInternetExplorerMajorVersion=function(){var e=h.getInternetExplorerMajorVersion.cached=typeof h.getInternetExplorerMajorVersion.cached!="undefined"?h.getInternetExplorerMajorVersion.cached:function(){var e=3,t=r.createElement("div"),n=t.getElementsByTagName("i");while((t.innerHTML="<!--[if gt IE "+ ++e+"]><i></i><![endif]-->")&&n[0]);return e>4?e:!1}();return e},h.isInternetExplorer=function(){var e=h.isInternetExplorer.cached=typeof h.isInternetExplorer.cached!="undefined"?h.isInternetExplorer.cached:Boolean(h.getInternetExplorerMajorVersion());return e},h.options.html4Mode?h.emulated={pushState:!0,hashChange:!0}:h.emulated={pushState:!Boolean(e.history&&e.history.pushState&&e.history.replaceState&&!/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(i.userAgent)&&!/AppleWebKit\/5([0-2]|3[0-2])/i.test(i.userAgent)),hashChange:Boolean(!("onhashchange"in e||"onhashchange"in r)||h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8)},h.enabled=!h.emulated.pushState,h.bugs={setHash:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),safariPoll:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),ieDoubleCheck:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8),hashEscape:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<7)},h.isEmptyObject=function(e){for(var t in e)if(e.hasOwnProperty(t))return!1;return!0},h.cloneObject=function(e){var t,n;return e?(t=l.stringify(e),n=l.parse(t)):n={},n},h.getRootUrl=function(){var e=r.location.protocol+"//"+(r.location.hostname||r.location.host);if(r.location.port||!1)e+=":"+r.location.port;return e+="/",e},h.getBaseHref=function(){var e=r.getElementsByTagName("base"),t=null,n="";return e.length===1&&(t=e[0],n=t.href.replace(/[^\/]+$/,"")),n=n.replace(/\/+$/,""),n&&(n+="/"),n},h.getBaseUrl=function(){var e=h.getBaseHref()||h.getBasePageUrl()||h.getRootUrl();return e},h.getPageUrl=function(){var e=h.getState(!1,!1),t=(e||{}).url||h.getLocationHref(),n;return n=t.replace(/\/+$/,"").replace(/[^\/]+$/,function(e,t,n){return/\./.test(e)?e:e+"/"}),n},h.getBasePageUrl=function(){var e=h.getLocationHref().replace(/[#\?].*/,"").replace(/[^\/]+$/,function(e,t,n){return/[^\/]$/.test(e)?"":e}).replace(/\/+$/,"")+"/";return e},h.getFullUrl=function(e,t){var n=e,r=e.substring(0,1);return t=typeof t=="undefined"?!0:t,/[a-z]+\:\/\//.test(e)||(r==="/"?n=h.getRootUrl()+e.replace(/^\/+/,""):r==="#"?n=h.getPageUrl().replace(/#.*/,"")+e:r==="?"?n=h.getPageUrl().replace(/[\?#].*/,"")+e:t?n=h.getBaseUrl()+e.replace(/^(\.\/)+/,""):n=h.getBasePageUrl()+e.replace(/^(\.\/)+/,"")),n.replace(/\#$/,"")},h.getShortUrl=function(e){var t=e,n=h.getBaseUrl(),r=h.getRootUrl();return h.emulated.pushState&&(t=t.replace(n,"")),t=t.replace(r,"/"),h.isTraditionalAnchor(t)&&(t="./"+t),t=t.replace(/^(\.\/)+/g,"./").replace(/\#$/,""),t},h.getLocationHref=function(e){return e=e||r,e.URL===e.location.href?e.location.href:e.location.href===decodeURIComponent(e.URL)?e.URL:e.location.hash&&decodeURIComponent(e.location.href.replace(/^[^#]+/,""))===e.location.hash?e.location.href:e.URL.indexOf("#")==-1&&e.location.href.indexOf("#")!=-1?e.location.href:e.URL||e.location.href},h.store={},h.idToState=h.idToState||{},h.stateToId=h.stateToId||{},h.urlToId=h.urlToId||{},h.storedStates=h.storedStates||[],h.savedStates=h.savedStates||[],h.normalizeStore=function(){h.store.idToState=h.store.idToState||{},h.store.urlToId=h.store.urlToId||{},h.store.stateToId=h.store.stateToId||{}},h.getState=function(e,t){typeof e=="undefined"&&(e=!0),typeof t=="undefined"&&(t=!0);var n=h.getLastSavedState();return!n&&t&&(n=h.createStateObject()),e&&(n=h.cloneObject(n),n.url=n.cleanUrl||n.url),n},h.getIdByState=function(e){var t=h.extractId(e.url),n;if(!t){n=h.getStateString(e);if(typeof h.stateToId[n]!="undefined")t=h.stateToId[n];else if(typeof h.store.stateToId[n]!="undefined")t=h.store.stateToId[n];else{for(;;){t=(new Date).getTime()+String(Math.random()).replace(/\D/g,"");if(typeof h.idToState[t]=="undefined"&&typeof h.store.idToState[t]=="undefined")break}h.stateToId[n]=t,h.idToState[t]=e}}return t},h.normalizeState=function(e){var t,n;if(!e||typeof e!="object")e={};if(typeof e.normalized!="undefined")return e;if(!e.data||typeof e.data!="object")e.data={};return t={},t.normalized=!0,t.title=e.title||"",t.url=h.getFullUrl(e.url?e.url:h.getLocationHref()),t.hash=h.getShortUrl(t.url),t.data=h.cloneObject(e.data),t.id=h.getIdByState(t),t.cleanUrl=t.url.replace(/\??\&_suid.*/,""),t.url=t.cleanUrl,n=!h.isEmptyObject(t.data),(t.title||n)&&h.options.disableSuid!==!0&&(t.hash=h.getShortUrl(t.url).replace(/\??\&_suid.*/,""),/\?/.test(t.hash)||(t.hash+="?"),t.hash+="&_suid="+t.id),t.hashedUrl=h.getFullUrl(t.hash),(h.emulated.pushState||h.bugs.safariPoll)&&h.hasUrlDuplicate(t)&&(t.url=t.hashedUrl),t},h.createStateObject=function(e,t,n){var r={data:e,title:t,url:n};return r=h.normalizeState(r),r},h.getStateById=function(e){e=String(e);var n=h.idToState[e]||h.store.idToState[e]||t;return n},h.getStateString=function(e){var t,n,r;return t=h.normalizeState(e),n={data:t.data,title:e.title,url:e.url},r=l.stringify(n),r},h.getStateId=function(e){var t,n;return t=h.normalizeState(e),n=t.id,n},h.getHashByState=function(e){var t,n;return t=h.normalizeState(e),n=t.hash,n},h.extractId=function(e){var t,n,r,i;return e.indexOf("#")!=-1?i=e.split("#")[0]:i=e,n=/(.*)\&_suid=([0-9]+)$/.exec(i),r=n?n[1]||e:e,t=n?String(n[2]||""):"",t||!1},h.isTraditionalAnchor=function(e){var t=!/[\/\?\.]/.test(e);return t},h.extractState=function(e,t){var n=null,r,i;return t=t||!1,r=h.extractId(e),r&&(n=h.getStateById(r)),n||(i=h.getFullUrl(e),r=h.getIdByUrl(i)||!1,r&&(n=h.getStateById(r)),!n&&t&&!h.isTraditionalAnchor(e)&&(n=h.createStateObject(null,null,i))),n},h.getIdByUrl=function(e){var n=h.urlToId[e]||h.store.urlToId[e]||t;return n},h.getLastSavedState=function(){return h.savedStates[h.savedStates.length-1]||t},h.getLastStoredState=function(){return h.storedStates[h.storedStates.length-1]||t},h.hasUrlDuplicate=function(e){var t=!1,n;return n=h.extractState(e.url),t=n&&n.id!==e.id,t},h.storeState=function(e){return h.urlToId[e.url]=e.id,h.storedStates.push(h.cloneObject(e)),e},h.isLastSavedState=function(e){var t=!1,n,r,i;return h.savedStates.length&&(n=e.id,r=h.getLastSavedState(),i=r.id,t=n===i),t},h.saveState=function(e){return h.isLastSavedState(e)?!1:(h.savedStates.push(h.cloneObject(e)),!0)},h.getStateByIndex=function(e){var t=null;return typeof e=="undefined"?t=h.savedStates[h.savedStates.length-1]:e<0?t=h.savedStates[h.savedStates.length+e]:t=h.savedStates[e],t},h.getCurrentIndex=function(){var e=null;return h.savedStates.length<1?e=0:e=h.savedStates.length-1,e},h.getHash=function(e){var t=h.getLocationHref(e),n;return n=h.getHashByUrl(t),n},h.unescapeHash=function(e){var t=h.normalizeHash(e);return t=decodeURIComponent(t),t},h.normalizeHash=function(e){var t=e.replace(/[^#]*#/,"").replace(/#.*/,"");return t},h.setHash=function(e,t){var n,i;return t!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.setHash,args:arguments,queue:t}),!1):(h.busy(!0),n=h.extractState(e,!0),n&&!h.emulated.pushState?h.pushState(n.data,n.title,n.url,!1):h.getHash()!==e&&(h.bugs.setHash?(i=h.getPageUrl(),h.pushState(null,null,i+"#"+e,!1)):r.location.hash=e),h)},h.escapeHash=function(t){var n=h.normalizeHash(t);return n=e.encodeURIComponent(n),h.bugs.hashEscape||(n=n.replace(/\%21/g,"!").replace(/\%26/g,"&").replace(/\%3D/g,"=").replace(/\%3F/g,"?")),n},h.getHashByUrl=function(e){var t=String(e).replace(/([^#]*)#?([^#]*)#?(.*)/,"$2");return t=h.unescapeHash(t),t},h.setTitle=function(e){var t=e.title,n;t||(n=h.getStateByIndex(0),n&&n.url===e.url&&(t=n.title||h.options.initialTitle));try{r.getElementsByTagName("title")[0].innerHTML=t.replace("<","&lt;").replace(">","&gt;").replace(" & "," &amp; ")}catch(i){}return r.title=t,h},h.queues=[],h.busy=function(e){typeof e!="undefined"?h.busy.flag=e:typeof h.busy.flag=="undefined"&&(h.busy.flag=!1);if(!h.busy.flag){u(h.busy.timeout);var t=function(){var e,n,r;if(h.busy.flag)return;for(e=h.queues.length-1;e>=0;--e){n=h.queues[e];if(n.length===0)continue;r=n.shift(),h.fireQueueItem(r),h.busy.timeout=o(t,h.options.busyDelay)}};h.busy.timeout=o(t,h.options.busyDelay)}return h.busy.flag},h.busy.flag=!1,h.fireQueueItem=function(e){return e.callback.apply(e.scope||h,e.args||[])},h.pushQueue=function(e){return h.queues[e.queue||0]=h.queues[e.queue||0]||[],h.queues[e.queue||0].push(e),h},h.queue=function(e,t){return typeof e=="function"&&(e={callback:e}),typeof t!="undefined"&&(e.queue=t),h.busy()?h.pushQueue(e):h.fireQueueItem(e),h},h.clearQueue=function(){return h.busy.flag=!1,h.queues=[],h},h.stateChanged=!1,h.doubleChecker=!1,h.doubleCheckComplete=function(){return h.stateChanged=!0,h.doubleCheckClear(),h},h.doubleCheckClear=function(){return h.doubleChecker&&(u(h.doubleChecker),h.doubleChecker=!1),h},h.doubleCheck=function(e){return h.stateChanged=!1,h.doubleCheckClear(),h.bugs.ieDoubleCheck&&(h.doubleChecker=o(function(){return h.doubleCheckClear(),h.stateChanged||e(),!0},h.options.doubleCheckInterval)),h},h.safariStatePoll=function(){var t=h.extractState(h.getLocationHref()),n;if(!h.isLastSavedState(t))return n=t,n||(n=h.createStateObject()),h.Adapter.trigger(e,"popstate"),h;return},h.back=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.back,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.back(!1)}),p.go(-1),!0)},h.forward=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.forward,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.forward(!1)}),p.go(1),!0)},h.go=function(e,t){var n;if(e>0)for(n=1;n<=e;++n)h.forward(t);else{if(!(e<0))throw new Error("History.go: History.go requires a positive or negative integer passed.");for(n=-1;n>=e;--n)h.back(t)}return h};if(h.emulated.pushState){var v=function(){};h.pushState=h.pushState||v,h.replaceState=h.replaceState||v}else h.onPopState=function(t,n){var r=!1,i=!1,s,o;return h.doubleCheckComplete(),s=h.getHash(),s?(o=h.extractState(s||h.getLocationHref(),!0),o?h.replaceState(o.data,o.title,o.url,!1):(h.Adapter.trigger(e,"anchorchange"),h.busy(!1)),h.expectedStateId=!1,!1):(r=h.Adapter.extractEventData("state",t,n)||!1,r?i=h.getStateById(r):h.expectedStateId?i=h.getStateById(h.expectedStateId):i=h.extractState(h.getLocationHref()),i||(i=h.createStateObject(null,null,h.getLocationHref())),h.expectedStateId=!1,h.isLastSavedState(i)?(h.busy(!1),!1):(h.storeState(i),h.saveState(i),h.setTitle(i),h.Adapter.trigger(e,"statechange"),h.busy(!1),!0))},h.Adapter.bind(e,"popstate",h.onPopState),h.pushState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.pushState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.pushState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0},h.replaceState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.replaceState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.replaceState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0};if(s){try{h.store=l.parse(s.getItem("History.store"))||{}}catch(m){h.store={}}h.normalizeStore()}else h.store={},h.normalizeStore();h.Adapter.bind(e,"unload",h.clearAllIntervals),h.saveState(h.storeState(h.extractState(h.getLocationHref(),!0))),s&&(h.onUnload=function(){var e,t,n;try{e=l.parse(s.getItem("History.store"))||{}}catch(r){e={}}e.idToState=e.idToState||{},e.urlToId=e.urlToId||{},e.stateToId=e.stateToId||{};for(t in h.idToState){if(!h.idToState.hasOwnProperty(t))continue;e.idToState[t]=h.idToState[t]}for(t in h.urlToId){if(!h.urlToId.hasOwnProperty(t))continue;e.urlToId[t]=h.urlToId[t]}for(t in h.stateToId){if(!h.stateToId.hasOwnProperty(t))continue;e.stateToId[t]=h.stateToId[t]}h.store=e,h.normalizeStore(),n=l.stringify(e);try{s.setItem("History.store",n)}catch(i){if(i.code!==DOMException.QUOTA_EXCEEDED_ERR)throw i;s.length&&(s.removeItem("History.store"),s.setItem("History.store",n))}},h.intervalList.push(a(h.onUnload,h.options.storeInterval)),h.Adapter.bind(e,"beforeunload",h.onUnload),h.Adapter.bind(e,"unload",h.onUnload));if(!h.emulated.pushState){h.bugs.safariPoll&&h.intervalList.push(a(h.safariStatePoll,h.options.safariPollInterval));if(i.vendor==="Apple Computer, Inc."||(i.appCodeName||"")==="Mozilla")h.Adapter.bind(e,"hashchange",function(){h.Adapter.trigger(e,"popstate")}),h.getHash()&&h.Adapter.onDomLoad(function(){h.Adapter.trigger(e,"hashchange")})}},(!h.options||!h.options.delayInit)&&h.init()}(window)
/**
 * Copyright (c) 2007-2014 Ariel Flesler - aflesler<a>gmail<d>com | http://flesler.blogspot.com
 * Licensed under MIT
 * @author Ariel Flesler
 * @version 1.4.11
 */
;(function(a){if(typeof define==='function'&&define.amd){define(['jquery'],a)}else{a(jQuery)}}(function($){var j=$.scrollTo=function(a,b,c){return $(window).scrollTo(a,b,c)};j.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};j.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(f,g,h){if(typeof g=='object'){h=g;g=0}if(typeof h=='function')h={onAfter:h};if(f=='max')f=9e9;h=$.extend({},j.defaults,h);g=g||h.duration;h.queue=h.queue&&h.axis.length>1;if(h.queue)g/=2;h.offset=both(h.offset);h.over=both(h.over);return this._scrollable().each(function(){if(f==null)return;var d=this,$elem=$(d),targ=f,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}var e=$.isFunction(h.offset)&&h.offset(d,targ)||h.offset;$.each(h.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=j.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(h.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=e[pos]||0;if(h.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*h.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(h.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&h.queue){if(old!=attr[key])animate(h.onAfterFirst);delete attr[key]}});animate(h.onAfter);function animate(a){$elem.animate(attr,g,h.easing,a&&function(){a.call(this,targ,h)})}}).end()};j.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return $.isFunction(a)||typeof a=='object'?a:{top:a,left:a}};return j}));

/*!
* MediaElement.js
* HTML5 <video> and <audio> shim and player
* http://mediaelementjs.com/
*
* Creates a JavaScript object that mimics HTML5 MediaElement API
* for browsers that don't understand HTML5 or can't play the provided codec
* Can play MP4 (H.264), Ogg, WebM, FLV, WMV, WMA, ACC, and MP3
*
* Copyright 2010-2014, John Dyer (http://j.hn)
* License: MIT
*
*/
// Namespace
var mejs = mejs || {};

// version number
mejs.version = '2.15.1'; 


// player number (for missing, same id attr)
mejs.meIndex = 0;

// media types accepted by plugins
mejs.plugins = {
	silverlight: [
		{version: [3,0], types: ['video/mp4','video/m4v','video/mov','video/wmv','audio/wma','audio/m4a','audio/mp3','audio/wav','audio/mpeg']}
	],
	flash: [
		{version: [9,0,124], types: ['video/mp4','video/m4v','video/mov','video/flv','video/rtmp','video/x-flv','audio/flv','audio/x-flv','audio/mp3','audio/m4a','audio/mpeg', 'video/youtube', 'video/x-youtube', 'application/x-mpegURL']}
		//,{version: [12,0], types: ['video/webm']} // for future reference (hopefully!)
	],
	youtube: [
		{version: null, types: ['video/youtube', 'video/x-youtube', 'audio/youtube', 'audio/x-youtube']}
	],
	vimeo: [
		{version: null, types: ['video/vimeo', 'video/x-vimeo']}
	]
};

/*
Utility methods
*/
mejs.Utility = {
	encodeUrl: function(url) {
		return encodeURIComponent(url); //.replace(/\?/gi,'%3F').replace(/=/gi,'%3D').replace(/&/gi,'%26');
	},
	escapeHTML: function(s) {
		return s.toString().split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
	},
	absolutizeUrl: function(url) {
		var el = document.createElement('div');
		el.innerHTML = '<a href="' + this.escapeHTML(url) + '">x</a>';
		return el.firstChild.href;
	},
	getScriptPath: function(scriptNames) {
		var
			i = 0,
			j,
			codePath = '',
			testname = '',
			slashPos,
			filenamePos,
			scriptUrl,
			scriptPath,			
			scriptFilename,
			scripts = document.getElementsByTagName('script'),
			il = scripts.length,
			jl = scriptNames.length;
			
		// go through all <script> tags
		for (; i < il; i++) {
			scriptUrl = scripts[i].src;
			slashPos = scriptUrl.lastIndexOf('/');
			if (slashPos > -1) {
				scriptFilename = scriptUrl.substring(slashPos + 1);
				scriptPath = scriptUrl.substring(0, slashPos + 1);
			} else {
				scriptFilename = scriptUrl;
				scriptPath = '';			
			}
			
			// see if any <script> tags have a file name that matches the 
			for (j = 0; j < jl; j++) {
				testname = scriptNames[j];
				filenamePos = scriptFilename.indexOf(testname);
				if (filenamePos > -1) {
					codePath = scriptPath;
					break;
				}
			}
			
			// if we found a path, then break and return it
			if (codePath !== '') {
				break;
			}
		}
		
		// send the best path back
		return codePath;
	},
	secondsToTimeCode: function(time, forceHours, showFrameCount, fps) {
		//add framecount
		if (typeof showFrameCount == 'undefined') {
		    showFrameCount=false;
		} else if(typeof fps == 'undefined') {
		    fps = 25;
		}
	
		var hours = Math.floor(time / 3600) % 24,
			minutes = Math.floor(time / 60) % 60,
			seconds = Math.floor(time % 60),
			frames = Math.floor(((time % 1)*fps).toFixed(3)),
			result = 
					( (forceHours || hours > 0) ? (hours < 10 ? '0' + hours : hours) + ':' : '')
						+ (minutes < 10 ? '0' + minutes : minutes) + ':'
						+ (seconds < 10 ? '0' + seconds : seconds)
						+ ((showFrameCount) ? ':' + (frames < 10 ? '0' + frames : frames) : '');
	
		return result;
	},
	
	timeCodeToSeconds: function(hh_mm_ss_ff, forceHours, showFrameCount, fps){
		if (typeof showFrameCount == 'undefined') {
		    showFrameCount=false;
		} else if(typeof fps == 'undefined') {
		    fps = 25;
		}
	
		var tc_array = hh_mm_ss_ff.split(":"),
			tc_hh = parseInt(tc_array[0], 10),
			tc_mm = parseInt(tc_array[1], 10),
			tc_ss = parseInt(tc_array[2], 10),
			tc_ff = 0,
			tc_in_seconds = 0;
		
		if (showFrameCount) {
		    tc_ff = parseInt(tc_array[3])/fps;
		}
		
		tc_in_seconds = ( tc_hh * 3600 ) + ( tc_mm * 60 ) + tc_ss + tc_ff;
		
		return tc_in_seconds;
	},
	

	convertSMPTEtoSeconds: function (SMPTE) {
		if (typeof SMPTE != 'string') 
			return false;

		SMPTE = SMPTE.replace(',', '.');
		
		var secs = 0,
			decimalLen = (SMPTE.indexOf('.') != -1) ? SMPTE.split('.')[1].length : 0,
			multiplier = 1;
		
		SMPTE = SMPTE.split(':').reverse();
		
		for (var i = 0; i < SMPTE.length; i++) {
			multiplier = 1;
			if (i > 0) {
				multiplier = Math.pow(60, i); 
			}
			secs += Number(SMPTE[i]) * multiplier;
		}
		return Number(secs.toFixed(decimalLen));
	},	
	
	/* borrowed from SWFObject: http://code.google.com/p/swfobject/source/browse/trunk/swfobject/src/swfobject.js#474 */
	removeSwf: function(id) {
		var obj = document.getElementById(id);
		if (obj && /object|embed/i.test(obj.nodeName)) {
			if (mejs.MediaFeatures.isIE) {
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						mejs.Utility.removeObjectInIE(id);
					} else {
						setTimeout(arguments.callee, 10);
					}
				})();
			} else {
				obj.parentNode.removeChild(obj);
			}
		}
	},
	removeObjectInIE: function(id) {
		var obj = document.getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}		
	}
};


// Core detector, plugins are added below
mejs.PluginDetector = {

	// main public function to test a plug version number PluginDetector.hasPluginVersion('flash',[9,0,125]);
	hasPluginVersion: function(plugin, v) {
		var pv = this.plugins[plugin];
		v[1] = v[1] || 0;
		v[2] = v[2] || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	},

	// cached values
	nav: window.navigator,
	ua: window.navigator.userAgent.toLowerCase(),

	// stored version numbers
	plugins: [],

	// runs detectPlugin() and stores the version number
	addPlugin: function(p, pluginName, mimeType, activeX, axDetect) {
		this.plugins[p] = this.detectPlugin(pluginName, mimeType, activeX, axDetect);
	},

	// get the version number from the mimetype (all but IE) or ActiveX (IE)
	detectPlugin: function(pluginName, mimeType, activeX, axDetect) {

		var version = [0,0,0],
			description,
			i,
			ax;

		// Firefox, Webkit, Opera
		if (typeof(this.nav.plugins) != 'undefined' && typeof this.nav.plugins[pluginName] == 'object') {
			description = this.nav.plugins[pluginName].description;
			if (description && !(typeof this.nav.mimeTypes != 'undefined' && this.nav.mimeTypes[mimeType] && !this.nav.mimeTypes[mimeType].enabledPlugin)) {
				version = description.replace(pluginName, '').replace(/^\s+/,'').replace(/\sr/gi,'.').split('.');
				for (i=0; i<version.length; i++) {
					version[i] = parseInt(version[i].match(/\d+/), 10);
				}
			}
		// Internet Explorer / ActiveX
		} else if (typeof(window.ActiveXObject) != 'undefined') {
			try {
				ax = new ActiveXObject(activeX);
				if (ax) {
					version = axDetect(ax);
				}
			}
			catch (e) { }
		}
		return version;
	}
};

// Add Flash detection
mejs.PluginDetector.addPlugin('flash','Shockwave Flash','application/x-shockwave-flash','ShockwaveFlash.ShockwaveFlash', function(ax) {
	// adapted from SWFObject
	var version = [],
		d = ax.GetVariable("$version");
	if (d) {
		d = d.split(" ")[1].split(",");
		version = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
	}
	return version;
});

// Add Silverlight detection
mejs.PluginDetector.addPlugin('silverlight','Silverlight Plug-In','application/x-silverlight-2','AgControl.AgControl', function (ax) {
	// Silverlight cannot report its version number to IE
	// but it does have a isVersionSupported function, so we have to loop through it to get a version number.
	// adapted from http://www.silverlightversion.com/
	var v = [0,0,0,0],
		loopMatch = function(ax, v, i, n) {
			while(ax.isVersionSupported(v[0]+ "."+ v[1] + "." + v[2] + "." + v[3])){
				v[i]+=n;
			}
			v[i] -= n;
		};
	loopMatch(ax, v, 0, 1);
	loopMatch(ax, v, 1, 1);
	loopMatch(ax, v, 2, 10000); // the third place in the version number is usually 5 digits (4.0.xxxxx)
	loopMatch(ax, v, 2, 1000);
	loopMatch(ax, v, 2, 100);
	loopMatch(ax, v, 2, 10);
	loopMatch(ax, v, 2, 1);
	loopMatch(ax, v, 3, 1);

	return v;
});
// add adobe acrobat
/*
PluginDetector.addPlugin('acrobat','Adobe Acrobat','application/pdf','AcroPDF.PDF', function (ax) {
	var version = [],
		d = ax.GetVersions().split(',')[0].split('=')[1].split('.');

	if (d) {
		version = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
	}
	return version;
});
*/
// necessary detection (fixes for <IE9)
mejs.MediaFeatures = {
	init: function() {
		var
			t = this,
			d = document,
			nav = mejs.PluginDetector.nav,
			ua = mejs.PluginDetector.ua.toLowerCase(),
			i,
			v,
			html5Elements = ['source','track','audio','video'];

		// detect browsers (only the ones that have some kind of quirk we need to work around)
		t.isiPad = (ua.match(/ipad/i) !== null);
		t.isiPhone = (ua.match(/iphone/i) !== null);
		t.isiOS = t.isiPhone || t.isiPad;
		t.isAndroid = (ua.match(/android/i) !== null);
		t.isBustedAndroid = (ua.match(/android 2\.[12]/) !== null);
		t.isBustedNativeHTTPS = (location.protocol === 'https:' && (ua.match(/android [12]\./) !== null || ua.match(/macintosh.* version.* safari/) !== null));
		t.isIE = (nav.appName.toLowerCase().indexOf("microsoft") != -1 || nav.appName.toLowerCase().match(/trident/gi) !== null);
		t.isChrome = (ua.match(/chrome/gi) !== null);
		t.isChromium = (ua.match(/chromium/gi) !== null);
		t.isFirefox = (ua.match(/firefox/gi) !== null);
		t.isWebkit = (ua.match(/webkit/gi) !== null);
		t.isGecko = (ua.match(/gecko/gi) !== null) && !t.isWebkit && !t.isIE;
		t.isOpera = (ua.match(/opera/gi) !== null);
		t.hasTouch = ('ontouchstart' in window); //  && window.ontouchstart != null); // this breaks iOS 7
		
		// borrowed from Modernizr
		t.svg = !! document.createElementNS &&
				!! document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect;

		// create HTML5 media elements for IE before 9, get a <video> element for fullscreen detection
		for (i=0; i<html5Elements.length; i++) {
			v = document.createElement(html5Elements[i]);
		}
		
		t.supportsMediaTag = (typeof v.canPlayType !== 'undefined' || t.isBustedAndroid);

		// Fix for IE9 on Windows 7N / Windows 7KN (Media Player not installer)
		try{
			v.canPlayType("video/mp4");
		}catch(e){
			t.supportsMediaTag = false;
		}

		// detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)
		
		// iOS
		t.hasSemiNativeFullScreen = (typeof v.webkitEnterFullscreen !== 'undefined');
		
		// W3C
		t.hasNativeFullscreen = (typeof v.requestFullscreen !== 'undefined');
		
		// webkit/firefox/IE11+
		t.hasWebkitNativeFullScreen = (typeof v.webkitRequestFullScreen !== 'undefined');
		t.hasMozNativeFullScreen = (typeof v.mozRequestFullScreen !== 'undefined');
		t.hasMsNativeFullScreen = (typeof v.msRequestFullscreen !== 'undefined');
		
		t.hasTrueNativeFullScreen = (t.hasWebkitNativeFullScreen || t.hasMozNativeFullScreen || t.hasMsNativeFullScreen);
		t.nativeFullScreenEnabled = t.hasTrueNativeFullScreen;
		
		// Enabled?
		if (t.hasMozNativeFullScreen) {
			t.nativeFullScreenEnabled = document.mozFullScreenEnabled;
		} else if (t.hasMsNativeFullScreen) {
			t.nativeFullScreenEnabled = document.msFullscreenEnabled;		
		}
		
		if (t.isChrome) {
			t.hasSemiNativeFullScreen = false;
		}
		
		if (t.hasTrueNativeFullScreen) {
			
			t.fullScreenEventName = '';
			if (t.hasWebkitNativeFullScreen) { 
				t.fullScreenEventName = 'webkitfullscreenchange';
				
			} else if (t.hasMozNativeFullScreen) {
				t.fullScreenEventName = 'mozfullscreenchange';
				
			} else if (t.hasMsNativeFullScreen) {
				t.fullScreenEventName = 'MSFullscreenChange';
			}
			
			t.isFullScreen = function() {
				if (t.hasMozNativeFullScreen) {
					return d.mozFullScreen;
				
				} else if (t.hasWebkitNativeFullScreen) {
					return d.webkitIsFullScreen;
				
				} else if (t.hasMsNativeFullScreen) {
					return d.msFullscreenElement !== null;
				}
			}
					
			t.requestFullScreen = function(el) {
		
				if (t.hasWebkitNativeFullScreen) {
					el.webkitRequestFullScreen();
					
				} else if (t.hasMozNativeFullScreen) {
					el.mozRequestFullScreen();

				} else if (t.hasMsNativeFullScreen) {
					el.msRequestFullscreen();

				}
			}
			
			t.cancelFullScreen = function() {				
				if (t.hasWebkitNativeFullScreen) {
					document.webkitCancelFullScreen();
					
				} else if (t.hasMozNativeFullScreen) {
					document.mozCancelFullScreen();
					
				} else if (t.hasMsNativeFullScreen) {
					document.msExitFullscreen();
					
				}
			}	
			
		}
		
		
		// OS X 10.5 can't do this even if it says it can :(
		if (t.hasSemiNativeFullScreen && ua.match(/mac os x 10_5/i)) {
			t.hasNativeFullScreen = false;
			t.hasSemiNativeFullScreen = false;
		}
		
	}
};
mejs.MediaFeatures.init();

/*
extension methods to <video> or <audio> object to bring it into parity with PluginMediaElement (see below)
*/
mejs.HtmlMediaElement = {
	pluginType: 'native',
	isFullScreen: false,

	setCurrentTime: function (time) {
		this.currentTime = time;
	},

	setMuted: function (muted) {
		this.muted = muted;
	},

	setVolume: function (volume) {
		this.volume = volume;
	},

	// for parity with the plugin versions
	stop: function () {
		this.pause();
	},

	// This can be a url string
	// or an array [{src:'file.mp4',type:'video/mp4'},{src:'file.webm',type:'video/webm'}]
	setSrc: function (url) {
		
		// Fix for IE9 which can't set .src when there are <source> elements. Awesome, right?
		var 
			existingSources = this.getElementsByTagName('source');
		while (existingSources.length > 0){
			this.removeChild(existingSources[0]);
		}
	
		if (typeof url == 'string') {
			this.src = url;
		} else {
			var i, media;

			for (i=0; i<url.length; i++) {
				media = url[i];
				if (this.canPlayType(media.type)) {
					this.src = media.src;
					break;
				}
			}
		}
	},

	setVideoSize: function (width, height) {
		this.width = width;
		this.height = height;
	}
};

/*
Mimics the <video/audio> element by calling Flash's External Interface or Silverlights [ScriptableMember]
*/
mejs.PluginMediaElement = function (pluginid, pluginType, mediaUrl) {
	this.id = pluginid;
	this.pluginType = pluginType;
	this.src = mediaUrl;
	this.events = {};
	this.attributes = {};
};

// JavaScript values and ExternalInterface methods that match HTML5 video properties methods
// http://www.adobe.com/livedocs/flash/9.0/ActionScriptLangRefV3/fl/video/FLVPlayback.html
// http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html
mejs.PluginMediaElement.prototype = {

	// special
	pluginElement: null,
	pluginType: '',
	isFullScreen: false,

	// not implemented :(
	playbackRate: -1,
	defaultPlaybackRate: -1,
	seekable: [],
	played: [],

	// HTML5 read-only properties
	paused: true,
	ended: false,
	seeking: false,
	duration: 0,
	error: null,
	tagName: '',

	// HTML5 get/set properties, but only set (updated by event handlers)
	muted: false,
	volume: 1,
	currentTime: 0,

	// HTML5 methods
	play: function () {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube' || this.pluginType == 'vimeo') {
				this.pluginApi.playVideo();
			} else {
				this.pluginApi.playMedia();
			}
			this.paused = false;
		}
	},
	load: function () {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube' || this.pluginType == 'vimeo') {
			} else {
				this.pluginApi.loadMedia();
			}
			
			this.paused = false;
		}
	},
	pause: function () {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube' || this.pluginType == 'vimeo') {
				this.pluginApi.pauseVideo();
			} else {
				this.pluginApi.pauseMedia();
			}			
			
			
			this.paused = true;
		}
	},
	stop: function () {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube' || this.pluginType == 'vimeo') {
				this.pluginApi.stopVideo();
			} else {
				this.pluginApi.stopMedia();
			}	
			this.paused = true;
		}
	},
	canPlayType: function(type) {
		var i,
			j,
			pluginInfo,
			pluginVersions = mejs.plugins[this.pluginType];

		for (i=0; i<pluginVersions.length; i++) {
			pluginInfo = pluginVersions[i];

			// test if user has the correct plugin version
			if (mejs.PluginDetector.hasPluginVersion(this.pluginType, pluginInfo.version)) {

				// test for plugin playback types
				for (j=0; j<pluginInfo.types.length; j++) {
					// find plugin that can play the type
					if (type == pluginInfo.types[j]) {
						return 'probably';
					}
				}
			}
		}

		return '';
	},
	
	positionFullscreenButton: function(x,y,visibleAndAbove) {
		if (this.pluginApi != null && this.pluginApi.positionFullscreenButton) {
			this.pluginApi.positionFullscreenButton(Math.floor(x),Math.floor(y),visibleAndAbove);
		}
	},
	
	hideFullscreenButton: function() {
		if (this.pluginApi != null && this.pluginApi.hideFullscreenButton) {
			this.pluginApi.hideFullscreenButton();
		}		
	},	
	

	// custom methods since not all JavaScript implementations support get/set

	// This can be a url string
	// or an array [{src:'file.mp4',type:'video/mp4'},{src:'file.webm',type:'video/webm'}]
	setSrc: function (url) {
		if (typeof url == 'string') {
			this.pluginApi.setSrc(mejs.Utility.absolutizeUrl(url));
			this.src = mejs.Utility.absolutizeUrl(url);
		} else {
			var i, media;

			for (i=0; i<url.length; i++) {
				media = url[i];
				if (this.canPlayType(media.type)) {
					this.pluginApi.setSrc(mejs.Utility.absolutizeUrl(media.src));
					this.src = mejs.Utility.absolutizeUrl(url);
					break;
				}
			}
		}

	},
	setCurrentTime: function (time) {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube' || this.pluginType == 'vimeo') {
				this.pluginApi.seekTo(time);
			} else {
				this.pluginApi.setCurrentTime(time);
			}				
			
			
			
			this.currentTime = time;
		}
	},
	setVolume: function (volume) {
		if (this.pluginApi != null) {
			// same on YouTube and MEjs
			if (this.pluginType == 'youtube') {
				this.pluginApi.setVolume(volume * 100);
			} else {
				this.pluginApi.setVolume(volume);
			}
			this.volume = volume;
		}
	},
	setMuted: function (muted) {
		if (this.pluginApi != null) {
			if (this.pluginType == 'youtube') {
				if (muted) {
					this.pluginApi.mute();
				} else {
					this.pluginApi.unMute();
				}
				this.muted = muted;
				this.dispatchEvent('volumechange');
			} else {
				this.pluginApi.setMuted(muted);
			}
			this.muted = muted;
		}
	},

	// additional non-HTML5 methods
	setVideoSize: function (width, height) {
		
		//if (this.pluginType == 'flash' || this.pluginType == 'silverlight') {
			if (this.pluginElement && this.pluginElement.style) {
				this.pluginElement.style.width = width + 'px';
				this.pluginElement.style.height = height + 'px';
			}
			if (this.pluginApi != null && this.pluginApi.setVideoSize) {
				this.pluginApi.setVideoSize(width, height);
			}
		//}
	},

	setFullscreen: function (fullscreen) {
		if (this.pluginApi != null && this.pluginApi.setFullscreen) {
			this.pluginApi.setFullscreen(fullscreen);
		}
	},
	
	enterFullScreen: function() {
		if (this.pluginApi != null && this.pluginApi.setFullscreen) {
			this.setFullscreen(true);
		}		
		
	},
	
	exitFullScreen: function() {
		if (this.pluginApi != null && this.pluginApi.setFullscreen) {
			this.setFullscreen(false);
		}
	},	

	// start: fake events
	addEventListener: function (eventName, callback, bubble) {
		this.events[eventName] = this.events[eventName] || [];
		this.events[eventName].push(callback);
	},
	removeEventListener: function (eventName, callback) {
		if (!eventName) { this.events = {}; return true; }
		var callbacks = this.events[eventName];
		if (!callbacks) return true;
		if (!callback) { this.events[eventName] = []; return true; }
		for (var i = 0; i < callbacks.length; i++) {
			if (callbacks[i] === callback) {
				this.events[eventName].splice(i, 1);
				return true;
			}
		}
		return false;
	},	
	dispatchEvent: function (eventName) {
		var i,
			args,
			callbacks = this.events[eventName];

		if (callbacks) {
			args = Array.prototype.slice.call(arguments, 1);
			for (i = 0; i < callbacks.length; i++) {
				callbacks[i].apply(null, args);
			}
		}
	},
	// end: fake events
	
	// fake DOM attribute methods
	hasAttribute: function(name){
		return (name in this.attributes);  
	},
	removeAttribute: function(name){
		delete this.attributes[name];
	},
	getAttribute: function(name){
		if (this.hasAttribute(name)) {
			return this.attributes[name];
		}
		return '';
	},
	setAttribute: function(name, value){
		this.attributes[name] = value;
	},

	remove: function() {
		mejs.Utility.removeSwf(this.pluginElement.id);
		mejs.MediaPluginBridge.unregisterPluginElement(this.pluginElement.id);
	}
};

// Handles calls from Flash/Silverlight and reports them as native <video/audio> events and properties
mejs.MediaPluginBridge = {

	pluginMediaElements:{},
	htmlMediaElements:{},

	registerPluginElement: function (id, pluginMediaElement, htmlMediaElement) {
		this.pluginMediaElements[id] = pluginMediaElement;
		this.htmlMediaElements[id] = htmlMediaElement;
	},

	unregisterPluginElement: function (id) {
		delete this.pluginMediaElements[id];
		delete this.htmlMediaElements[id];
	},

	// when Flash/Silverlight is ready, it calls out to this method
	initPlugin: function (id) {

		var pluginMediaElement = this.pluginMediaElements[id],
			htmlMediaElement = this.htmlMediaElements[id];

		if (pluginMediaElement) {
			// find the javascript bridge
			switch (pluginMediaElement.pluginType) {
				case "flash":
					pluginMediaElement.pluginElement = pluginMediaElement.pluginApi = document.getElementById(id);
					break;
				case "silverlight":
					pluginMediaElement.pluginElement = document.getElementById(pluginMediaElement.id);
					pluginMediaElement.pluginApi = pluginMediaElement.pluginElement.Content.MediaElementJS;
					break;
			}
	
			if (pluginMediaElement.pluginApi != null && pluginMediaElement.success) {
				pluginMediaElement.success(pluginMediaElement, htmlMediaElement);
			}
		}
	},

	// receives events from Flash/Silverlight and sends them out as HTML5 media events
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html
	fireEvent: function (id, eventName, values) {

		var
			e,
			i,
			bufferedTime,
			pluginMediaElement = this.pluginMediaElements[id];

		if(!pluginMediaElement){
            return;
        }
        
		// fake event object to mimic real HTML media event.
		e = {
			type: eventName,
			target: pluginMediaElement
		};

		// attach all values to element and event object
		for (i in values) {
			pluginMediaElement[i] = values[i];
			e[i] = values[i];
		}

		// fake the newer W3C buffered TimeRange (loaded and total have been removed)
		bufferedTime = values.bufferedTime || 0;

		e.target.buffered = e.buffered = {
			start: function(index) {
				return 0;
			},
			end: function (index) {
				return bufferedTime;
			},
			length: 1
		};

		pluginMediaElement.dispatchEvent(e.type, e);
	}
};

/*
Default options
*/
mejs.MediaElementDefaults = {
	// allows testing on HTML5, flash, silverlight
	// auto: attempts to detect what the browser can do
	// auto_plugin: prefer plugins and then attempt native HTML5
	// native: forces HTML5 playback
	// shim: disallows HTML5, will attempt either Flash or Silverlight
	// none: forces fallback view
	mode: 'auto',
	// remove or reorder to change plugin priority and availability
	plugins: ['flash','silverlight','youtube','vimeo'],
	// shows debug errors on screen
	enablePluginDebug: false,
	// use plugin for browsers that have trouble with Basic Authentication on HTTPS sites
	httpsBasicAuthSite: false,
	// overrides the type specified, useful for dynamic instantiation
	type: '',
	// path to Flash and Silverlight plugins
	pluginPath: mejs.Utility.getScriptPath(['mediaelement.js','mediaelement.min.js','mediaelement-and-player.js','mediaelement-and-player.min.js']),
	// name of flash file
	flashName: 'flashmediaelement.swf',
	// streamer for RTMP streaming
	flashStreamer: '',
	// turns on the smoothing filter in Flash
	enablePluginSmoothing: false,
	// enabled pseudo-streaming (seek) on .mp4 files
	enablePseudoStreaming: false,
	// start query parameter sent to server for pseudo-streaming
	pseudoStreamingStartQueryParam: 'start',
	// name of silverlight file
	silverlightName: 'silverlightmediaelement.xap',
	// default if the <video width> is not specified
	defaultVideoWidth: 480,
	// default if the <video height> is not specified
	defaultVideoHeight: 270,
	// overrides <video width>
	pluginWidth: -1,
	// overrides <video height>
	pluginHeight: -1,
	// additional plugin variables in 'key=value' form
	pluginVars: [],	
	// rate in milliseconds for Flash and Silverlight to fire the timeupdate event
	// larger number is less accurate, but less strain on plugin->JavaScript bridge
	timerRate: 250,
	// initial volume for player
	startVolume: 0.8,
	success: function () { },
	error: function () { }
};

/*
Determines if a browser supports the <video> or <audio> element
and returns either the native element or a Flash/Silverlight version that
mimics HTML5 MediaElement
*/
mejs.MediaElement = function (el, o) {
	return mejs.HtmlMediaElementShim.create(el,o);
};

mejs.HtmlMediaElementShim = {

	create: function(el, o) {
		var
			options = mejs.MediaElementDefaults,
			htmlMediaElement = (typeof(el) == 'string') ? document.getElementById(el) : el,
			tagName = htmlMediaElement.tagName.toLowerCase(),
			isMediaTag = (tagName === 'audio' || tagName === 'video'),
			src = (isMediaTag) ? htmlMediaElement.getAttribute('src') : htmlMediaElement.getAttribute('href'),
			poster = htmlMediaElement.getAttribute('poster'),
			autoplay =  htmlMediaElement.getAttribute('autoplay'),
			preload =  htmlMediaElement.getAttribute('preload'),
			controls =  htmlMediaElement.getAttribute('controls'),
			playback,
			prop;

		// extend options
		for (prop in o) {
			options[prop] = o[prop];
		}

		// clean up attributes
		src = 		(typeof src == 'undefined' 	|| src === null || src == '') ? null : src;		
		poster =	(typeof poster == 'undefined' 	|| poster === null) ? '' : poster;
		preload = 	(typeof preload == 'undefined' 	|| preload === null || preload === 'false') ? 'none' : preload;
		autoplay = 	!(typeof autoplay == 'undefined' || autoplay === null || autoplay === 'false');
		controls = 	!(typeof controls == 'undefined' || controls === null || controls === 'false');

		// test for HTML5 and plugin capabilities
		playback = this.determinePlayback(htmlMediaElement, options, mejs.MediaFeatures.supportsMediaTag, isMediaTag, src);
		playback.url = (playback.url !== null) ? mejs.Utility.absolutizeUrl(playback.url) : '';

		if (playback.method == 'native') {
			// second fix for android
			if (mejs.MediaFeatures.isBustedAndroid) {
				htmlMediaElement.src = playback.url;
				htmlMediaElement.addEventListener('click', function() {
					htmlMediaElement.play();
				}, false);
			}
		
			// add methods to native HTMLMediaElement
			return this.updateNative(playback, options, autoplay, preload);
		} else if (playback.method !== '') {
			// create plugin to mimic HTMLMediaElement
			
			return this.createPlugin( playback,  options, poster, autoplay, preload, controls);
		} else {
			// boo, no HTML5, no Flash, no Silverlight.
			this.createErrorMessage( playback, options, poster );
			
			return this;
		}
	},
	
	determinePlayback: function(htmlMediaElement, options, supportsMediaTag, isMediaTag, src) {
		var
			mediaFiles = [],
			i,
			j,
			k,
			l,
			n,
			type,
			result = { method: '', url: '', htmlMediaElement: htmlMediaElement, isVideo: (htmlMediaElement.tagName.toLowerCase() != 'audio')},
			pluginName,
			pluginVersions,
			pluginInfo,
			dummy,
			media;
			
		// STEP 1: Get URL and type from <video src> or <source src>

		// supplied type overrides <video type> and <source type>
		if (typeof options.type != 'undefined' && options.type !== '') {
			
			// accept either string or array of types
			if (typeof options.type == 'string') {
				mediaFiles.push({type:options.type, url:src});
			} else {
				
				for (i=0; i<options.type.length; i++) {
					mediaFiles.push({type:options.type[i], url:src});
				}
			}

		// test for src attribute first
		} else if (src !== null) {
			type = this.formatType(src, htmlMediaElement.getAttribute('type'));
			mediaFiles.push({type:type, url:src});

		// then test for <source> elements
		} else {
			// test <source> types to see if they are usable
			for (i = 0; i < htmlMediaElement.childNodes.length; i++) {
				n = htmlMediaElement.childNodes[i];
				if (n.nodeType == 1 && n.tagName.toLowerCase() == 'source') {
					src = n.getAttribute('src');
					type = this.formatType(src, n.getAttribute('type'));
					media = n.getAttribute('media');

					if (!media || !window.matchMedia || (window.matchMedia && window.matchMedia(media).matches)) {
						mediaFiles.push({type:type, url:src});
					}
				}
			}
		}
		
		// in the case of dynamicly created players
		// check for audio types
		if (!isMediaTag && mediaFiles.length > 0 && mediaFiles[0].url !== null && this.getTypeFromFile(mediaFiles[0].url).indexOf('audio') > -1) {
			result.isVideo = false;
		}
		

		// STEP 2: Test for playback method
		
		// special case for Android which sadly doesn't implement the canPlayType function (always returns '')
		if (mejs.MediaFeatures.isBustedAndroid) {
			htmlMediaElement.canPlayType = function(type) {
				return (type.match(/video\/(mp4|m4v)/gi) !== null) ? 'maybe' : '';
			};
		}		
		
		// special case for Chromium to specify natively supported video codecs (i.e. WebM and Theora) 
		if (mejs.MediaFeatures.isChromium) { 
			htmlMediaElement.canPlayType = function(type) { 
				return (type.match(/video\/(webm|ogv|ogg)/gi) !== null) ? 'maybe' : ''; 
			}; 
		}

		// test for native playback first
		if (supportsMediaTag && (options.mode === 'auto' || options.mode === 'auto_plugin' || options.mode === 'native')  && !(mejs.MediaFeatures.isBustedNativeHTTPS && options.httpsBasicAuthSite === true)) {
						
			if (!isMediaTag) {

				// create a real HTML5 Media Element 
				dummy = document.createElement( result.isVideo ? 'video' : 'audio');			
				htmlMediaElement.parentNode.insertBefore(dummy, htmlMediaElement);
				htmlMediaElement.style.display = 'none';
				
				// use this one from now on
				result.htmlMediaElement = htmlMediaElement = dummy;
			}
				
			for (i=0; i<mediaFiles.length; i++) {
				// normal check
				if (mediaFiles[i].type == "video/m3u8" || htmlMediaElement.canPlayType(mediaFiles[i].type).replace(/no/, '') !== ''
					// special case for Mac/Safari 5.0.3 which answers '' to canPlayType('audio/mp3') but 'maybe' to canPlayType('audio/mpeg')
					|| htmlMediaElement.canPlayType(mediaFiles[i].type.replace(/mp3/,'mpeg')).replace(/no/, '') !== ''
					// special case for m4a supported by detecting mp4 support
					|| htmlMediaElement.canPlayType(mediaFiles[i].type.replace(/m4a/,'mp4')).replace(/no/, '') !== '') {
					result.method = 'native';
					result.url = mediaFiles[i].url;
					break;
				}
			}			
			
			if (result.method === 'native') {
				if (result.url !== null) {
					htmlMediaElement.src = result.url;
				}
			
				// if `auto_plugin` mode, then cache the native result but try plugins.
				if (options.mode !== 'auto_plugin') {
					return result;
				}
			}
		}

		// if native playback didn't work, then test plugins
		if (options.mode === 'auto' || options.mode === 'auto_plugin' || options.mode === 'shim') {
			for (i=0; i<mediaFiles.length; i++) {
				type = mediaFiles[i].type;

				// test all plugins in order of preference [silverlight, flash]
				for (j=0; j<options.plugins.length; j++) {

					pluginName = options.plugins[j];
			
					// test version of plugin (for future features)
					pluginVersions = mejs.plugins[pluginName];				
					
					for (k=0; k<pluginVersions.length; k++) {
						pluginInfo = pluginVersions[k];
					
						// test if user has the correct plugin version
						
						// for youtube/vimeo
						if (pluginInfo.version == null || 
							
							mejs.PluginDetector.hasPluginVersion(pluginName, pluginInfo.version)) {

							// test for plugin playback types
							for (l=0; l<pluginInfo.types.length; l++) {
								// find plugin that can play the type
								if (type == pluginInfo.types[l]) {
									result.method = pluginName;
									result.url = mediaFiles[i].url;
									return result;
								}
							}
						}
					}
				}
			}
		}
		
		// at this point, being in 'auto_plugin' mode implies that we tried plugins but failed.
		// if we have native support then return that.
		if (options.mode === 'auto_plugin' && result.method === 'native') {
			return result;
		}

		// what if there's nothing to play? just grab the first available
		if (result.method === '' && mediaFiles.length > 0) {
			result.url = mediaFiles[0].url;
		}

		return result;
	},

	formatType: function(url, type) {
		var ext;

		// if no type is supplied, fake it with the extension
		if (url && !type) {		
			return this.getTypeFromFile(url);
		} else {
			// only return the mime part of the type in case the attribute contains the codec
			// see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#the-source-element
			// `video/mp4; codecs="avc1.42E01E, mp4a.40.2"` becomes `video/mp4`
			
			if (type && ~type.indexOf(';')) {
				return type.substr(0, type.indexOf(';')); 
			} else {
				return type;
			}
		}
	},
	
	getTypeFromFile: function(url) {
		url = url.split('?')[0];
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		return (/(mp4|m4v|ogg|ogv|m3u8|webm|webmv|flv|wmv|mpeg|mov)/gi.test(ext) ? 'video' : 'audio') + '/' + this.getTypeFromExtension(ext);
	},
	
	getTypeFromExtension: function(ext) {
		
		switch (ext) {
			case 'mp4':
			case 'm4v':
			case 'm4a':
				return 'mp4';
			case 'webm':
			case 'webma':
			case 'webmv':	
				return 'webm';
			case 'ogg':
			case 'oga':
			case 'ogv':	
				return 'ogg';
			default:
				return ext;
		}
	},

	createErrorMessage: function(playback, options, poster) {
		var 
			htmlMediaElement = playback.htmlMediaElement,
			errorContainer = document.createElement('div');
			
		errorContainer.className = 'me-cannotplay';

		try {
			errorContainer.style.width = htmlMediaElement.width + 'px';
			errorContainer.style.height = htmlMediaElement.height + 'px';
		} catch (e) {}

    if (options.customError) {
      errorContainer.innerHTML = options.customError;
    } else {
      errorContainer.innerHTML = (poster !== '') ?
        '<a href="' + playback.url + '"><img src="' + poster + '" width="100%" height="100%" /></a>' :
        '<a href="' + playback.url + '"><span>' + mejs.i18n.t('Download File') + '</span></a>';
    }

		htmlMediaElement.parentNode.insertBefore(errorContainer, htmlMediaElement);
		htmlMediaElement.style.display = 'none';

		options.error(htmlMediaElement);
	},

	createPlugin:function(playback, options, poster, autoplay, preload, controls) {
		var 
			htmlMediaElement = playback.htmlMediaElement,
			width = 1,
			height = 1,
			pluginid = 'me_' + playback.method + '_' + (mejs.meIndex++),
			pluginMediaElement = new mejs.PluginMediaElement(pluginid, playback.method, playback.url),
			container = document.createElement('div'),
			specialIEContainer,
			node,
			initVars;

		// copy tagName from html media element
		pluginMediaElement.tagName = htmlMediaElement.tagName

		// copy attributes from html media element to plugin media element
		for (var i = 0; i < htmlMediaElement.attributes.length; i++) {
			var attribute = htmlMediaElement.attributes[i];
			if (attribute.specified == true) {
				pluginMediaElement.setAttribute(attribute.name, attribute.value);
			}
		}

		// check for placement inside a <p> tag (sometimes WYSIWYG editors do this)
		node = htmlMediaElement.parentNode;
		while (node !== null && node.tagName.toLowerCase() !== 'body' && node.parentNode != null) {
			if (node.parentNode.tagName.toLowerCase() === 'p') {
				node.parentNode.parentNode.insertBefore(node, node.parentNode);
				break;
			}
			node = node.parentNode;
		}

		if (playback.isVideo) {
			width = (options.pluginWidth > 0) ? options.pluginWidth : (options.videoWidth > 0) ? options.videoWidth : (htmlMediaElement.getAttribute('width') !== null) ? htmlMediaElement.getAttribute('width') : options.defaultVideoWidth;
			height = (options.pluginHeight > 0) ? options.pluginHeight : (options.videoHeight > 0) ? options.videoHeight : (htmlMediaElement.getAttribute('height') !== null) ? htmlMediaElement.getAttribute('height') : options.defaultVideoHeight;
		
			// in case of '%' make sure it's encoded
			width = mejs.Utility.encodeUrl(width);
			height = mejs.Utility.encodeUrl(height);
		
		} else {
			if (options.enablePluginDebug) {
				width = 320;
				height = 240;
			}
		}

		// register plugin
		pluginMediaElement.success = options.success;
		mejs.MediaPluginBridge.registerPluginElement(pluginid, pluginMediaElement, htmlMediaElement);

		// add container (must be added to DOM before inserting HTML for IE)
		container.className = 'me-plugin';
		container.id = pluginid + '_container';
		
		if (playback.isVideo) {
				htmlMediaElement.parentNode.insertBefore(container, htmlMediaElement);
		} else {
				document.body.insertBefore(container, document.body.childNodes[0]);
		}

		// flash/silverlight vars
		initVars = [
			'id=' + pluginid,
			'isvideo=' + ((playback.isVideo) ? "true" : "false"),
			'autoplay=' + ((autoplay) ? "true" : "false"),
			'preload=' + preload,
			'width=' + width,
			'startvolume=' + options.startVolume,
			'timerrate=' + options.timerRate,
			'flashstreamer=' + options.flashStreamer,
			'height=' + height,
      'pseudostreamstart=' + options.pseudoStreamingStartQueryParam];

		if (playback.url !== null) {
			if (playback.method == 'flash') {
				initVars.push('file=' + mejs.Utility.encodeUrl(playback.url));
			} else {
				initVars.push('file=' + playback.url);
			}
		}
		if (options.enablePluginDebug) {
			initVars.push('debug=true');
		}
		if (options.enablePluginSmoothing) {
			initVars.push('smoothing=true');
		}
    if (options.enablePseudoStreaming) {
      initVars.push('pseudostreaming=true');
    }
		if (controls) {
			initVars.push('controls=true'); // shows controls in the plugin if desired
		}
		if (options.pluginVars) {
			initVars = initVars.concat(options.pluginVars);
		}		

		switch (playback.method) {
			case 'silverlight':
				container.innerHTML =
'<object data="data:application/x-silverlight-2," type="application/x-silverlight-2" id="' + pluginid + '" name="' + pluginid + '" width="' + width + '" height="' + height + '" class="mejs-shim">' +
'<param name="initParams" value="' + initVars.join(',') + '" />' +
'<param name="windowless" value="true" />' +
'<param name="background" value="black" />' +
'<param name="minRuntimeVersion" value="3.0.0.0" />' +
'<param name="autoUpgrade" value="true" />' +
'<param name="source" value="' + options.pluginPath + options.silverlightName + '" />' +
'</object>';
					break;

			case 'flash':

				if (mejs.MediaFeatures.isIE) {
					specialIEContainer = document.createElement('div');
					container.appendChild(specialIEContainer);
					specialIEContainer.outerHTML =
'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" ' +
'id="' + pluginid + '" width="' + width + '" height="' + height + '" class="mejs-shim">' +
'<param name="movie" value="' + options.pluginPath + options.flashName + '?x=' + (new Date()) + '" />' +
'<param name="flashvars" value="' + initVars.join('&amp;') + '" />' +
'<param name="quality" value="high" />' +
'<param name="bgcolor" value="#000000" />' +
'<param name="wmode" value="transparent" />' +
'<param name="allowScriptAccess" value="always" />' +
'<param name="allowFullScreen" value="true" />' +
'<param name="scale" value="default" />' + 
'</object>';

				} else {

					container.innerHTML =
'<embed id="' + pluginid + '" name="' + pluginid + '" ' +
'play="true" ' +
'loop="false" ' +
'quality="high" ' +
'bgcolor="#000000" ' +
'wmode="transparent" ' +
'allowScriptAccess="always" ' +
'allowFullScreen="true" ' +
'type="application/x-shockwave-flash" pluginspage="//www.macromedia.com/go/getflashplayer" ' +
'src="' + options.pluginPath + options.flashName + '" ' +
'flashvars="' + initVars.join('&') + '" ' +
'width="' + width + '" ' +
'height="' + height + '" ' +
'scale="default"' + 
'class="mejs-shim"></embed>';
				}
				break;
			
			case 'youtube':
			
				
				var videoId;
				// youtu.be url from share button
				if (playback.url.lastIndexOf("youtu.be") != -1) {
					videoId = playback.url.substr(playback.url.lastIndexOf('/')+1);
					if (videoId.indexOf('?') != -1) {
						videoId = videoId.substr(0, videoId.indexOf('?'));
					}
				}
				else {
					videoId = playback.url.substr(playback.url.lastIndexOf('=')+1);
				}
				youtubeSettings = {
						container: container,
						containerId: container.id,
						pluginMediaElement: pluginMediaElement,
						pluginId: pluginid,
						videoId: videoId,
						height: height,
						width: width	
					};				
				
				if (mejs.PluginDetector.hasPluginVersion('flash', [10,0,0]) ) {
					mejs.YouTubeApi.createFlash(youtubeSettings);
				} else {
					mejs.YouTubeApi.enqueueIframe(youtubeSettings);		
				}
				
				break;
			
			// DEMO Code. Does NOT work.
			case 'vimeo':
				var player_id = pluginid + "_player";
				pluginMediaElement.vimeoid = playback.url.substr(playback.url.lastIndexOf('/')+1);
				
				container.innerHTML ='<iframe src="//player.vimeo.com/video/' + pluginMediaElement.vimeoid + '?api=1&portrait=0&byline=0&title=0&player_id=' + player_id + '" width="' + width +'" height="' + height +'" frameborder="0" class="mejs-shim" id="' + player_id + '"></iframe>';
				if (typeof($f) == 'function') { // froogaloop available
					var player = $f(container.childNodes[0]);
					player.addEvent('ready', function() {
						$.extend( player, {
							playVideo: function() {
								player.api( 'play' );
							}, 
							stopVideo: function() {
								player.api( 'unload' );
							}, 
							pauseVideo: function() {
								player.api( 'pause' );
							}, 
							seekTo: function( seconds ) {
								player.api( 'seekTo', seconds );
							}, 
							setVolume: function( volume ) {
								player.api( 'setVolume', volume );
							}, 
							setMuted: function( muted ) {
								if( muted ) {
									player.lastVolume = player.api( 'getVolume' );
									player.api( 'setVolume', 0 );
								} else {
									player.api( 'setVolume', player.lastVolume );
									delete player.lastVolume;
								}
							}
						});

						function createEvent(player, pluginMediaElement, eventName, e) {
							var obj = {
								type: eventName,
								target: pluginMediaElement
							};
							if (eventName == 'timeupdate') {
								pluginMediaElement.currentTime = obj.currentTime = e.seconds;
								pluginMediaElement.duration = obj.duration = e.duration;
							}
							pluginMediaElement.dispatchEvent(obj.type, obj);
						}

						player.addEvent('play', function() {
							createEvent(player, pluginMediaElement, 'play');
							createEvent(player, pluginMediaElement, 'playing');
						});

						player.addEvent('pause', function() {
							createEvent(player, pluginMediaElement, 'pause');
						});

						player.addEvent('finish', function() {
							createEvent(player, pluginMediaElement, 'ended');
						});

						player.addEvent('playProgress', function(e) {
							createEvent(player, pluginMediaElement, 'timeupdate', e);
						});

						pluginMediaElement.pluginElement = container;
						pluginMediaElement.pluginApi = player;

						// init mejs
						mejs.MediaPluginBridge.initPlugin(pluginid);
					});
				}
				else {
					console.warn("You need to include froogaloop for vimeo to work");
				}
				break;			
		}
		// hide original element
		htmlMediaElement.style.display = 'none';
		// prevent browser from autoplaying when using a plugin
		htmlMediaElement.removeAttribute('autoplay');

		// FYI: options.success will be fired by the MediaPluginBridge
		
		return pluginMediaElement;
	},

	updateNative: function(playback, options, autoplay, preload) {
		
		var htmlMediaElement = playback.htmlMediaElement,
			m;
		
		
		// add methods to video object to bring it into parity with Flash Object
		for (m in mejs.HtmlMediaElement) {
			htmlMediaElement[m] = mejs.HtmlMediaElement[m];
		}

		/*
		Chrome now supports preload="none"
		if (mejs.MediaFeatures.isChrome) {
		
			// special case to enforce preload attribute (Chrome doesn't respect this)
			if (preload === 'none' && !autoplay) {
			
				// forces the browser to stop loading (note: fails in IE9)
				htmlMediaElement.src = '';
				htmlMediaElement.load();
				htmlMediaElement.canceledPreload = true;

				htmlMediaElement.addEventListener('play',function() {
					if (htmlMediaElement.canceledPreload) {
						htmlMediaElement.src = playback.url;
						htmlMediaElement.load();
						htmlMediaElement.play();
						htmlMediaElement.canceledPreload = false;
					}
				}, false);
			// for some reason Chrome forgets how to autoplay sometimes.
			} else if (autoplay) {
				htmlMediaElement.load();
				htmlMediaElement.play();
			}
		}
		*/

		// fire success code
		options.success(htmlMediaElement, htmlMediaElement);
		
		return htmlMediaElement;
	}
};

/*
 - test on IE (object vs. embed)
 - determine when to use iframe (Firefox, Safari, Mobile) vs. Flash (Chrome, IE)
 - fullscreen?
*/

// YouTube Flash and Iframe API
mejs.YouTubeApi = {
	isIframeStarted: false,
	isIframeLoaded: false,
	loadIframeApi: function() {
		if (!this.isIframeStarted) {
			var tag = document.createElement('script');
			tag.src = "//www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			this.isIframeStarted = true;
		}
	},
	iframeQueue: [],
	enqueueIframe: function(yt) {
		
		if (this.isLoaded) {
			this.createIframe(yt);
		} else {
			this.loadIframeApi();
			this.iframeQueue.push(yt);
		}
	},
	createIframe: function(settings) {
		
		var
		pluginMediaElement = settings.pluginMediaElement,	
		player = new YT.Player(settings.containerId, {
			height: settings.height,
			width: settings.width,
			videoId: settings.videoId,
			playerVars: {controls:0},
			events: {
				'onReady': function() {
					
					// hook up iframe object to MEjs
					settings.pluginMediaElement.pluginApi = player;
					
					// init mejs
					mejs.MediaPluginBridge.initPlugin(settings.pluginId);
					
					// create timer
					setInterval(function() {
						mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'timeupdate');
					}, 250);					
				},
				'onStateChange': function(e) {
					
					mejs.YouTubeApi.handleStateChange(e.data, player, pluginMediaElement);
					
				}
			}
		});
	},
	
	createEvent: function (player, pluginMediaElement, eventName) {
		var obj = {
			type: eventName,
			target: pluginMediaElement
		};

		if (player && player.getDuration) {
			
			// time 
			pluginMediaElement.currentTime = obj.currentTime = player.getCurrentTime();
			pluginMediaElement.duration = obj.duration = player.getDuration();
			
			// state
			obj.paused = pluginMediaElement.paused;
			obj.ended = pluginMediaElement.ended;			
			
			// sound
			obj.muted = player.isMuted();
			obj.volume = player.getVolume() / 100;
			
			// progress
			obj.bytesTotal = player.getVideoBytesTotal();
			obj.bufferedBytes = player.getVideoBytesLoaded();
			
			// fake the W3C buffered TimeRange
			var bufferedTime = obj.bufferedBytes / obj.bytesTotal * obj.duration;
			
			obj.target.buffered = obj.buffered = {
				start: function(index) {
					return 0;
				},
				end: function (index) {
					return bufferedTime;
				},
				length: 1
			};

		}
		
		// send event up the chain
		pluginMediaElement.dispatchEvent(obj.type, obj);
	},	
	
	iFrameReady: function() {
		
		this.isLoaded = true;
		this.isIframeLoaded = true;
		
		while (this.iframeQueue.length > 0) {
			var settings = this.iframeQueue.pop();
			this.createIframe(settings);
		}	
	},
	
	// FLASH!
	flashPlayers: {},
	createFlash: function(settings) {
		
		this.flashPlayers[settings.pluginId] = settings;
		
		/*
		settings.container.innerHTML =
			'<object type="application/x-shockwave-flash" id="' + settings.pluginId + '" data="//www.youtube.com/apiplayer?enablejsapi=1&amp;playerapiid=' + settings.pluginId  + '&amp;version=3&amp;autoplay=0&amp;controls=0&amp;modestbranding=1&loop=0" ' +
				'width="' + settings.width + '" height="' + settings.height + '" style="visibility: visible; " class="mejs-shim">' +
				'<param name="allowScriptAccess" value="always">' +
				'<param name="wmode" value="transparent">' +
			'</object>';
		*/

		var specialIEContainer,
			youtubeUrl = '//www.youtube.com/apiplayer?enablejsapi=1&amp;playerapiid=' + settings.pluginId  + '&amp;version=3&amp;autoplay=0&amp;controls=0&amp;modestbranding=1&loop=0';
			
		if (mejs.MediaFeatures.isIE) {
			
			specialIEContainer = document.createElement('div');
			settings.container.appendChild(specialIEContainer);
			specialIEContainer.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" ' +
'id="' + settings.pluginId + '" width="' + settings.width + '" height="' + settings.height + '" class="mejs-shim">' +
	'<param name="movie" value="' + youtubeUrl + '" />' +
	'<param name="wmode" value="transparent" />' +
	'<param name="allowScriptAccess" value="always" />' +
	'<param name="allowFullScreen" value="true" />' +
'</object>';
		} else {
		settings.container.innerHTML =
			'<object type="application/x-shockwave-flash" id="' + settings.pluginId + '" data="' + youtubeUrl + '" ' +
				'width="' + settings.width + '" height="' + settings.height + '" style="visibility: visible; " class="mejs-shim">' +
				'<param name="allowScriptAccess" value="always">' +
				'<param name="wmode" value="transparent">' +
			'</object>';
		}		
		
	},
	
	flashReady: function(id) {
		var
			settings = this.flashPlayers[id],
			player = document.getElementById(id),
			pluginMediaElement = settings.pluginMediaElement;
		
		// hook up and return to MediaELementPlayer.success	
		pluginMediaElement.pluginApi = 
		pluginMediaElement.pluginElement = player;
		mejs.MediaPluginBridge.initPlugin(id);
		
		// load the youtube video
		player.cueVideoById(settings.videoId);
		
		var callbackName = settings.containerId + '_callback';
		
		window[callbackName] = function(e) {
			mejs.YouTubeApi.handleStateChange(e, player, pluginMediaElement);
		}
		
		player.addEventListener('onStateChange', callbackName);
		
		setInterval(function() {
			mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'timeupdate');
		}, 250);
		
		mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'canplay');
	},
	
	handleStateChange: function(youTubeState, player, pluginMediaElement) {
		switch (youTubeState) {
			case -1: // not started
				pluginMediaElement.paused = true;
				pluginMediaElement.ended = true;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'loadedmetadata');
				//createYouTubeEvent(player, pluginMediaElement, 'loadeddata');
				break;
			case 0:
				pluginMediaElement.paused = false;
				pluginMediaElement.ended = true;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'ended');
				break;
			case 1:
				pluginMediaElement.paused = false;
				pluginMediaElement.ended = false;				
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'play');
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'playing');
				break;
			case 2:
				pluginMediaElement.paused = true;
				pluginMediaElement.ended = false;				
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'pause');
				break;
			case 3: // buffering
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'progress');
				break;
			case 5:
				// cued?
				break;						
			
		}			
		
	}
}
// IFRAME
function onYouTubePlayerAPIReady() {
	mejs.YouTubeApi.iFrameReady();
}
// FLASH
function onYouTubePlayerReady(id) {
	mejs.YouTubeApi.flashReady(id);
}

window.mejs = mejs;
window.MediaElement = mejs.MediaElement;

/*!
 * Adds Internationalization and localization to mediaelement.
 *
 * This file does not contain translations, you have to add the manually.
 * The schema is always the same: me-i18n-locale-[ISO_639-1 Code].js
 *
 * Examples are provided both for german and chinese translation.
 *
 *
 * What is the concept beyond i18n?
 *   http://en.wikipedia.org/wiki/Internationalization_and_localization
 *
 * What langcode should i use?
 *   http://en.wikipedia.org/wiki/ISO_639-1
 *
 *
 * License?
 *
 *   The i18n file uses methods from the Drupal project (drupal.js):
 *     - i18n.methods.t() (modified)
 *     - i18n.methods.checkPlain() (full copy)
 *
 *   The Drupal project is (like mediaelementjs) licensed under GPLv2.
 *    - http://drupal.org/licensing/faq/#q1
 *    - https://github.com/johndyer/mediaelement
 *    - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 *
 * @author
 *   Tim Latz (latz.tim@gmail.com)
 *
 *
 * @params
 *  - context - document, iframe ..
 *  - exports - CommonJS, window ..
 *
 */
;(function(context, exports, undefined) {
    "use strict";
    var i18n = {
        "locale": {
            "language" : '',
            "strings" : {}
        },
        "methods" : {}
    };
// start i18n


    /**
     * Get language, fallback to browser's language if empty
     */
    i18n.getLanguage = function () {
        var language = i18n.locale.language || window.navigator.userLanguage || window.navigator.language;
        // convert to iso 639-1 (2-letters, lower case)
        return language.substr(0, 2).toLowerCase();
    };

    // i18n fixes for compatibility with WordPress
    if ( typeof mejsL10n != 'undefined' ) {
        i18n.locale.language = mejsL10n.language;
    }



    /**
     * Encode special characters in a plain-text string for display as HTML.
     */
    i18n.methods.checkPlain = function (str) {
        var character, regex,
        replace = {
            '&': '&amp;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        };
        str = String(str);
        for (character in replace) {
            if (replace.hasOwnProperty(character)) {
                regex = new RegExp(character, 'g');
                str = str.replace(regex, replace[character]);
            }
        }
        return str;
    };

    /**
     * Translate strings to the page language or a given language.
     *
     *
     * @param str
     *   A string containing the English string to translate.
     *
     * @param options
     *   - 'context' (defaults to the default context): The context the source string
     *     belongs to.
     *
     * @return
     *   The translated string, escaped via i18n.methods.checkPlain()
     */
    i18n.methods.t = function (str, options) {

        // Fetch the localized version of the string.
        if (i18n.locale.strings && i18n.locale.strings[options.context] && i18n.locale.strings[options.context][str]) {
            str = i18n.locale.strings[options.context][str];
        }

        return i18n.methods.checkPlain(str);
    };


    /**
     * Wrapper for i18n.methods.t()
     *
     * @see i18n.methods.t()
     * @throws InvalidArgumentException
     */
    i18n.t = function(str, options) {

        if (typeof str === 'string' && str.length > 0) {

            // check every time due language can change for
            // different reasons (translation, lang switcher ..)
            var language = i18n.getLanguage();

            options = options || {
                "context" : language
            };

            return i18n.methods.t(str, options);
        }
        else {
            throw {
                "name" : 'InvalidArgumentException',
                "message" : 'First argument is either not a string or empty.'
            };
        }
    };

// end i18n
    exports.i18n = i18n;
}(document, mejs));

// i18n fixes for compatibility with WordPress
;(function(exports, undefined) {

    "use strict";

    if ( typeof mejsL10n != 'undefined' ) {
        exports[mejsL10n.language] = mejsL10n.strings;
    }

}(mejs.i18n.locale.strings));

/*!
 * This is a i18n.locale language object.
 *
 * German translation by Tim Latz, latz.tim@gmail.com
 *
 * @author
 *   Tim Latz (latz.tim@gmail.com)
 *
 * @see
 *   me-i18n.js
 *
 * @params
 *  - exports - CommonJS, window ..
 */
;(function(exports, undefined) {

    "use strict";

    if (typeof exports.de === 'undefined') {
        exports.de = {
            "Fullscreen" : "Vollbild",
            "Go Fullscreen" : "Vollbild an",
            "Turn off Fullscreen" : "Vollbild aus",
            "Close" : "Schließen"
        };
    }

}(mejs.i18n.locale.strings));
/*!
 * This is a i18n.locale language object.
 *
 * Traditional chinese translation by Tim Latz, latz.tim@gmail.com
 *
 * @author
 *   Tim Latz (latz.tim@gmail.com)
 *
 * @see
 *   me-i18n.js
 *
 * @params
 *  - exports - CommonJS, window ..
 */
;(function(exports, undefined) {

    "use strict";

    if (typeof exports.zh === 'undefined') {
        exports.zh = {
            "Fullscreen" : "全螢幕",
            "Go Fullscreen" : "全屏模式",
            "Turn off Fullscreen" : "退出全屏模式",
            "Close" : "關閉"
        };
    }

}(mejs.i18n.locale.strings));


/*!
 * MediaElementPlayer
 * http://mediaelementjs.com/
 *
 * Creates a controller bar for HTML5 <video> add <audio> tags
 * using jQuery and MediaElement.js (HTML5 Flash/Silverlight wrapper)
 *
 * Copyright 2010-2013, John Dyer (http://j.hn/)
 * License: MIT
 *
 */
if (typeof jQuery != 'undefined') {
	mejs.$ = jQuery;
} else if (typeof ender != 'undefined') {
	mejs.$ = ender;
}
(function ($) {

	// default player values
	mejs.MepDefaults = {
		// url to poster (to fix iOS 3.x)
		poster: '',
		// When the video is ended, we can show the poster.
		showPosterWhenEnded: false,
		// default if the <video width> is not specified
		defaultVideoWidth: 480,
		// default if the <video height> is not specified
		defaultVideoHeight: 270,
		// if set, overrides <video width>
		videoWidth: -1,
		// if set, overrides <video height>
		videoHeight: -1,
		// default if the user doesn't specify
		defaultAudioWidth: 400,
		// default if the user doesn't specify
		defaultAudioHeight: 30,

		// default amount to move back when back key is pressed
		defaultSeekBackwardInterval: function(media) {
			return (media.duration * 0.05);
		},
		// default amount to move forward when forward key is pressed
		defaultSeekForwardInterval: function(media) {
			return (media.duration * 0.05);
		},

		// set dimensions via JS instead of CSS
		setDimensions: true,

		// width of audio player
		audioWidth: -1,
		// height of audio player
		audioHeight: -1,
		// initial volume when the player starts (overrided by user cookie)
		startVolume: 0.8,
		// useful for <audio> player loops
		loop: false,
		// rewind to beginning when media ends
                autoRewind: true,
		// resize to media dimensions
		enableAutosize: true,
		// forces the hour marker (##:00:00)
		alwaysShowHours: false,

		// show framecount in timecode (##:00:00:00)
		showTimecodeFrameCount: false,
		// used when showTimecodeFrameCount is set to true
		framesPerSecond: 25,

		// automatically calculate the width of the progress bar based on the sizes of other elements
		autosizeProgress : true,
		// Hide controls when playing and mouse is not over the video
		alwaysShowControls: false,
		// Display the video control
		hideVideoControlsOnLoad: false,
		// Enable click video element to toggle play/pause
		clickToPlayPause: true,
		// force iPad's native controls
		iPadUseNativeControls: false,
		// force iPhone's native controls
		iPhoneUseNativeControls: false,
		// force Android's native controls
		AndroidUseNativeControls: false,
		// features to show
		features: ['playpause','current','progress','duration','tracks','volume','fullscreen'],
		// only for dynamic
		isVideo: true,

		// turns keyboard support on and off for this instance
		enableKeyboard: true,

		// whenthis player starts, it will pause other players
		pauseOtherPlayers: true,

		// array of keyboard actions such as play pause
		keyActions: [
				{
						keys: [
								32, // SPACE
								179 // GOOGLE play/pause button
							  ],
						action: function(player, media) {
								if (media.paused || media.ended) {
										player.play();
								} else {
										player.pause();
								}
						}
				},
				{
						keys: [38], // UP
						action: function(player, media) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}

								var newVolume = Math.min(media.volume + 0.1, 1);
								media.setVolume(newVolume);
						}
				},
				{
						keys: [40], // DOWN
						action: function(player, media) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}

								var newVolume = Math.max(media.volume - 0.1, 0);
								media.setVolume(newVolume);
						}
				},
				{
						keys: [
								37, // LEFT
								227 // Google TV rewind
						],
						action: function(player, media) {
								if (!isNaN(media.duration) && media.duration > 0) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}

										// 5%
										var newTime = Math.max(media.currentTime - player.options.defaultSeekBackwardInterval(media), 0);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						keys: [
								39, // RIGHT
								228 // Google TV forward
						],
						action: function(player, media) {
								if (!isNaN(media.duration) && media.duration > 0) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}

										// 5%
										var newTime = Math.min(media.currentTime + player.options.defaultSeekForwardInterval(media), media.duration);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						keys: [70], // F
						action: function(player, media) {
								if (typeof player.enterFullScreen != 'undefined') {
										if (player.isFullScreen) {
												player.exitFullScreen();
										} else {
												player.enterFullScreen();
										}
								}
						}
				},
				{
						keys: [77], // M
						action: function(player, media) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}
								if (player.media.muted) {
										player.setMuted(false);
								} else {
										player.setMuted(true);
								}
						}
				}
		]
	};

	mejs.mepIndex = 0;

	mejs.players = {};

	// wraps a MediaElement object in player controls
	mejs.MediaElementPlayer = function(node, o) {
		// enforce object, even without "new" (via John Resig)
		if ( !(this instanceof mejs.MediaElementPlayer) ) {
			return new mejs.MediaElementPlayer(node, o);
		}

		var t = this;

		// these will be reset after the MediaElement.success fires
		t.$media = t.$node = $(node);
		t.node = t.media = t.$media[0];

		// check for existing player
		if (typeof t.node.player != 'undefined') {
			return t.node.player;
		} else {
			// attach player to DOM node for reference
			t.node.player = t;
		}


		// try to get options from data-mejsoptions
		if (typeof o == 'undefined') {
			o = t.$node.data('mejsoptions');
		}

		// extend default options
		t.options = $.extend({},mejs.MepDefaults,o);

		// unique ID
		t.id = 'mep_' + mejs.mepIndex++;

		// add to player array (for focus events)
		mejs.players[t.id] = t;

		// start up
		t.init();

		return t;
	};

	// actual player
	mejs.MediaElementPlayer.prototype = {

		hasFocus: false,

		controlsAreVisible: true,

		init: function() {

			var
				t = this,
				mf = mejs.MediaFeatures,
				// options for MediaElement (shim)
				meOptions = $.extend(true, {}, t.options, {
					success: function(media, domNode) { t.meReady(media, domNode); },
					error: function(e) { t.handleError(e);}
				}),
				tagName = t.media.tagName.toLowerCase();

			t.isDynamic = (tagName !== 'audio' && tagName !== 'video');

			if (t.isDynamic) {
				// get video from src or href?
				t.isVideo = t.options.isVideo;
			} else {
				t.isVideo = (tagName !== 'audio' && t.options.isVideo);
			}

			// use native controls in iPad, iPhone, and Android
			if ((mf.isiPad && t.options.iPadUseNativeControls) || (mf.isiPhone && t.options.iPhoneUseNativeControls)) {

				// add controls and stop
				t.$media.attr('controls', 'controls');

				// attempt to fix iOS 3 bug
				//t.$media.removeAttr('poster');
                                // no Issue found on iOS3 -ttroxell

				// override Apple's autoplay override for iPads
				if (mf.isiPad && t.media.getAttribute('autoplay') !== null) {
					t.play();
				}

			} else if (mf.isAndroid && t.options.AndroidUseNativeControls) {

				// leave default player

			} else {

				// DESKTOP: use MediaElementPlayer controls

				// remove native controls
				t.$media.removeAttr('controls');

				// build container
				t.container =
					$('<div id="' + t.id + '" class="mejs-container ' + (mejs.MediaFeatures.svg ? 'svg' : 'no-svg') + '">'+
						'<div class="mejs-inner">'+
							'<div class="mejs-mediaelement"></div>'+
							'<div class="mejs-layers"></div>'+
							'<div class="mejs-controls"></div>'+
							'<div class="mejs-clear"></div>'+
						'</div>' +
					'</div>')
					.addClass(t.$media[0].className)
					.insertBefore(t.$media);

				// add classes for user and content
				t.container.addClass(
					(mf.isAndroid ? 'mejs-android ' : '') +
					(mf.isiOS ? 'mejs-ios ' : '') +
					(mf.isiPad ? 'mejs-ipad ' : '') +
					(mf.isiPhone ? 'mejs-iphone ' : '') +
					(t.isVideo ? 'mejs-video ' : 'mejs-audio ')
				);


				// move the <video/video> tag into the right spot
				if (mf.isiOS) {

					// sadly, you can't move nodes in iOS, so we have to destroy and recreate it!
					var $newMedia = t.$media.clone();

					t.container.find('.mejs-mediaelement').append($newMedia);

					t.$media.remove();
					t.$node = t.$media = $newMedia;
					t.node = t.media = $newMedia[0]

				} else {

					// normal way of moving it into place (doesn't work on iOS)
					t.container.find('.mejs-mediaelement').append(t.$media);
				}

				// find parts
				t.controls = t.container.find('.mejs-controls');
				t.layers = t.container.find('.mejs-layers');

				// determine the size

				/* size priority:
					(1) videoWidth (forced),
					(2) style="width;height;"
					(3) width attribute,
					(4) defaultVideoWidth (for unspecified cases)
				*/

				var tagType = (t.isVideo ? 'video' : 'audio'),
					capsTagName = tagType.substring(0,1).toUpperCase() + tagType.substring(1);



				if (t.options[tagType + 'Width'] > 0 || t.options[tagType + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagType + 'Width'];
				} else if (t.media.style.width !== '' && t.media.style.width !== null) {
					t.width = t.media.style.width;
				} else if (t.media.getAttribute('width') !== null) {
					t.width = t.$media.attr('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}

				if (t.options[tagType + 'Height'] > 0 || t.options[tagType + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagType + 'Height'];
				} else if (t.media.style.height !== '' && t.media.style.height !== null) {
					t.height = t.media.style.height;
				} else if (t.$media[0].getAttribute('height') !== null) {
					t.height = t.$media.attr('height');
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				// set the size, while we wait for the plugins to load below
				t.setPlayerSize(t.width, t.height);

				// create MediaElementShim
				meOptions.pluginWidth = t.width;
				meOptions.pluginHeight = t.height;
			}

			// create MediaElement shim
			mejs.MediaElement(t.$media[0], meOptions);

			if (typeof(t.container) != 'undefined' && t.controlsAreVisible){
			    // controls are shown when loaded
			    t.container.trigger('controlsshown');
			}
		},

		showControls: function(doAnimation) {
			var t = this;

			doAnimation = typeof doAnimation == 'undefined' || doAnimation;

			if (t.controlsAreVisible)
				return;

			if (doAnimation) {
				t.controls
					.css('visibility','visible')
					.stop(true, true).fadeIn(200, function() {
					      t.controlsAreVisible = true;
					      t.container.trigger('controlsshown');
					});

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control')
					.css('visibility','visible')
					.stop(true, true).fadeIn(200, function() {t.controlsAreVisible = true;});

			} else {
				t.controls
					.css('visibility','visible')
					.css('display','block');

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control')
					.css('visibility','visible')
					.css('display','block');

				t.controlsAreVisible = true;
				t.container.trigger('controlsshown');
			}

			t.setControlsSize();

		},

		hideControls: function(doAnimation) {
			var t = this;

			doAnimation = typeof doAnimation == 'undefined' || doAnimation;

			if (!t.controlsAreVisible || t.options.alwaysShowControls)
				return;

			if (doAnimation) {
				// fade out main controls
				t.controls.stop(true, true).fadeOut(200, function() {
					$(this)
						.css('visibility','hidden')
						.css('display','block');

					t.controlsAreVisible = false;
					t.container.trigger('controlshidden');
				});

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control').stop(true, true).fadeOut(200, function() {
					$(this)
						.css('visibility','hidden')
						.css('display','block');
				});
			} else {

				// hide main controls
				t.controls
					.css('visibility','hidden')
					.css('display','block');

				// hide others
				t.container.find('.mejs-control')
					.css('visibility','hidden')
					.css('display','block');

				t.controlsAreVisible = false;
				t.container.trigger('controlshidden');
			}
		},

		controlsTimer: null,

		startControlsTimer: function(timeout) {

			var t = this;

			timeout = typeof timeout != 'undefined' ? timeout : 1500;

			t.killControlsTimer('start');

			t.controlsTimer = setTimeout(function() {
				//
				t.hideControls();
				t.killControlsTimer('hide');
			}, timeout);
		},

		killControlsTimer: function(src) {

			var t = this;

			if (t.controlsTimer !== null) {
				clearTimeout(t.controlsTimer);
				delete t.controlsTimer;
				t.controlsTimer = null;
			}
		},

		controlsEnabled: true,

		disableControls: function() {
			var t= this;

			t.killControlsTimer();
			t.hideControls(false);
			this.controlsEnabled = false;
		},

		enableControls: function() {
			var t= this;

			t.showControls(false);

			t.controlsEnabled = true;
		},


		// Sets up all controls and events
		meReady: function(media, domNode) {


			var t = this,
				mf = mejs.MediaFeatures,
				autoplayAttr = domNode.getAttribute('autoplay'),
				autoplay = !(typeof autoplayAttr == 'undefined' || autoplayAttr === null || autoplayAttr === 'false'),
				featureIndex,
				feature;

			// make sure it can't create itself again if a plugin reloads
			if (t.created) {
				return;
			} else {
				t.created = true;
			}

			t.media = media;
			t.domNode = domNode;

			if (!(mf.isAndroid && t.options.AndroidUseNativeControls) && !(mf.isiPad && t.options.iPadUseNativeControls) && !(mf.isiPhone && t.options.iPhoneUseNativeControls)) {

				// two built in features
				t.buildposter(t, t.controls, t.layers, t.media);
				t.buildkeyboard(t, t.controls, t.layers, t.media);
				t.buildoverlays(t, t.controls, t.layers, t.media);

				// grab for use by features
				t.findTracks();

				// add user-defined features/controls
				for (featureIndex in t.options.features) {
					feature = t.options.features[featureIndex];
					if (t['build' + feature]) {
						try {
							t['build' + feature](t, t.controls, t.layers, t.media);
						} catch (e) {
							// TODO: report control error
							//throw e;
							
							
						}
					}
				}

				t.container.trigger('controlsready');

				// reset all layers and controls
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();


				// controls fade
				if (t.isVideo) {

					if (mejs.MediaFeatures.hasTouch) {

						// for touch devices (iOS, Android)
						// show/hide without animation on touch

						t.$media.bind('touchstart', function() {


							// toggle controls
							if (t.controlsAreVisible) {
								t.hideControls(false);
							} else {
								if (t.controlsEnabled) {
									t.showControls(false);
								}
							}
						});

					} else {

						// create callback here since it needs access to current
						// MediaElement object
						t.clickToPlayPauseCallback = function() {
							//

							if (t.options.clickToPlayPause) {
								if (t.media.paused) {
									t.play();
								} else {
									t.pause();
								}
							}
						};

			            // click to play/pause
			            t.media.addEventListener('click', t.clickToPlayPauseCallback, false);

						// show/hide controls
						t.container
							.bind('mouseenter mouseover', function () {
								if (t.controlsEnabled) {
									if (!t.options.alwaysShowControls ) {
										t.killControlsTimer('enter');
										t.showControls();
										t.startControlsTimer(2500);
									}
								}
							})
							.bind('mousemove', function() {
								if (t.controlsEnabled) {
									if (!t.controlsAreVisible) {
										t.showControls();
									}
									if (!t.options.alwaysShowControls) {
										t.startControlsTimer(2500);
									}
								}
							})
							.bind('mouseleave', function () {
								if (t.controlsEnabled) {
									if (!t.media.paused && !t.options.alwaysShowControls) {
										t.startControlsTimer(1000);
									}
								}
							});
					}

					if(t.options.hideVideoControlsOnLoad) {
						t.hideControls(false);
					}

					// check for autoplay
					if (autoplay && !t.options.alwaysShowControls) {
						t.hideControls();
					}

					// resizer
					if (t.options.enableAutosize) {
						t.media.addEventListener('loadedmetadata', function(e) {
							// if the <video height> was not set and the options.videoHeight was not set
							// then resize to the real dimensions
							if (t.options.videoHeight <= 0 && t.domNode.getAttribute('height') === null && !isNaN(e.target.videoHeight)) {
								t.setPlayerSize(e.target.videoWidth, e.target.videoHeight);
								t.setControlsSize();
								t.media.setVideoSize(e.target.videoWidth, e.target.videoHeight);
							}
						}, false);
					}
				}

				// EVENTS

				// FOCUS: when a video starts playing, it takes focus from other players (possibily pausing them)
				media.addEventListener('play', function() {
					var playerIndex;

					// go through all other players
					for (playerIndex in mejs.players) {
						var p = mejs.players[playerIndex];
						if (p.id != t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended) {
							p.pause();
						}
						p.hasFocus = false;
					}

					t.hasFocus = true;
				},false);


				// ended for all
				t.media.addEventListener('ended', function (e) {
					if(t.options.autoRewind) {
						try{
							t.media.setCurrentTime(0);
						} catch (exp) {

						}
					}
					t.media.pause();

					if (t.setProgressRail) {
						t.setProgressRail();
					}
					if (t.setCurrentRail) {
						t.setCurrentRail();
					}

					if (t.options.loop) {
						t.play();
					} else if (!t.options.alwaysShowControls && t.controlsEnabled) {
						t.showControls();
					}
				}, false);

				// resize on the first play
				t.media.addEventListener('loadedmetadata', function(e) {
					if (t.updateDuration) {
						t.updateDuration();
					}
					if (t.updateCurrent) {
						t.updateCurrent();
					}

					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
						t.setControlsSize();
					}
				}, false);


				// webkit has trouble doing this without a delay
				setTimeout(function () {
					t.setPlayerSize(t.width, t.height);
					t.setControlsSize();
				}, 50);

				// adjust controls whenever window sizes (used to be in fullscreen only)
				t.globalBind('resize', function() {

					// don't resize for fullscreen mode
					if ( !(t.isFullScreen || (mejs.MediaFeatures.hasTrueNativeFullScreen && document.webkitIsFullScreen)) ) {
						t.setPlayerSize(t.width, t.height);
					}

					// always adjust controls
					t.setControlsSize();
				});

				// TEMP: needs to be moved somewhere else
				if (t.media.pluginType == 'youtube' && t.options.autoplay) {
				//LOK-Soft: added t.options.autoplay to if -- I can only guess this is for hiding play button when autoplaying youtube, general hiding play button layer causes missing button on player load
					t.container.find('.mejs-overlay-play').hide();
				}
			}

			// force autoplay for HTML5
			if (autoplay && media.pluginType == 'native') {
				t.play();
			}


			if (t.options.success) {

				if (typeof t.options.success == 'string') {
					window[t.options.success](t.media, t.domNode, t);
				} else {
					t.options.success(t.media, t.domNode, t);
				}
			}
		},

		handleError: function(e) {
			var t = this;

			t.controls.hide();

			// Tell user that the file cannot be played
			if (t.options.error) {
				t.options.error(e);
			}
		},

		setPlayerSize: function(width,height) {
			var t = this;

			if( !t.options.setDimensions ) {
				return false;
			}

			if (typeof width != 'undefined') {
				t.width = width;
			}

			if (typeof height != 'undefined') {
				t.height = height;
			}

			// detect 100% mode - use currentStyle for IE since css() doesn't return percentages
			if (t.height.toString().indexOf('%') > 0 || t.$node.css('max-width') === '100%' || (t.$node[0].currentStyle && t.$node[0].currentStyle.maxWidth === '100%')) {

				// do we have the native dimensions yet?
				var nativeWidth = (function() {
					if (t.isVideo) {
						if (t.media.videoWidth && t.media.videoWidth > 0) {
							return t.media.videoWidth;
						} else if (t.media.getAttribute('width') !== null) {
							return t.media.getAttribute('width');
						} else {
							return t.options.defaultVideoWidth;
						}
					} else {
						return t.options.defaultAudioWidth;
					}
				})();

				var nativeHeight = (function() {
					if (t.isVideo) {
						if (t.media.videoHeight && t.media.videoHeight > 0) {
							return t.media.videoHeight;
						} else if (t.media.getAttribute('height') !== null) {
							return t.media.getAttribute('height');
						} else {
							return t.options.defaultVideoHeight;
						}
					} else {
						return t.options.defaultAudioHeight;
					}
				})();

				var
					parentWidth = t.container.parent().closest(':visible').width(),
					parentHeight = t.container.parent().closest(':visible').height(),
					newHeight = t.isVideo || !t.options.autosizeProgress ? parseInt(parentWidth * nativeHeight/nativeWidth, 10) : nativeHeight;

				// When we use percent, the newHeight can't be calculated so we get the container height
				if(isNaN(newHeight) || ( parentHeight != 0 && newHeight > parentHeight )) {
					newHeight = parentHeight;
				}

				if (t.container.parent()[0].tagName.toLowerCase() === 'body') { // && t.container.siblings().count == 0) {
					parentWidth = $(window).width();
					newHeight = $(window).height();
				}

				if ( newHeight != 0 && parentWidth != 0 ) {
					// set outer container size
					t.container
						.width(parentWidth)
						.height(newHeight);

					// set native <video> or <audio> and shims
					t.$media.add(t.container.find('.mejs-shim'))
						.width('100%')
						.height('100%');

					// if shim is ready, send the size to the embeded plugin
					if (t.isVideo) {
						if (t.media.setVideoSize) {
							t.media.setVideoSize(parentWidth, newHeight);
						}
					}

					// set the layers
					t.layers.children('.mejs-layer')
						.width('100%')
						.height('100%');
				}


			} else {

				t.container
					.width(t.width)
					.height(t.height);

				t.layers.children('.mejs-layer')
					.width(t.width)
					.height(t.height);

			}

			// special case for big play button so it doesn't go over the controls area
			var playLayer = t.layers.find('.mejs-overlay-play'),
				playButton = playLayer.find('.mejs-overlay-button');

			playLayer.height(t.container.height() - t.controls.height());
			playButton.css('margin-top', '-' + (playButton.height()/2 - t.controls.height()/2).toString() + 'px'  );

		},

		setControlsSize: function() {
			var t = this,
				usedWidth = 0,
				railWidth = 0,
				rail = t.controls.find('.mejs-time-rail'),
				total = t.controls.find('.mejs-time-total'),
				current = t.controls.find('.mejs-time-current'),
				loaded = t.controls.find('.mejs-time-loaded'),
				others = rail.siblings(),
				lastControl = others.last(),
				lastControlPosition = null;

			// skip calculation if hidden
			if (!t.container.is(':visible') || !rail.length || !rail.is(':visible')) {
				return;
			}


			// allow the size to come from custom CSS
			if (t.options && !t.options.autosizeProgress) {
				// Also, frontends devs can be more flexible
				// due the opportunity of absolute positioning.
				railWidth = parseInt(rail.css('width'));
			}

			// attempt to autosize
			if (railWidth === 0 || !railWidth) {

				// find the size of all the other controls besides the rail
				others.each(function() {
					var $this = $(this);
					if ($this.css('position') != 'absolute' && $this.is(':visible')) {
						usedWidth += $(this).outerWidth(true);
					}
				});

				// fit the rail into the remaining space
				railWidth = t.controls.width() - usedWidth - (rail.outerWidth(true) - rail.width());
			}

			// resize the rail,
			// but then check if the last control (say, the fullscreen button) got pushed down
			// this often happens when zoomed
			do {
				// outer area
				rail.width(railWidth);
				// dark space
				total.width(railWidth - (total.outerWidth(true) - total.width()));

				if (lastControl.css('position') != 'absolute') {
					lastControlPosition = lastControl.position();
					railWidth--;
				}
			} while (lastControlPosition != null && lastControlPosition.top > 0 && railWidth > 0);

			if (t.setProgressRail)
				t.setProgressRail();
			if (t.setCurrentRail)
				t.setCurrentRail();
		},


		buildposter: function(player, controls, layers, media) {
			var t = this,
				poster =
				$('<div class="mejs-poster mejs-layer">' +
				'</div>')
					.appendTo(layers),
				posterUrl = player.$media.attr('poster');

			// prioriy goes to option (this is useful if you need to support iOS 3.x (iOS completely fails with poster)
			if (player.options.poster !== '') {
				posterUrl = player.options.poster;
			}

			// second, try the real poster
			if (posterUrl !== '' && posterUrl != null) {
				t.setPoster(posterUrl);
			} else {
				poster.hide();
			}

			media.addEventListener('play',function() {
				poster.hide();
			}, false);

			if(player.options.showPosterWhenEnded && player.options.autoRewind){
				media.addEventListener('ended',function() {
					poster.show();
				}, false);
			}
		},

		setPoster: function(url) {
			var t = this,
				posterDiv = t.container.find('.mejs-poster'),
				posterImg = posterDiv.find('img');

			if (posterImg.length == 0) {
				posterImg = $('<img width="100%" height="100%" />').appendTo(posterDiv);
			}

			posterImg.attr('src', url);
			posterDiv.css({'background-image' : 'url(' + url + ')'});
		},

		buildoverlays: function(player, controls, layers, media) {
            var t = this;
			if (!player.isVideo)
				return;

			var
			loading =
				$('<div class="mejs-overlay mejs-layer">'+
					'<div class="mejs-overlay-loading"><span></span></div>'+
				'</div>')
				.hide() // start out hidden
				.appendTo(layers),
			error =
				$('<div class="mejs-overlay mejs-layer">'+
					'<div class="mejs-overlay-error"></div>'+
				'</div>')
				.hide() // start out hidden
				.appendTo(layers),
			// this needs to come last so it's on top
			bigPlay =
				$('<div class="mejs-overlay mejs-layer mejs-overlay-play">'+
					'<div class="mejs-overlay-button"></div>'+
				'</div>')
				.appendTo(layers)
				.bind('click', function() {  // Removed 'touchstart' due issues on Samsung Android devices where a tap on bigPlay started and immediately stopped the video
					if (t.options.clickToPlayPause) {
						if (media.paused) {
							media.play();
						}
					}
				});

			/*
			if (mejs.MediaFeatures.isiOS || mejs.MediaFeatures.isAndroid) {
				bigPlay.remove();
				loading.remove();
			}
			*/


			// show/hide big play button
			media.addEventListener('play',function() {
				bigPlay.hide();
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				error.hide();
			}, false);

			media.addEventListener('playing', function() {
				bigPlay.hide();
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				error.hide();
			}, false);

			media.addEventListener('seeking', function() {
				loading.show();
				controls.find('.mejs-time-buffering').show();
			}, false);

			media.addEventListener('seeked', function() {
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
			}, false);

			media.addEventListener('pause',function() {
				if (!mejs.MediaFeatures.isiPhone) {
					bigPlay.show();
				}
			}, false);

			media.addEventListener('waiting', function() {
				loading.show();
				controls.find('.mejs-time-buffering').show();
			}, false);


			// show/hide loading
			media.addEventListener('loadeddata',function() {
				// for some reason Chrome is firing this event
				//if (mejs.MediaFeatures.isChrome && media.getAttribute && media.getAttribute('preload') === 'none')
				//	return;

				loading.show();
				controls.find('.mejs-time-buffering').show();
			}, false);
			media.addEventListener('canplay',function() {
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
			}, false);

			// error handling
			media.addEventListener('error',function() {
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				error.show();
				error.find('mejs-overlay-error').html("Error loading this resource");
			}, false);

			media.addEventListener('keydown', function(e) {
				t.onkeydown(player, media, e);
			}, false);
		},

		buildkeyboard: function(player, controls, layers, media) {

				var t = this;

				// listen for key presses
				t.globalBind('keydown', function(e) {
					return t.onkeydown(player, media, e);
				});

				// check if someone clicked outside a player region, then kill its focus
				t.globalBind('click', function(event) {
					player.hasFocus = $(event.target).closest('.mejs-container').length != 0;
				});

		},
		onkeydown: function(player, media, e) {
			if (player.hasFocus && player.options.enableKeyboard) {
				// find a matching key
				for (var i = 0, il = player.options.keyActions.length; i < il; i++) {
					var keyAction = player.options.keyActions[i];

					for (var j = 0, jl = keyAction.keys.length; j < jl; j++) {
						if (e.keyCode == keyAction.keys[j]) {
							if (typeof(e.preventDefault) == "function") e.preventDefault();
							keyAction.action(player, media, e.keyCode);
							return false;
						}
					}
				}
			}

			return true;
		},

		findTracks: function() {
			var t = this,
				tracktags = t.$media.find('track');

			// store for use by plugins
			t.tracks = [];
			tracktags.each(function(index, track) {

				track = $(track);

				t.tracks.push({
					srclang: (track.attr('srclang')) ? track.attr('srclang').toLowerCase() : '',
					src: track.attr('src'),
					kind: track.attr('kind'),
					label: track.attr('label') || '',
					entries: [],
					isLoaded: false
				});
			});
		},
		changeSkin: function(className) {
			this.container[0].className = 'mejs-container ' + className;
			this.setPlayerSize(this.width, this.height);
			this.setControlsSize();
		},
		play: function() {
			this.load();
			this.media.play();
		},
		pause: function() {
			try {
				this.media.pause();
			} catch (e) {}
		},
		load: function() {
			if (!this.isLoaded) {
				this.media.load();
			}

			this.isLoaded = true;
		},
		setMuted: function(muted) {
			this.media.setMuted(muted);
		},
		setCurrentTime: function(time) {
			this.media.setCurrentTime(time);
		},
		getCurrentTime: function() {
			return this.media.currentTime;
		},
		setVolume: function(volume) {
			this.media.setVolume(volume);
		},
		getVolume: function() {
			return this.media.volume;
		},
		setSrc: function(src) {
			this.media.setSrc(src);
		},
		remove: function() {
			var t = this, featureIndex, feature;

			// invoke features cleanup
			for (featureIndex in t.options.features) {
				feature = t.options.features[featureIndex];
				if (t['clean' + feature]) {
					try {
						t['clean' + feature](t);
					} catch (e) {
						// TODO: report control error
						//throw e;
						//
						//
					}
				}
			}

			// grab video and put it back in place
			if (!t.isDynamic) {
				t.$media.prop('controls', true);
				// detach events from the video
				// TODO: detach event listeners better than this;
				//       also detach ONLY the events attached by this plugin!
				t.$node.clone().insertBefore(t.container).show();
				t.$node.remove();
			} else {
				t.$node.insertBefore(t.container);
			}

			if (t.media.pluginType !== 'native') {
				t.media.remove();
			}

			// Remove the player from the mejs.players object so that pauseOtherPlayers doesn't blow up when trying to pause a non existance flash api.
			delete mejs.players[t.id];

			if (typeof t.container == 'object') {
				t.container.remove();
			}
			t.globalUnbind();
			delete t.node.player;
		}
	};

	(function(){
		var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;

		function splitEvents(events, id) {
			// add player ID as an event namespace so it's easier to unbind them all later
			var ret = {d: [], w: []};
			$.each((events || '').split(' '), function(k, v){
				var eventname = v + '.' + id;
				if (eventname.indexOf('.') === 0) {
					ret.d.push(eventname);
					ret.w.push(eventname);
				}
				else {
					ret[rwindow.test(v) ? 'w' : 'd'].push(eventname);
				}
			});
			ret.d = ret.d.join(' ');
			ret.w = ret.w.join(' ');
			return ret;
		}

		mejs.MediaElementPlayer.prototype.globalBind = function(events, data, callback) {
			var t = this;
			events = splitEvents(events, t.id);
			if (events.d) $(document).bind(events.d, data, callback);
			if (events.w) $(window).bind(events.w, data, callback);
		};

		mejs.MediaElementPlayer.prototype.globalUnbind = function(events, callback) {
			var t = this;
			events = splitEvents(events, t.id);
			if (events.d) $(document).unbind(events.d, callback);
			if (events.w) $(window).unbind(events.w, callback);
		};
	})();

	// turn into jQuery plugin
	if (typeof $ != 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					var player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			}
			else {
				this.each(function () {
					$(this).data('mediaelementplayer', new mejs.MediaElementPlayer(this, options));
				});
			}
			return this;
		};


		$(document).ready(function() {
			// auto enable using JSON attribute
			$('.mejs-player').mediaelementplayer();
		});
	}

	// push out to window
	window.MediaElementPlayer = mejs.MediaElementPlayer;

})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		playpauseText: mejs.i18n.t('Play/Pause')
	});

	// PLAY/pause BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildplaypause: function(player, controls, layers, media) {
			var 
				t = this,
				play = 
				$('<div class="mejs-button mejs-playpause-button mejs-play" >' +
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.playpauseText + '" aria-label="' + t.options.playpauseText + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function(e) {
					e.preventDefault();
				
					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}
					
					return false;
				});

			media.addEventListener('play',function() {
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);
			media.addEventListener('playing',function() {
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);


			media.addEventListener('pause',function() {
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
			media.addEventListener('paused',function() {
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
		}
	});
	
})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		stopText: 'Stop'
	});

	// STOP BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildstop: function(player, controls, layers, media) {
			var t = this,
				stop = 
				$('<div class="mejs-button mejs-stop-button mejs-stop">' +
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.stopText + '" aria-label="' + t.options.stopText + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function() {
					if (!media.paused) {
						media.pause();
					}
					if (media.currentTime > 0) {
						media.setCurrentTime(0);
                        media.pause();
						controls.find('.mejs-time-current').width('0px');
						controls.find('.mejs-time-handle').css('left', '0px');
						controls.find('.mejs-time-float-current').html( mejs.Utility.secondsToTimeCode(0) );
						controls.find('.mejs-currenttime').html( mejs.Utility.secondsToTimeCode(0) );					
						layers.find('.mejs-poster').show();
					}
				});
		}
	});
	
})(mejs.$);

(function($) {
	// progress/loaded bar
	$.extend(MediaElementPlayer.prototype, {
		buildprogress: function(player, controls, layers, media) {

			$('<div class="mejs-time-rail">'+
				'<span class="mejs-time-total">'+
					'<span class="mejs-time-buffering"></span>'+
					'<span class="mejs-time-loaded"></span>'+
					'<span class="mejs-time-current"></span>'+
					'<span class="mejs-time-handle"></span>'+
					'<span class="mejs-time-float">' + 
						'<span class="mejs-time-float-current">00:00</span>' + 
						'<span class="mejs-time-float-corner"></span>' + 
					'</span>'+
				'</span>'+
			'</div>')
				.appendTo(controls);
				controls.find('.mejs-time-buffering').hide();

			var 
				t = this,
				total = controls.find('.mejs-time-total'),
				loaded  = controls.find('.mejs-time-loaded'),
				current  = controls.find('.mejs-time-current'),
				handle  = controls.find('.mejs-time-handle'),
				timefloat  = controls.find('.mejs-time-float'),
				timefloatcurrent  = controls.find('.mejs-time-float-current'),
				handleMouseMove = function (e) {
					// mouse or touch position relative to the object
					if (e.originalEvent.changedTouches) {
						var x = e.originalEvent.changedTouches[0].pageX;
					}else{
						var x = e.pageX;
					}
					
					var offset = total.offset(),
						width = total.outerWidth(true),
						percentage = 0,
						newTime = 0,
						pos = 0;


					if (media.duration) {
						if (x < offset.left) {
							x = offset.left;
						} else if (x > width + offset.left) {
							x = width + offset.left;
						}
						
						pos = x - offset.left;
						percentage = (pos / width);
						newTime = (percentage <= 0.02) ? 0 : percentage * media.duration;

						// seek to where the mouse is
						if (mouseIsDown && newTime !== media.currentTime) {
							media.setCurrentTime(newTime);
						}

						// position floating time box
						if (!mejs.MediaFeatures.hasTouch) {
								timefloat.css('left', pos);
								timefloatcurrent.html( mejs.Utility.secondsToTimeCode(newTime) );
								timefloat.show();
						}
					}
				},
				mouseIsDown = false,
				mouseIsOver = false;

			// handle clicks
			//controls.find('.mejs-time-rail').delegate('span', 'click', handleMouseMove);
			total
				.bind('mousedown touchstart', function (e) {
					// only handle left clicks or touch
					if (e.which === 1 || e.which === 0) {
						mouseIsDown = true;
						handleMouseMove(e);
						t.globalBind('mousemove.dur touchmove.dur', function(e) {
							handleMouseMove(e);
						});
						t.globalBind('mouseup.dur touchend.dur', function (e) {
							mouseIsDown = false;
							timefloat.hide();
							t.globalUnbind('.dur');
						});
						return false;
					}
				})
				.bind('mouseenter', function(e) {
					mouseIsOver = true;
					t.globalBind('mousemove.dur', function(e) {
						handleMouseMove(e);
					});
					if (!mejs.MediaFeatures.hasTouch) {
						timefloat.show();
					}
				})
				.bind('mouseleave',function(e) {
					mouseIsOver = false;
					if (!mouseIsDown) {
						t.globalUnbind('.dur');
						timefloat.hide();
					}
				});

			// loading
			media.addEventListener('progress', function (e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);

			// current time
			media.addEventListener('timeupdate', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);
			
			
			// store for later use
			t.loaded = loaded;
			t.total = total;
			t.current = current;
			t.handle = handle;
		},
		setProgressRail: function(e) {

			var
				t = this,
				target = (e != undefined) ? e.target : t.media,
				percent = null;			

			// newest HTML5 spec has buffered array (FF4, Webkit)
			if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
				// TODO: account for a real array with multiple values (only Firefox 4 has this so far) 
				percent = target.buffered.end(0) / target.duration;
			} 
			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			// to be anything other than 0. If the byte count is available we use this instead.
			// Browsers that support the else if do not seem to have the bufferedBytes value and
			// should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
			else if (target && target.bytesTotal != undefined && target.bytesTotal > 0 && target.bufferedBytes != undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			}
			// Firefox 3 with an Ogg file seems to go this way
			else if (e && e.lengthComputable && e.total != 0) {
				percent = e.loaded/e.total;
			}

			// finally update the progress bar
			if (percent !== null) {
				percent = Math.min(1, Math.max(0, percent));
				// update loaded bar
				if (t.loaded && t.total) {
					t.loaded.width(t.total.width() * percent);
				}
			}
		},
		setCurrentRail: function() {

			var t = this;
		
			if (t.media.currentTime != undefined && t.media.duration) {

				// update bar and handle
				if (t.total && t.handle) {
					var 
						newWidth = Math.round(t.total.width() * t.media.currentTime / t.media.duration),
						handlePos = newWidth - Math.round(t.handle.outerWidth(true) / 2);

					t.current.width(newWidth);
					t.handle.css('left', handlePos);
				}
			}

		}	
	});
})(mejs.$);

(function($) {
	
	// options
	$.extend(mejs.MepDefaults, {
		duration: -1,
		timeAndDurationSeparator: '<span> | </span>'
	});


	// current and duration 00:00 / 00:00
	$.extend(MediaElementPlayer.prototype, {
		buildcurrent: function(player, controls, layers, media) {
			var t = this;
			
			$('<div class="mejs-time">'+
					'<span class="mejs-currenttime">' + (player.options.alwaysShowHours ? '00:' : '')
					+ (player.options.showTimecodeFrameCount? '00:00:00':'00:00')+ '</span>'+
					'</div>')
					.appendTo(controls);
			
			t.currenttime = t.controls.find('.mejs-currenttime');

			media.addEventListener('timeupdate',function() {
				player.updateCurrent();
			}, false);
		},


		buildduration: function(player, controls, layers, media) {
			var t = this;
			
			if (controls.children().last().find('.mejs-currenttime').length > 0) {
				$(t.options.timeAndDurationSeparator +
					'<span class="mejs-duration">' + 
						(t.options.duration > 0 ? 
							mejs.Utility.secondsToTimeCode(t.options.duration, t.options.alwaysShowHours || t.media.duration > 3600, t.options.showTimecodeFrameCount,  t.options.framesPerSecond || 25) :
				   			((player.options.alwaysShowHours ? '00:' : '') + (player.options.showTimecodeFrameCount? '00:00:00':'00:00')) 
				   		) + 
					'</span>')
					.appendTo(controls.find('.mejs-time'));
			} else {

				// add class to current time
				controls.find('.mejs-currenttime').parent().addClass('mejs-currenttime-container');
				
				$('<div class="mejs-time mejs-duration-container">'+
					'<span class="mejs-duration">' + 
						(t.options.duration > 0 ? 
							mejs.Utility.secondsToTimeCode(t.options.duration, t.options.alwaysShowHours || t.media.duration > 3600, t.options.showTimecodeFrameCount,  t.options.framesPerSecond || 25) :
				   			((player.options.alwaysShowHours ? '00:' : '') + (player.options.showTimecodeFrameCount? '00:00:00':'00:00')) 
				   		) + 
					'</span>' +
				'</div>')
				.appendTo(controls);
			}
			
			t.durationD = t.controls.find('.mejs-duration');

			media.addEventListener('timeupdate',function() {
				player.updateDuration();
			}, false);
		},
		
		updateCurrent:  function() {
			var t = this;

			if (t.currenttime) {
				t.currenttime.html(mejs.Utility.secondsToTimeCode(t.media.currentTime, t.options.alwaysShowHours || t.media.duration > 3600, t.options.showTimecodeFrameCount,  t.options.framesPerSecond || 25));
			}
		},
		
		updateDuration: function() {
			var t = this;

			//Toggle the long video class if the video is longer than an hour.
			t.container.toggleClass("mejs-long-video", t.media.duration > 3600);
			
			if (t.durationD && (t.options.duration > 0 || t.media.duration)) {
				t.durationD.html(mejs.Utility.secondsToTimeCode(t.options.duration > 0 ? t.options.duration : t.media.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond || 25));
			}		
		}
	});

})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		muteText: mejs.i18n.t('Mute Toggle'),
		hideVolumeOnTouchDevices: true,
		
		audioVolume: 'horizontal',
		videoVolume: 'vertical'
	});

	$.extend(MediaElementPlayer.prototype, {
		buildvolume: function(player, controls, layers, media) {
				
			// Android and iOS don't support volume controls
			if ((mejs.MediaFeatures.isAndroid || mejs.MediaFeatures.isiOS) && this.options.hideVolumeOnTouchDevices)
				return;
			
			var t = this,
				mode = (t.isVideo) ? t.options.videoVolume : t.options.audioVolume,
				mute = (mode == 'horizontal') ?
				
				// horizontal version
				$('<div class="mejs-button mejs-volume-button mejs-mute">'+
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.muteText + '" aria-label="' + t.options.muteText + '"></button>'+
				'</div>' +
				'<div class="mejs-horizontal-volume-slider">'+ // outer background
					'<div class="mejs-horizontal-volume-total"></div>'+ // line background
					'<div class="mejs-horizontal-volume-current"></div>'+ // current volume
					'<div class="mejs-horizontal-volume-handle"></div>'+ // handle
				'</div>'
				)
					.appendTo(controls) :
				
				// vertical version
				$('<div class="mejs-button mejs-volume-button mejs-mute">'+
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.muteText + '" aria-label="' + t.options.muteText + '"></button>'+
					'<div class="mejs-volume-slider">'+ // outer background
						'<div class="mejs-volume-total"></div>'+ // line background
						'<div class="mejs-volume-current"></div>'+ // current volume
						'<div class="mejs-volume-handle"></div>'+ // handle
					'</div>'+
				'</div>')
					.appendTo(controls),
			volumeSlider = t.container.find('.mejs-volume-slider, .mejs-horizontal-volume-slider'),
			volumeTotal = t.container.find('.mejs-volume-total, .mejs-horizontal-volume-total'),
			volumeCurrent = t.container.find('.mejs-volume-current, .mejs-horizontal-volume-current'),
			volumeHandle = t.container.find('.mejs-volume-handle, .mejs-horizontal-volume-handle'),

			positionVolumeHandle = function(volume, secondTry) {

				if (!volumeSlider.is(':visible') && typeof secondTry == 'undefined') {
					volumeSlider.show();
					positionVolumeHandle(volume, true);
					volumeSlider.hide()
					return;
				}
			
				// correct to 0-1
				volume = Math.max(0,volume);
				volume = Math.min(volume,1);					
				
				// ajust mute button style
				if (volume == 0) {
					mute.removeClass('mejs-mute').addClass('mejs-unmute');
				} else {
					mute.removeClass('mejs-unmute').addClass('mejs-mute');
				}				

				// position slider 
				if (mode == 'vertical') {
					var 
					
						// height of the full size volume slider background
						totalHeight = volumeTotal.height(),
						
						// top/left of full size volume slider background
						totalPosition = volumeTotal.position(),
						
						// the new top position based on the current volume
						// 70% volume on 100px height == top:30px
						newTop = totalHeight - (totalHeight * volume);
	
					// handle
					volumeHandle.css('top', Math.round(totalPosition.top + newTop - (volumeHandle.height() / 2)));
	
					// show the current visibility
					volumeCurrent.height(totalHeight - newTop );
					volumeCurrent.css('top', totalPosition.top + newTop);
				} else {
					var 
					
						// height of the full size volume slider background
						totalWidth = volumeTotal.width(),
						
						// top/left of full size volume slider background
						totalPosition = volumeTotal.position(),
						
						// the new left position based on the current volume
						newLeft = totalWidth * volume;
	
					// handle
					volumeHandle.css('left', Math.round(totalPosition.left + newLeft - (volumeHandle.width() / 2)));
	
					// rezize the current part of the volume bar
					volumeCurrent.width( Math.round(newLeft) );
				}
			},
			handleVolumeMove = function(e) {
				
				var volume = null,
					totalOffset = volumeTotal.offset();
				
				// calculate the new volume based on the moust position
				if (mode == 'vertical') {
				
					var
						railHeight = volumeTotal.height(),
						totalTop = parseInt(volumeTotal.css('top').replace(/px/,''),10),
						newY = e.pageY - totalOffset.top;
						
					volume = (railHeight - newY) / railHeight;
						
					// the controls just hide themselves (usually when mouse moves too far up)
					if (totalOffset.top == 0 || totalOffset.left == 0)
						return;
					
				} else {
					var
						railWidth = volumeTotal.width(),
						newX = e.pageX - totalOffset.left;
						
					volume = newX / railWidth;
				}
				
				// ensure the volume isn't outside 0-1
				volume = Math.max(0,volume);
				volume = Math.min(volume,1);
				
				// position the slider and handle			
				positionVolumeHandle(volume);
				
				// set the media object (this will trigger the volumechanged event)
				if (volume == 0) {
					media.setMuted(true);
				} else {
					media.setMuted(false);
				}
				media.setVolume(volume);			
			},
			mouseIsDown = false,
			mouseIsOver = false;

			// SLIDER
			
			mute
				.hover(function() {
					volumeSlider.show();
					mouseIsOver = true;
				}, function() {
					mouseIsOver = false;	
						
					if (!mouseIsDown && mode == 'vertical')	{
						volumeSlider.hide();
					}
				});
			
			volumeSlider
				.bind('mouseover', function() {
					mouseIsOver = true;	
				})
				.bind('mousedown', function (e) {
					handleVolumeMove(e);
					t.globalBind('mousemove.vol', function(e) {
						handleVolumeMove(e);
					});
					t.globalBind('mouseup.vol', function () {
						mouseIsDown = false;
						t.globalUnbind('.vol');

						if (!mouseIsOver && mode == 'vertical') {
							volumeSlider.hide();
						}
					});
					mouseIsDown = true;
						
					return false;
				});


			// MUTE button
			mute.find('button').click(function() {
				media.setMuted( !media.muted );
			});

			// listen for volume change events from other sources
			media.addEventListener('volumechange', function(e) {
				if (!mouseIsDown) {
					if (media.muted) {
						positionVolumeHandle(0);
						mute.removeClass('mejs-mute').addClass('mejs-unmute');
					} else {
						positionVolumeHandle(media.volume);
						mute.removeClass('mejs-unmute').addClass('mejs-mute');
					}
				}
			}, false);

			if (t.container.is(':visible')) {
				// set initial volume
				positionVolumeHandle(player.options.startVolume);

				// mutes the media and sets the volume icon muted if the initial volume is set to 0
        if (player.options.startVolume === 0) {
          media.setMuted(true);
        }

				// shim gets the startvolume as a parameter, but we have to set it on the native <video> and <audio> elements
				if (media.pluginType === 'native') {
					media.setVolume(player.options.startVolume);
				}
			}
		}
	});
	
})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		usePluginFullScreen: true,
		newWindowCallback: function() { return '';},
		fullscreenText: mejs.i18n.t('Fullscreen')
	});

	$.extend(MediaElementPlayer.prototype, {

		isFullScreen: false,

		isNativeFullScreen: false,

		isInIframe: false,

		buildfullscreen: function(player, controls, layers, media) {

			if (!player.isVideo)
				return;

			player.isInIframe = (window.location != window.parent.location);

			// native events
			if (mejs.MediaFeatures.hasTrueNativeFullScreen) {

				// chrome doesn't alays fire this in an iframe
				var func = function(e) {
					if (player.isFullScreen) {
						if (mejs.MediaFeatures.isFullScreen()) {
							player.isNativeFullScreen = true;
							// reset the controls once we are fully in full screen
							player.setControlsSize();
						} else {
							player.isNativeFullScreen = false;
							// when a user presses ESC
							// make sure to put the player back into place
							player.exitFullScreen();
						}
					}
				};

				player.globalBind(mejs.MediaFeatures.fullScreenEventName, func);
			}

			var t = this,
				normalHeight = 0,
				normalWidth = 0,
				container = player.container,
				fullscreenBtn =
					$('<div class="mejs-button mejs-fullscreen-button">' +
						'<button type="button" aria-controls="' + t.id + '" title="' + t.options.fullscreenText + '" aria-label="' + t.options.fullscreenText + '"></button>' +
					'</div>')
					.appendTo(controls);

				if (t.media.pluginType === 'native' || (!t.options.usePluginFullScreen && !mejs.MediaFeatures.isFirefox)) {

					fullscreenBtn.click(function() {
						var isFullScreen = (mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || player.isFullScreen;

						if (isFullScreen) {
							player.exitFullScreen();
						} else {
							player.enterFullScreen();
						}
					});

				} else {

					var hideTimeout = null,
						supportsPointerEvents = (function() {
							// TAKEN FROM MODERNIZR
							var element = document.createElement('x'),
								documentElement = document.documentElement,
								getComputedStyle = window.getComputedStyle,
								supports;
							if(!('pointerEvents' in element.style)){
								return false;
							}
							element.style.pointerEvents = 'auto';
							element.style.pointerEvents = 'x';
							documentElement.appendChild(element);
							supports = getComputedStyle &&
								getComputedStyle(element, '').pointerEvents === 'auto';
							documentElement.removeChild(element);
							return !!supports;
						})();

					//

					if (supportsPointerEvents && !mejs.MediaFeatures.isOpera) { // opera doesn't allow this :(

						// allows clicking through the fullscreen button and controls down directly to Flash

						/*
						 When a user puts his mouse over the fullscreen button, the controls are disabled
						 So we put a div over the video and another one on iether side of the fullscreen button
						 that caputre mouse movement
						 and restore the controls once the mouse moves outside of the fullscreen button
						*/

						var fullscreenIsDisabled = false,
							restoreControls = function() {
								if (fullscreenIsDisabled) {
									// hide the hovers
									for (var i in hoverDivs) {
										hoverDivs[i].hide();
									}

									// restore the control bar
									fullscreenBtn.css('pointer-events', '');
									t.controls.css('pointer-events', '');

									// prevent clicks from pausing video
									t.media.removeEventListener('click', t.clickToPlayPauseCallback);

									// store for later
									fullscreenIsDisabled = false;
								}
							},
							hoverDivs = {},
							hoverDivNames = ['top', 'left', 'right', 'bottom'],
							i, len,
							positionHoverDivs = function() {
								var fullScreenBtnOffsetLeft = fullscreenBtn.offset().left - t.container.offset().left,
									fullScreenBtnOffsetTop = fullscreenBtn.offset().top - t.container.offset().top,
									fullScreenBtnWidth = fullscreenBtn.outerWidth(true),
									fullScreenBtnHeight = fullscreenBtn.outerHeight(true),
									containerWidth = t.container.width(),
									containerHeight = t.container.height();

								for (i in hoverDivs) {
									hoverDivs[i].css({position: 'absolute', top: 0, left: 0}); //, backgroundColor: '#f00'});
								}

								// over video, but not controls
								hoverDivs['top']
									.width( containerWidth )
									.height( fullScreenBtnOffsetTop );

								// over controls, but not the fullscreen button
								hoverDivs['left']
									.width( fullScreenBtnOffsetLeft )
									.height( fullScreenBtnHeight )
									.css({top: fullScreenBtnOffsetTop});

								// after the fullscreen button
								hoverDivs['right']
									.width( containerWidth - fullScreenBtnOffsetLeft - fullScreenBtnWidth )
									.height( fullScreenBtnHeight )
									.css({top: fullScreenBtnOffsetTop,
										 left: fullScreenBtnOffsetLeft + fullScreenBtnWidth});

								// under the fullscreen button
								hoverDivs['bottom']
									.width( containerWidth )
									.height( containerHeight - fullScreenBtnHeight - fullScreenBtnOffsetTop )
									.css({top: fullScreenBtnOffsetTop + fullScreenBtnHeight});
							};

						t.globalBind('resize', function() {
							positionHoverDivs();
						});

						for (i = 0, len = hoverDivNames.length; i < len; i++) {
							hoverDivs[hoverDivNames[i]] = $('<div class="mejs-fullscreen-hover" />').appendTo(t.container).mouseover(restoreControls).hide();
						}

						// on hover, kill the fullscreen button's HTML handling, allowing clicks down to Flash
						fullscreenBtn.on('mouseover',function() {

							if (!t.isFullScreen) {

								var buttonPos = fullscreenBtn.offset(),
									containerPos = player.container.offset();

								// move the button in Flash into place
								media.positionFullscreenButton(buttonPos.left - containerPos.left, buttonPos.top - containerPos.top, false);

								// allows click through
								fullscreenBtn.css('pointer-events', 'none');
								t.controls.css('pointer-events', 'none');

								// restore click-to-play
								t.media.addEventListener('click', t.clickToPlayPauseCallback);

								// show the divs that will restore things
								for (i in hoverDivs) {
									hoverDivs[i].show();
								}

								positionHoverDivs();

								fullscreenIsDisabled = true;
							}

						});

						// restore controls anytime the user enters or leaves fullscreen
						media.addEventListener('fullscreenchange', function(e) {
							t.isFullScreen = !t.isFullScreen;
							// don't allow plugin click to pause video - messes with
							// plugin's controls
							if (t.isFullScreen) {
								t.media.removeEventListener('click', t.clickToPlayPauseCallback);
							} else {
								t.media.addEventListener('click', t.clickToPlayPauseCallback);
							}
							restoreControls();
						});


						// the mouseout event doesn't work on the fullscren button, because we already killed the pointer-events
						// so we use the document.mousemove event to restore controls when the mouse moves outside the fullscreen button

						t.globalBind('mousemove', function(e) {

							// if the mouse is anywhere but the fullsceen button, then restore it all
							if (fullscreenIsDisabled) {

								var fullscreenBtnPos = fullscreenBtn.offset();


								if (e.pageY < fullscreenBtnPos.top || e.pageY > fullscreenBtnPos.top + fullscreenBtn.outerHeight(true) ||
									e.pageX < fullscreenBtnPos.left || e.pageX > fullscreenBtnPos.left + fullscreenBtn.outerWidth(true)
									) {

									fullscreenBtn.css('pointer-events', '');
									t.controls.css('pointer-events', '');

									fullscreenIsDisabled = false;
								}
							}
						});



					} else {

						// the hover state will show the fullscreen button in Flash to hover up and click

						fullscreenBtn
							.on('mouseover', function() {

								if (hideTimeout !== null) {
									clearTimeout(hideTimeout);
									delete hideTimeout;
								}

								var buttonPos = fullscreenBtn.offset(),
									containerPos = player.container.offset();

								media.positionFullscreenButton(buttonPos.left - containerPos.left, buttonPos.top - containerPos.top, true);

							})
							.on('mouseout', function() {

								if (hideTimeout !== null) {
									clearTimeout(hideTimeout);
									delete hideTimeout;
								}

								hideTimeout = setTimeout(function() {
									media.hideFullscreenButton();
								}, 1500);


							});
					}
				}

			player.fullscreenBtn = fullscreenBtn;

			t.globalBind('keydown',function (e) {
				if (((mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || t.isFullScreen) && e.keyCode == 27) {
					player.exitFullScreen();
				}
			});

		},

		cleanfullscreen: function(player) {
			player.exitFullScreen();
		},

        containerSizeTimeout: null,

		enterFullScreen: function() {

			var t = this;

			// firefox+flash can't adjust plugin sizes without resetting :(
			if (t.media.pluginType !== 'native' && (mejs.MediaFeatures.isFirefox || t.options.usePluginFullScreen)) {
				//t.media.setFullscreen(true);
				//player.isFullScreen = true;
				return;
			}

			// set it to not show scroll bars so 100% will work
            $(document.documentElement).addClass('mejs-fullscreen');

			// store sizing
			normalHeight = t.container.height();
			normalWidth = t.container.width();

			// attempt to do true fullscreen (Safari 5.1 and Firefox Nightly only for now)
			if (t.media.pluginType === 'native') {
				if (mejs.MediaFeatures.hasTrueNativeFullScreen) {

					mejs.MediaFeatures.requestFullScreen(t.container[0]);
					//return;

					if (t.isInIframe) {
						// sometimes exiting from fullscreen doesn't work
						// notably in Chrome <iframe>. Fixed in version 17
						setTimeout(function checkFullscreen() {

							if (t.isNativeFullScreen) {
								var zoomMultiplier = window["devicePixelRatio"] || 1;
								// Use a percent error margin since devicePixelRatio is a float and not exact.
								var percentErrorMargin = 0.002; // 0.2%
								var windowWidth = zoomMultiplier * $(window).width();
								var screenWidth = screen.width;
								var absDiff = Math.abs(screenWidth - windowWidth);
								var marginError = screenWidth * percentErrorMargin;

								// check if the video is suddenly not really fullscreen
								if (absDiff > marginError) {
									// manually exit
									t.exitFullScreen();
								} else {
									// test again
									setTimeout(checkFullscreen, 500);
								}
							}


						}, 500);
					}

				} else if (mejs.MediaFeatures.hasSemiNativeFullScreen) {
					t.media.webkitEnterFullscreen();
					return;
				}
			}

			// check for iframe launch
			if (t.isInIframe) {
				var url = t.options.newWindowCallback(this);


				if (url !== '') {

					// launch immediately
					if (!mejs.MediaFeatures.hasTrueNativeFullScreen) {
						t.pause();
						window.open(url, t.id, 'top=0,left=0,width=' + screen.availWidth + ',height=' + screen.availHeight + ',resizable=yes,scrollbars=no,status=no,toolbar=no');
						return;
					} else {
						setTimeout(function() {
							if (!t.isNativeFullScreen) {
								t.pause();
								window.open(url, t.id, 'top=0,left=0,width=' + screen.availWidth + ',height=' + screen.availHeight + ',resizable=yes,scrollbars=no,status=no,toolbar=no');
							}
						}, 250);
					}
				}

			}

			// full window code



			// make full size
			t.container
				.addClass('mejs-container-fullscreen')
				.width('100%')
				.height('100%');
				//.css({position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', width: '100%', height: '100%', 'z-index': 1000});

			// Only needed for safari 5.1 native full screen, can cause display issues elsewhere
			// Actually, it seems to be needed for IE8, too
			//if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
				t.containerSizeTimeout = setTimeout(function() {
					t.container.css({width: '100%', height: '100%'});
					t.setControlsSize();
				}, 500);
			//}

			if (t.media.pluginType === 'native') {
				t.$media
					.width('100%')
					.height('100%');
			} else {
				t.container.find('.mejs-shim')
					.width('100%')
					.height('100%');

				//if (!mejs.MediaFeatures.hasTrueNativeFullScreen) {
					t.media.setVideoSize($(window).width(),$(window).height());
				//}
			}

			t.layers.children('div')
				.width('100%')
				.height('100%');

			if (t.fullscreenBtn) {
				t.fullscreenBtn
					.removeClass('mejs-fullscreen')
					.addClass('mejs-unfullscreen');
			}

			t.setControlsSize();
			t.isFullScreen = true;

			t.container.find('.mejs-captions-text').css('font-size', screen.width / t.width * 1.00 * 100 + '%');
			t.container.find('.mejs-captions-position').css('bottom', '45px');
		},

		exitFullScreen: function() {

			var t = this;

            // Prevent container from attempting to stretch a second time
            clearTimeout(t.containerSizeTimeout);

			// firefox can't adjust plugins
			if (t.media.pluginType !== 'native' && mejs.MediaFeatures.isFirefox) {
				t.media.setFullscreen(false);
				//player.isFullScreen = false;
				return;
			}

			// come outo of native fullscreen
			if (mejs.MediaFeatures.hasTrueNativeFullScreen && (mejs.MediaFeatures.isFullScreen() || t.isFullScreen)) {
				mejs.MediaFeatures.cancelFullScreen();
			}

			// restore scroll bars to document
            $(document.documentElement).removeClass('mejs-fullscreen');

			t.container
				.removeClass('mejs-container-fullscreen')
				.width(normalWidth)
				.height(normalHeight);
				//.css({position: '', left: '', top: '', right: '', bottom: '', overflow: 'inherit', width: normalWidth + 'px', height: normalHeight + 'px', 'z-index': 1});

			if (t.media.pluginType === 'native') {
				t.$media
					.width(normalWidth)
					.height(normalHeight);
			} else {
				t.container.find('.mejs-shim')
					.width(normalWidth)
					.height(normalHeight);

				t.media.setVideoSize(normalWidth, normalHeight);
			}

			t.layers.children('div')
				.width(normalWidth)
				.height(normalHeight);

			t.fullscreenBtn
				.removeClass('mejs-unfullscreen')
				.addClass('mejs-fullscreen');

			t.setControlsSize();
			t.isFullScreen = false;

			t.container.find('.mejs-captions-text').css('font-size','');
			t.container.find('.mejs-captions-position').css('bottom', '');
		}
	});

})(mejs.$);

(function($) {

	// Speed
	$.extend(mejs.MepDefaults, {

		speeds: ['1.50', '1.25', '1.00', '0.75'],

		defaultSpeed: '1.00'

	});

	$.extend(MediaElementPlayer.prototype, {

		buildspeed: function(player, controls, layers, media) {
			var t = this;

			if (t.media.pluginType == 'native') {
				var s = '<div class="mejs-button mejs-speed-button"><button type="button">'+t.options.defaultSpeed+'x</button><div class="mejs-speed-selector"><ul>';
				var i, ss;

				if ($.inArray(t.options.defaultSpeed, t.options.speeds) === -1) {
					t.options.speeds.push(t.options.defaultSpeed);
				}

				t.options.speeds.sort(function(a, b) {
					return parseFloat(b) - parseFloat(a);
				});

				for (i = 0; i < t.options.speeds.length; i++) {
					s += '<li><input type="radio" name="speed" value="' + t.options.speeds[i] + '" id="' + t.options.speeds[i] + '" ';
					if (t.options.speeds[i] == t.options.defaultSpeed) {
						s += 'checked=true ';
						s += '/><label for="' + t.options.speeds[i] + '" class="mejs-speed-selected">'+ t.options.speeds[i] + 'x</label></li>';
					} else {
						s += '/><label for="' + t.options.speeds[i] + '">'+ t.options.speeds[i] + 'x</label></li>';
					}
				}
				s += '</ul></div></div>';

				player.speedButton = $(s).appendTo(controls);

				player.playbackspeed = t.options.defaultSpeed;

				player.speedButton
				.on('click', 'input[type=radio]', function() {
					player.playbackspeed = $(this).attr('value');
					media.playbackRate = parseFloat(player.playbackspeed);
					player.speedButton.find('button').text(player.playbackspeed + 'x');
					player.speedButton.find('.mejs-speed-selected').removeClass('mejs-speed-selected');
					player.speedButton.find('input[type=radio]:checked').next().addClass('mejs-speed-selected');
				});

				ss = player.speedButton.find('.mejs-speed-selector');
				ss.height(this.speedButton.find('.mejs-speed-selector ul').outerHeight(true) + player.speedButton.find('.mejs-speed-translations').outerHeight(true));
				ss.css('top', (-1 * ss.height()) + 'px');
			}
		}
	});

})(mejs.$);

(function($) {

	// add extra default options
	$.extend(mejs.MepDefaults, {
		// this will automatically turn on a <track>
		startLanguage: '',

		tracksText: mejs.i18n.t('Captions/Subtitles'),

		// option to remove the [cc] button when no <track kind="subtitles"> are present
		hideCaptionsButtonWhenEmpty: true,

		// If true and we only have one track, change captions to popup
		toggleCaptionsButtonWhenOnlyOne: false,

		// #id or .class
		slidesSelector: ''
	});

	$.extend(MediaElementPlayer.prototype, {

		hasChapters: false,

		buildtracks: function(player, controls, layers, media) {
			if (player.tracks.length === 0)
				return;

			var t = this,
				i,
				options = '';

			if (t.domNode.textTracks) { // if browser will do native captions, prefer mejs captions, loop through tracks and hide
				for (i = t.domNode.textTracks.length - 1; i >= 0; i--) {
					t.domNode.textTracks[i].mode = "hidden";
				}
			}
			player.chapters =
					$('<div class="mejs-chapters mejs-layer"></div>')
						.prependTo(layers).hide();
			player.captions =
					$('<div class="mejs-captions-layer mejs-layer"><div class="mejs-captions-position mejs-captions-position-hover"><span class="mejs-captions-text"></span></div></div>')
						.prependTo(layers).hide();
			player.captionsText = player.captions.find('.mejs-captions-text');
			player.captionsButton =
					$('<div class="mejs-button mejs-captions-button">'+
						'<button type="button" aria-controls="' + t.id + '" title="' + t.options.tracksText + '" aria-label="' + t.options.tracksText + '"></button>'+
						'<div class="mejs-captions-selector">'+
							'<ul>'+
								'<li>'+
									'<input type="radio" name="' + player.id + '_captions" id="' + player.id + '_captions_none" value="none" checked="checked" />' +
									'<label for="' + player.id + '_captions_none">' + mejs.i18n.t('None') +'</label>'+
								'</li>'	+
							'</ul>'+
						'</div>'+
					'</div>')
						.appendTo(controls);


			var subtitleCount = 0;
			for (i=0; i<player.tracks.length; i++) {
				if (player.tracks[i].kind == 'subtitles') {
					subtitleCount++;
				}
			}

			// if only one language then just make the button a toggle
			if (t.options.toggleCaptionsButtonWhenOnlyOne && subtitleCount == 1){
				// click
				player.captionsButton.on('click',function() {
					if (player.selectedTrack === null) {
						lang = player.tracks[0].srclang;
					} else {
						lang = 'none';
					}
					player.setTrack(lang);
				});
			} else {
				// hover or keyboard focus
				player.captionsButton.on( 'mouseenter focusin', function() {
					$(this).find('.mejs-captions-selector').css('visibility','visible');
				})

				// handle clicks to the language radio buttons
				.on('click','input[type=radio]',function() {
					lang = this.value;
					player.setTrack(lang);
				});

				player.captionsButton.on( 'mouseleave focusout', function() {
					$(this).find(".mejs-captions-selector").css("visibility","hidden");
				});

			}

			if (!player.options.alwaysShowControls) {
				// move with controls
				player.container
					.bind('controlsshown', function () {
						// push captions above controls
						player.container.find('.mejs-captions-position').addClass('mejs-captions-position-hover');

					})
					.bind('controlshidden', function () {
						if (!media.paused) {
							// move back to normal place
							player.container.find('.mejs-captions-position').removeClass('mejs-captions-position-hover');
						}
					});
			} else {
				player.container.find('.mejs-captions-position').addClass('mejs-captions-position-hover');
			}

			player.trackToLoad = -1;
			player.selectedTrack = null;
			player.isLoadingTrack = false;

			// add to list
			for (i=0; i<player.tracks.length; i++) {
				if (player.tracks[i].kind == 'subtitles') {
					player.addTrackButton(player.tracks[i].srclang, player.tracks[i].label);
				}
			}

			// start loading tracks
			player.loadNextTrack();

			media.addEventListener('timeupdate',function(e) {
				player.displayCaptions();
			}, false);

			if (player.options.slidesSelector !== '') {
				player.slidesContainer = $(player.options.slidesSelector);

				media.addEventListener('timeupdate',function(e) {
					player.displaySlides();
				}, false);

			}

			media.addEventListener('loadedmetadata', function(e) {
				player.displayChapters();
			}, false);

			player.container.hover(
				function () {
					// chapters
					if (player.hasChapters) {
						player.chapters.css('visibility','visible');
						player.chapters.fadeIn(200).height(player.chapters.find('.mejs-chapter').outerHeight());
					}
				},
				function () {
					if (player.hasChapters && !media.paused) {
						player.chapters.fadeOut(200, function() {
							$(this).css('visibility','hidden');
							$(this).css('display','block');
						});
					}
				});

			// check for autoplay
			if (player.node.getAttribute('autoplay') !== null) {
				player.chapters.css('visibility','hidden');
			}
		},

		setTrack: function(lang){

			var t = this,
				i;

			if (lang == 'none') {
				t.selectedTrack = null;
				t.captionsButton.removeClass('mejs-captions-enabled');
			} else {
				for (i=0; i<t.tracks.length; i++) {
					if (t.tracks[i].srclang == lang) {
						if (t.selectedTrack === null)
							t.captionsButton.addClass('mejs-captions-enabled');
						t.selectedTrack = t.tracks[i];
						t.captions.attr('lang', t.selectedTrack.srclang);
						t.displayCaptions();
						break;
					}
				}
			}
		},

		loadNextTrack: function() {
			var t = this;

			t.trackToLoad++;
			if (t.trackToLoad < t.tracks.length) {
				t.isLoadingTrack = true;
				t.loadTrack(t.trackToLoad);
			} else {
				// add done?
				t.isLoadingTrack = false;

				t.checkForTracks();
			}
		},

		loadTrack: function(index){
			var
				t = this,
				track = t.tracks[index],
				after = function() {

					track.isLoaded = true;

					// create button
					//t.addTrackButton(track.srclang);
					t.enableTrackButton(track.srclang, track.label);

					t.loadNextTrack();

				};


			$.ajax({
				url: track.src,
				dataType: "text",
				success: function(d) {

					// parse the loaded file
					if (typeof d == "string" && (/<tt\s+xml/ig).exec(d)) {
						track.entries = mejs.TrackFormatParser.dfxp.parse(d);
					} else {
						track.entries = mejs.TrackFormatParser.webvtt.parse(d);
					}

					after();

					if (track.kind == 'chapters') {
						t.media.addEventListener('play', function(e) {
							if (t.media.duration > 0) {
								t.displayChapters(track);
							}
						}, false);
					}

					if (track.kind == 'slides') {
						t.setupSlides(track);
					}
				},
				error: function() {
					t.loadNextTrack();
				}
			});
		},

		enableTrackButton: function(lang, label) {
			var t = this;

			if (label === '') {
				label = mejs.language.codes[lang] || lang;
			}

			t.captionsButton
				.find('input[value=' + lang + ']')
					.prop('disabled',false)
				.siblings('label')
					.html( label );

			// auto select
			if (t.options.startLanguage == lang) {
				$('#' + t.id + '_captions_' + lang).prop('checked', true).trigger('click');
			}

			t.adjustLanguageBox();
		},

		addTrackButton: function(lang, label) {
			var t = this;
			if (label === '') {
				label = mejs.language.codes[lang] || lang;
			}

			t.captionsButton.find('ul').append(
				$('<li>'+
					'<input type="radio" name="' + t.id + '_captions" id="' + t.id + '_captions_' + lang + '" value="' + lang + '" disabled="disabled" />' +
					'<label for="' + t.id + '_captions_' + lang + '">' + label + ' (loading)' + '</label>'+
				'</li>')
			);

			t.adjustLanguageBox();

			// remove this from the dropdownlist (if it exists)
			t.container.find('.mejs-captions-translations option[value=' + lang + ']').remove();
		},

		adjustLanguageBox:function() {
			var t = this;
			// adjust the size of the outer box
			t.captionsButton.find('.mejs-captions-selector').height(
				t.captionsButton.find('.mejs-captions-selector ul').outerHeight(true) +
				t.captionsButton.find('.mejs-captions-translations').outerHeight(true)
			);
		},

		checkForTracks: function() {
			var
				t = this,
				hasSubtitles = false;

			// check if any subtitles
			if (t.options.hideCaptionsButtonWhenEmpty) {
				for (i=0; i<t.tracks.length; i++) {
					if (t.tracks[i].kind == 'subtitles') {
						hasSubtitles = true;
						break;
					}
				}

				if (!hasSubtitles) {
					t.captionsButton.hide();
					t.setControlsSize();
				}
			}
		},

		displayCaptions: function() {

			if (typeof this.tracks == 'undefined')
				return;

			var
				t = this,
				i,
				track = t.selectedTrack;

			if (track !== null && track.isLoaded) {
				for (i=0; i<track.entries.times.length; i++) {
					if (t.media.currentTime >= track.entries.times[i].start && t.media.currentTime <= track.entries.times[i].stop) {
						// Set the line before the timecode as a class so the cue can be targeted if needed
						t.captionsText.html(track.entries.text[i]).attr('class', 'mejs-captions-text ' + (track.entries.times[i].identifier || ''));
						t.captions.show().height(0);
						return; // exit out if one is visible;
					}
				}
				t.captions.hide();
			} else {
				t.captions.hide();
			}
		},

		setupSlides: function(track) {
			var t = this;

			t.slides = track;
			t.slides.entries.imgs = [t.slides.entries.text.length];
			t.showSlide(0);

		},

		showSlide: function(index) {
			if (typeof this.tracks == 'undefined' || typeof this.slidesContainer == 'undefined') {
				return;
			}

			var t = this,
				url = t.slides.entries.text[index],
				img = t.slides.entries.imgs[index];

			if (typeof img == 'undefined' || typeof img.fadeIn == 'undefined') {

				t.slides.entries.imgs[index] = img = $('<img src="' + url + '">')
						.on('load', function() {
							img.appendTo(t.slidesContainer)
								.hide()
								.fadeIn()
								.siblings(':visible')
									.fadeOut();

						});

			} else {

				if (!img.is(':visible') && !img.is(':animated')) {

					//

					img.fadeIn()
						.siblings(':visible')
							.fadeOut();
				}
			}

		},

		displaySlides: function() {

			if (typeof this.slides == 'undefined')
				return;

			var
				t = this,
				slides = t.slides,
				i;

			for (i=0; i<slides.entries.times.length; i++) {
				if (t.media.currentTime >= slides.entries.times[i].start && t.media.currentTime <= slides.entries.times[i].stop){

					t.showSlide(i);

					return; // exit out if one is visible;
				}
			}
		},

		displayChapters: function() {
			var
				t = this,
				i;

			for (i=0; i<t.tracks.length; i++) {
				if (t.tracks[i].kind == 'chapters' && t.tracks[i].isLoaded) {
					t.drawChapters(t.tracks[i]);
					t.hasChapters = true;
					break;
				}
			}
		},

		drawChapters: function(chapters) {
			var
				t = this,
				i,
				dur,
				//width,
				//left,
				percent = 0,
				usedPercent = 0;

			t.chapters.empty();

			for (i=0; i<chapters.entries.times.length; i++) {
				dur = chapters.entries.times[i].stop - chapters.entries.times[i].start;
				percent = Math.floor(dur / t.media.duration * 100);
				if (percent + usedPercent > 100 || // too large
					i == chapters.entries.times.length-1 && percent + usedPercent < 100) // not going to fill it in
					{
					percent = 100 - usedPercent;
				}
				//width = Math.floor(t.width * dur / t.media.duration);
				//left = Math.floor(t.width * chapters.entries.times[i].start / t.media.duration);
				//if (left + width > t.width) {
				//	width = t.width - left;
				//}

				t.chapters.append( $(
					'<div class="mejs-chapter" rel="' + chapters.entries.times[i].start + '" style="left: ' + usedPercent.toString() + '%;width: ' + percent.toString() + '%;">' +
						'<div class="mejs-chapter-block' + ((i==chapters.entries.times.length-1) ? ' mejs-chapter-block-last' : '') + '">' +
							'<span class="ch-title">' + chapters.entries.text[i] + '</span>' +
							'<span class="ch-time">' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].start) + '&ndash;' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].stop) + '</span>' +
						'</div>' +
					'</div>'));
				usedPercent += percent;
			}

			t.chapters.find('div.mejs-chapter').click(function() {
				t.media.setCurrentTime( parseFloat( $(this).attr('rel') ) );
				if (t.media.paused) {
					t.media.play();
				}
			});

			t.chapters.show();
		}
	});



	mejs.language = {
		codes:  {
			af:'Afrikaans',
			sq:'Albanian',
			ar:'Arabic',
			be:'Belarusian',
			bg:'Bulgarian',
			ca:'Catalan',
			zh:'Chinese',
			'zh-cn':'Chinese Simplified',
			'zh-tw':'Chinese Traditional',
			hr:'Croatian',
			cs:'Czech',
			da:'Danish',
			nl:'Dutch',
			en:'English',
			et:'Estonian',
			fl:'Filipino',
			fi:'Finnish',
			fr:'French',
			gl:'Galician',
			de:'German',
			el:'Greek',
			ht:'Haitian Creole',
			iw:'Hebrew',
			hi:'Hindi',
			hu:'Hungarian',
			is:'Icelandic',
			id:'Indonesian',
			ga:'Irish',
			it:'Italian',
			ja:'Japanese',
			ko:'Korean',
			lv:'Latvian',
			lt:'Lithuanian',
			mk:'Macedonian',
			ms:'Malay',
			mt:'Maltese',
			no:'Norwegian',
			fa:'Persian',
			pl:'Polish',
			pt:'Portuguese',
			// 'pt-pt':'Portuguese (Portugal)',
			ro:'Romanian',
			ru:'Russian',
			sr:'Serbian',
			sk:'Slovak',
			sl:'Slovenian',
			es:'Spanish',
			sw:'Swahili',
			sv:'Swedish',
			tl:'Tagalog',
			th:'Thai',
			tr:'Turkish',
			uk:'Ukrainian',
			vi:'Vietnamese',
			cy:'Welsh',
			yi:'Yiddish'
		}
	};

	/*
	Parses WebVTT format which should be formatted as
	================================
	WEBVTT

	1
	00:00:01,1 --> 00:00:05,000
	A line of text

	2
	00:01:15,1 --> 00:02:05,000
	A second line of text

	===============================

	Adapted from: http://www.delphiki.com/html5/playr
	*/
	mejs.TrackFormatParser = {
		webvtt: {
			pattern_timecode: /^((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,

			parse: function(trackText) {
				var
					i = 0,
					lines = mejs.TrackFormatParser.split2(trackText, /\r?\n/),
					entries = {text:[], times:[]},
					timecode,
					text,
					identifier;
				for(; i<lines.length; i++) {
					timecode = this.pattern_timecode.exec(lines[i]);

					if (timecode && i<lines.length) {
						if ((i - 1) >= 0 && lines[i - 1] !== '') {
							identifier = lines[i - 1];
						}
						i++;
						// grab all the (possibly multi-line) text that follows
						text = lines[i];
						i++;
						while(lines[i] !== '' && i<lines.length){
							text = text + '\n' + lines[i];
							i++;
						}
						text = $.trim(text).replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
						// Text is in a different array so I can use .join
						entries.text.push(text);
						entries.times.push(
						{
							identifier: identifier,
							start: (mejs.Utility.convertSMPTEtoSeconds(timecode[1]) === 0) ? 0.200 : mejs.Utility.convertSMPTEtoSeconds(timecode[1]),
							stop: mejs.Utility.convertSMPTEtoSeconds(timecode[3]),
							settings: timecode[5]
						});
					}
					identifier = '';
				}
				return entries;
			}
		},
		// Thanks to Justin Capella: https://github.com/johndyer/mediaelement/pull/420
		dfxp: {
			parse: function(trackText) {
				trackText = $(trackText).filter("tt");
				var
					i = 0,
					container = trackText.children("div").eq(0),
					lines = container.find("p"),
					styleNode = trackText.find("#" + container.attr("style")),
					styles,
					begin,
					end,
					text,
					entries = {text:[], times:[]};


				if (styleNode.length) {
					var attributes = styleNode.removeAttr("id").get(0).attributes;
					if (attributes.length) {
						styles = {};
						for (i = 0; i < attributes.length; i++) {
							styles[attributes[i].name.split(":")[1]] = attributes[i].value;
						}
					}
				}

				for(i = 0; i<lines.length; i++) {
					var style;
					var _temp_times = {
						start: null,
						stop: null,
						style: null
					};
					if (lines.eq(i).attr("begin")) _temp_times.start = mejs.Utility.convertSMPTEtoSeconds(lines.eq(i).attr("begin"));
					if (!_temp_times.start && lines.eq(i-1).attr("end")) _temp_times.start = mejs.Utility.convertSMPTEtoSeconds(lines.eq(i-1).attr("end"));
					if (lines.eq(i).attr("end")) _temp_times.stop = mejs.Utility.convertSMPTEtoSeconds(lines.eq(i).attr("end"));
					if (!_temp_times.stop && lines.eq(i+1).attr("begin")) _temp_times.stop = mejs.Utility.convertSMPTEtoSeconds(lines.eq(i+1).attr("begin"));
					if (styles) {
						style = "";
						for (var _style in styles) {
							style += _style + ":" + styles[_style] + ";";
						}
					}
					if (style) _temp_times.style = style;
					if (_temp_times.start === 0) _temp_times.start = 0.200;
					entries.times.push(_temp_times);
					text = $.trim(lines.eq(i).html()).replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
					entries.text.push(text);
					if (entries.times.start === 0) entries.times.start = 2;
				}
				return entries;
			}
		},
		split2: function (text, regex) {
			// normal version for compliant browsers
			// see below for IE fix
			return text.split(regex);
		}
	};

	// test for browsers with bad String.split method.
	if ('x\n\ny'.split(/\n/gi).length != 3) {
		// add super slow IE8 and below version
		mejs.TrackFormatParser.split2 = function(text, regex) {
			var
				parts = [],
				chunk = '',
				i;

			for (i=0; i<text.length; i++) {
				chunk += text.substring(i,i+1);
				if (regex.test(chunk)) {
					parts.push(chunk.replace(regex, ''));
					chunk = '';
				}
			}
			parts.push(chunk);
			return parts;
		};
	}

})(mejs.$);

/*
* ContextMenu Plugin
* 
*
*/

(function($) {

$.extend(mejs.MepDefaults,
	{ 'contextMenuItems': [
		// demo of a fullscreen option
		{ 
			render: function(player) {
				
				// check for fullscreen plugin
				if (typeof player.enterFullScreen == 'undefined')
					return null;
			
				if (player.isFullScreen) {
					return mejs.i18n.t('Turn off Fullscreen');
				} else {
					return mejs.i18n.t('Go Fullscreen');
				}
			},
			click: function(player) {
				if (player.isFullScreen) {
					player.exitFullScreen();
				} else {
					player.enterFullScreen();
				}
			}
		}
		,
		// demo of a mute/unmute button
		{ 
			render: function(player) {
				if (player.media.muted) {
					return mejs.i18n.t('Unmute');
				} else {
					return mejs.i18n.t('Mute');
				}
			},
			click: function(player) {
				if (player.media.muted) {
					player.setMuted(false);
				} else {
					player.setMuted(true);
				}
			}
		},
		// separator
		{
			isSeparator: true
		}
		,
		// demo of simple download video
		{ 
			render: function(player) {
				return mejs.i18n.t('Download Video');
			},
			click: function(player) {
				window.location.href = player.media.currentSrc;
			}
		}	
	]}
);


	$.extend(MediaElementPlayer.prototype, {
		buildcontextmenu: function(player, controls, layers, media) {
			
			// create context menu
			player.contextMenu = $('<div class="mejs-contextmenu"></div>')
								.appendTo($('body'))
								.hide();
			
			// create events for showing context menu
			player.container.bind('contextmenu', function(e) {
				if (player.isContextMenuEnabled) {
					e.preventDefault();
					player.renderContextMenu(e.clientX-1, e.clientY-1);
					return false;
				}
			});
			player.container.bind('click', function() {
				player.contextMenu.hide();
			});	
			player.contextMenu.bind('mouseleave', function() {

				//
				player.startContextMenuTimer();
				
			});		
		},

		cleancontextmenu: function(player) {
			player.contextMenu.remove();
		},
		
		isContextMenuEnabled: true,
		enableContextMenu: function() {
			this.isContextMenuEnabled = true;
		},
		disableContextMenu: function() {
			this.isContextMenuEnabled = false;
		},
		
		contextMenuTimeout: null,
		startContextMenuTimer: function() {
			//
			
			var t = this;
			
			t.killContextMenuTimer();
			
			t.contextMenuTimer = setTimeout(function() {
				t.hideContextMenu();
				t.killContextMenuTimer();
			}, 750);
		},
		killContextMenuTimer: function() {
			var timer = this.contextMenuTimer;
			
			//
			
			if (timer != null) {				
				clearTimeout(timer);
				delete timer;
				timer = null;
			}
		},		
		
		hideContextMenu: function() {
			this.contextMenu.hide();
		},
		
		renderContextMenu: function(x,y) {
			
			// alway re-render the items so that things like "turn fullscreen on" and "turn fullscreen off" are always written correctly
			var t = this,
				html = '',
				items = t.options.contextMenuItems;
			
			for (var i=0, il=items.length; i<il; i++) {
				
				if (items[i].isSeparator) {
					html += '<div class="mejs-contextmenu-separator"></div>';
				} else {
				
					var rendered = items[i].render(t);
				
					// render can return null if the item doesn't need to be used at the moment
					if (rendered != null) {
						html += '<div class="mejs-contextmenu-item" data-itemindex="' + i + '" id="element-' + (Math.random()*1000000) + '">' + rendered + '</div>';
					}
				}
			}
			
			// position and show the context menu
			t.contextMenu
				.empty()
				.append($(html))
				.css({top:y, left:x})
				.show();
				
			// bind events
			t.contextMenu.find('.mejs-contextmenu-item').each(function() {
							
				// which one is this?
				var $dom = $(this),
					itemIndex = parseInt( $dom.data('itemindex'), 10 ),
					item = t.options.contextMenuItems[itemIndex];
				
				// bind extra functionality?
				if (typeof item.show != 'undefined')
					item.show( $dom , t);
				
				// bind click action
				$dom.click(function() {			
					// perform click action
					if (typeof item.click != 'undefined')
						item.click(t);
					
					// close
					t.contextMenu.hide();				
				});				
			});	
			
			// stop the controls from hiding
			setTimeout(function() {
				t.killControlsTimer('rev3');	
			}, 100);
						
		}
	});
	
})(mejs.$);
/**
 * Postroll plugin
 */
(function($) {

	$.extend(mejs.MepDefaults, {
		postrollCloseText: mejs.i18n.t('Close')
	});

	// Postroll
	$.extend(MediaElementPlayer.prototype, {
		buildpostroll: function(player, controls, layers, media) {
			var
				t = this,
				postrollLink = t.container.find('link[rel="postroll"]').attr('href');

			if (typeof postrollLink !== 'undefined') {
				player.postroll =
					$('<div class="mejs-postroll-layer mejs-layer"><a class="mejs-postroll-close" onclick="$(this).parent().hide();return false;">' + t.options.postrollCloseText + '</a><div class="mejs-postroll-layer-content"></div></div>').prependTo(layers).hide();

				t.media.addEventListener('ended', function (e) {
					$.ajax({
						dataType: 'html',
						url: postrollLink,
						success: function (data, textStatus) {
							layers.find('.mejs-postroll-layer-content').html(data);
						}
					});
					player.postroll.show();
				}, false);
			}
		}
	});

})(mejs.$);


/*! jquery.selectBoxIt - v3.8.1 - 2013-10-17
* http://www.selectboxit.com
* Copyright (c) 2013 Greg Franko; Licensed MIT*/

// Immediately-Invoked Function Expression (IIFE) [Ben Alman Blog Post](http://benalman.com/news/2010/11/immediately-invoked-function-expression/) that calls another IIFE that contains all of the plugin logic.  I used this pattern so that anyone viewing this code would not have to scroll to the bottom of the page to view the local parameters that were passed to the main IIFE.

;(function (selectBoxIt) {

    //ECMAScript 5 Strict Mode: [John Resig Blog Post](http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/)
    "use strict";

    // Calls the second IIFE and locally passes in the global jQuery, window, and document objects
    selectBoxIt(window.jQuery, window, document);

}

// Locally passes in `jQuery`, the `window` object, the `document` object, and an `undefined` variable.  The `jQuery`, `window` and `document` objects are passed in locally, to improve performance, since javascript first searches for a variable match within the local variables set before searching the global variables set.  All of the global variables are also passed in locally to be minifier friendly. `undefined` can be passed in locally, because it is not a reserved word in JavaScript.

(function ($, window, document, undefined) {

    // ECMAScript 5 Strict Mode: [John Resig Blog Post](http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/)
    "use strict";

    // Calling the jQueryUI Widget Factory Method
    $.widget("selectBox.selectBoxIt", {

        // Plugin version
        VERSION: "3.8.1",

        // These options will be used as defaults
        options: {

            // **showEffect**: Accepts String: "none", "fadeIn", "show", "slideDown", or any of the jQueryUI show effects (i.e. "bounce")
            "showEffect": "none",

            // **showEffectOptions**: Accepts an object literal.  All of the available properties are based on the jqueryUI effect options
            "showEffectOptions": {},

            // **showEffectSpeed**: Accepts Number (milliseconds) or String: "slow", "medium", or "fast"
            "showEffectSpeed": "medium",

            // **hideEffect**: Accepts String: "none", "fadeOut", "hide", "slideUp", or any of the jQueryUI hide effects (i.e. "explode")
            "hideEffect": "none",

            // **hideEffectOptions**: Accepts an object literal.  All of the available properties are based on the jqueryUI effect options
            "hideEffectOptions": {},

            // **hideEffectSpeed**: Accepts Number (milliseconds) or String: "slow", "medium", or "fast"
            "hideEffectSpeed": "medium",

            // **showFirstOption**: Shows the first dropdown list option within the dropdown list options list
            "showFirstOption": true,

            // **defaultText**: Overrides the text used by the dropdown list selected option to allow a user to specify custom text.  Accepts a String.
            "defaultText": "",

            // **defaultIcon**: Overrides the icon used by the dropdown list selected option to allow a user to specify a custom icon.  Accepts a String (CSS class name(s)).
            "defaultIcon": "",

            // **downArrowIcon**: Overrides the default down arrow used by the dropdown list to allow a user to specify a custom image.  Accepts a String (CSS class name(s)).
            "downArrowIcon": "",

            // **theme**: Provides theming support for Twitter Bootstrap and jQueryUI
            "theme": "default",

            // **keydownOpen**: Opens the dropdown if the up or down key is pressed when the dropdown is focused
            "keydownOpen": true,

            // **isMobile**: Function to determine if a user's browser is a mobile browser
            "isMobile": function() {

                // Adapted from http://www.detectmobilebrowsers.com
                var ua = navigator.userAgent || navigator.vendor || window.opera;

                // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
                return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);

            },

            // **native**: Triggers the native select box when a user interacts with the drop down
            "native": false,

            // **aggressiveChange**: Will select a drop down item (and trigger a change event) when a user navigates to the item via the keyboard (up and down arrow or search), before a user selects an option with a click or the enter key
            "aggressiveChange": false,

            // **selectWhenHidden: Will allow a user to select an option using the keyboard when the drop down list is hidden and focused
            "selectWhenHidden": true,

            // **viewport**: Allows for a custom domnode used for the viewport. Accepts a selector.  Default is $(window).
            "viewport": $(window),

            // **similarSearch**: Optimizes the search for lists with many similar values (i.e. State lists) by making it easier to navigate through
            "similarSearch": false,

            // **copyAttributes**: HTML attributes that will be copied over to the new drop down
            "copyAttributes": [

                "title",

                "rel"

            ],

            // **copyClasses**: HTML classes that will be copied over to the new drop down.  The value indicates where the classes should be copied.  The default value is 'button', but you can also use 'container' (recommended) or 'none'.
            "copyClasses": "button",

            // **nativeMousedown**: Mimics native firefox drop down behavior by opening the drop down on mousedown and selecting the currently hovered drop down option on mouseup
            "nativeMousedown": false,

            // **customShowHideEvent**: Prevents the drop down from opening on click or mousedown, which allows a user to open/close the drop down with a custom event handler.
            "customShowHideEvent": false,

            // **autoWidth**: Makes sure the width of the drop down is wide enough to fit all of the drop down options
            "autoWidth": true,

            // **html**: Determines whether or not option text is rendered as html or as text
            "html": true,

            // **populate**: Convenience option that accepts JSON data, an array, a single object, or valid HTML string to add options to the drop down list
            "populate": "",

            // **dynamicPositioning**: Determines whether or not the drop down list should fit inside it's viewport
            "dynamicPositioning": true,

            // **hideCurrent**: Determines whether or not the currently selected drop down option is hidden in the list
            "hideCurrent": false

        },

        // Get Themes
        // ----------
        //      Retrieves the active drop down theme and returns the theme object
        "getThemes": function() {

            var self = this,
                theme = $(self.element).attr("data-theme") || "c";

            return {

                // Twitter Bootstrap Theme
                "bootstrap": {

                    "focus": "active",

                    "hover": "",

                    "enabled": "enabled",

                    "disabled": "disabled",

                    "arrow": "caret",

                    "button": "btn",

                    "list": "dropdown-menu",

                    "container": "bootstrap",

                    "open": "open"

                },

                // jQueryUI Theme
                "jqueryui": {

                    "focus": "ui-state-focus",

                    "hover": "ui-state-hover",

                    "enabled": "ui-state-enabled",

                    "disabled": "ui-state-disabled",

                    "arrow": "ui-icon ui-icon-triangle-1-s",

                    "button": "ui-widget ui-state-default",

                    "list": "ui-widget ui-widget-content",

                    "container": "jqueryui",

                    "open": "selectboxit-open"

                },

                // jQuery Mobile Theme
                "jquerymobile": {

                    "focus": "ui-btn-down-" + theme,

                    "hover": "ui-btn-hover-" + theme,

                    "enabled": "ui-enabled",

                    "disabled": "ui-disabled",

                    "arrow": "ui-icon ui-icon-arrow-d ui-icon-shadow",

                    "button": "ui-btn ui-btn-icon-right ui-btn-corner-all ui-shadow ui-btn-up-" + theme,

                    "list": "ui-btn ui-btn-icon-right ui-btn-corner-all ui-shadow ui-btn-up-" + theme,

                    "container": "jquerymobile",

                    "open": "selectboxit-open"

                },

                "default": {

                    "focus": "selectboxit-focus",

                    "hover": "selectboxit-hover",

                    "enabled": "selectboxit-enabled",

                    "disabled": "selectboxit-disabled",

                    "arrow": "selectboxit-default-arrow",

                    "button": "selectboxit-btn",

                    "list": "selectboxit-list",

                    "container": "selectboxit-container",

                    "open": "selectboxit-open"

                }

            };

        },

        // isDeferred
        // ----------
        //      Checks if parameter is a defered object
        isDeferred: function(def) {
            return $.isPlainObject(def) && def.promise && def.done;
        },

        // _Create
        // -------
        //      Sets the Plugin Instance variables and
        //      constructs the plugin.  Only called once.
        _create: function(internal) {

            var self = this,
                populateOption = self.options["populate"],
                userTheme = self.options["theme"];

            // If the element calling SelectBoxIt is not a select box or is not visible
            if(!self.element.is("select")) {

                // Exits the plugin
                return;

            }

            // Stores a reference to the parent Widget class
            self.widgetProto = $.Widget.prototype;

            // The original select box DOM element
            self.originalElem = self.element[0];

            // The original select box DOM element wrapped in a jQuery object
            self.selectBox = self.element;

            if(self.options["populate"] && self.add && !internal) {

                self.add(populateOption);

            }

            // All of the original select box options
            self.selectItems = self.element.find("option");

            // The first option in the original select box
            self.firstSelectItem = self.selectItems.slice(0, 1);

            // The html document height
            self.documentHeight = $(document).height();

            self.theme = $.isPlainObject(userTheme) ? $.extend({}, self.getThemes()["default"], userTheme) : self.getThemes()[userTheme] ? self.getThemes()[userTheme] : self.getThemes()["default"];

            // The index of the currently selected dropdown list option
            self.currentFocus = 0;

            // Keeps track of which blur events will hide the dropdown list options
            self.blur = true;

             // Array holding all of the original select box options text
            self.textArray = [];

            // Maintains search order in the `search` method
            self.currentIndex = 0;

            // Maintains the current search text in the `search` method
            self.currentText = "";

            // Whether or not the dropdown list opens up or down (depending on how much room is on the page)
            self.flipped = false;

            // If the create method is not called internally by the plugin
            if(!internal) {

                // Saves the original select box `style` attribute within the `selectBoxStyles` plugin instance property
                self.selectBoxStyles = self.selectBox.attr("style");

            }

            // Creates the dropdown elements that will become the dropdown
            // Creates the ul element that will become the dropdown options list
            // Add's all attributes (excluding id, class names, and unselectable properties) to the drop down and drop down items list
            // Hides the original select box and adds the new plugin DOM elements to the page
            // Adds event handlers to the new dropdown list
            self._createDropdownButton()._createUnorderedList()._copyAttributes()._replaceSelectBox()._addClasses(self.theme)._eventHandlers();

            if(self.originalElem.disabled && self.disable) {

                // Disables the dropdown list if the original dropdown list had the `disabled` attribute
                self.disable();

            }

            // If the Aria Accessibility Module has been included
            if(self._ariaAccessibility) {

                // Adds ARIA accessibillity tags to the dropdown list
                self._ariaAccessibility();

            }

            self.isMobile = self.options["isMobile"]();

            if(self._mobile) {

                // Adds mobile support
                self._mobile();

            }

            // If the native option is set to true
            if(self.options["native"]) {

                // Triggers the native select box when a user is interacting with the drop down
                this._applyNativeSelect();

            }

            // Triggers a custom `create` event on the original dropdown list
            self.triggerEvent("create");

            // Maintains chainability
            return self;

        },

        // _Create dropdown button
        // -----------------------
        //      Creates new dropdown and dropdown elements to replace
        //      the original select box with a dropdown list
        _createDropdownButton: function() {

            var self = this,
                originalElemId = self.originalElemId = self.originalElem.id || "",
                originalElemValue = self.originalElemValue = self.originalElem.value || "",
                originalElemName = self.originalElemName = self.originalElem.name || "",
                copyClasses = self.options["copyClasses"],
                selectboxClasses = self.selectBox.attr("class") || "";

            // Creates a dropdown element that contains the dropdown list text value
            self.dropdownText = $("<span/>", {

                // Dynamically sets the dropdown `id` attribute
                "id": originalElemId && originalElemId + "SelectBoxItText",

                "class": "selectboxit-text",

                // IE specific attribute to not allow the element to be selected
                "unselectable": "on",

                // Sets the dropdown `text` to equal the original select box default value
                "text": self.firstSelectItem.text()

            }).

            // Sets the HTML5 data attribute on the dropdownText `dropdown` element
            attr("data-val", originalElemValue);

            self.dropdownImageContainer = $("<span/>", {

                "class": "selectboxit-option-icon-container"

            });

            // Creates a dropdown element that contains the dropdown list text value
            self.dropdownImage = $("<i/>", {

                // Dynamically sets the dropdown `id` attribute
                "id": originalElemId && originalElemId + "SelectBoxItDefaultIcon",

                "class": "selectboxit-default-icon",

                // IE specific attribute to not allow the element to be selected
                "unselectable": "on"

            });

            // Creates a dropdown to act as the new dropdown list
            self.dropdown = $("<span/>", {

                // Dynamically sets the dropdown `id` attribute
                "id": originalElemId && originalElemId + "SelectBoxIt",

                "class": "selectboxit " + (copyClasses === "button" ? selectboxClasses: "") + " " + (self.selectBox.prop("disabled") ? self.theme["disabled"]: self.theme["enabled"]),

                // Sets the dropdown `name` attribute to be the same name as the original select box
                "name": originalElemName,

                // Sets the dropdown `tabindex` attribute to 0 to allow the dropdown to be focusable
                "tabindex": self.selectBox.attr("tabindex") || "0",

                // IE specific attribute to not allow the element to be selected
                "unselectable": "on"

            }).

            // Appends the default text to the inner dropdown list dropdown element
            append(self.dropdownImageContainer.append(self.dropdownImage)).append(self.dropdownText);

            // Create the dropdown container that will hold all of the dropdown list dom elements
            self.dropdownContainer = $("<span/>", {

                "id": originalElemId && originalElemId + "SelectBoxItContainer",

                "class": 'selectboxit-container ' + self.theme.container + ' ' + (copyClasses === "container" ? selectboxClasses: "")

            }).

            // Appends the inner dropdown list dropdown element to the dropdown list container dropdown element
            append(self.dropdown);

            // Maintains chainability
            return self;

        },

        // _Create Unordered List
        // ----------------------
        //      Creates an unordered list element to hold the
        //        new dropdown list options that directly match
        //        the values of the original select box options
        _createUnorderedList: function() {

            // Storing the context of the widget
            var self = this,

                dataDisabled,

                optgroupClass,

                optgroupElement,

                iconClass,

                iconUrl,

                iconUrlClass,

                iconUrlStyle,

                // Declaring the variable that will hold all of the dropdown list option elements
                currentItem = "",

                originalElemId = self.originalElemId || "",

                // Creates an unordered list element
                createdList = $("<ul/>", {

                    // Sets the unordered list `id` attribute
                    "id": originalElemId && originalElemId + "SelectBoxItOptions",

                    "class": "selectboxit-options",

                    //Sets the unordered list `tabindex` attribute to -1 to prevent the unordered list from being focusable
                    "tabindex": -1

                }),

                currentDataSelectedText,

                currentDataText,

                currentDataSearch,

                currentText,

                currentOption,

                parent;

            // Checks the `showFirstOption` plugin option to determine if the first dropdown list option should be shown in the options list.
            if (!self.options["showFirstOption"]) {

                // Disables the first select box option
                self.selectItems.first().attr("disabled", "disabled");

                // Excludes the first dropdown list option from the options list
                self.selectItems = self.selectBox.find("option").slice(1);

            }

            // Loops through the original select box options list and copies the text of each
            // into new list item elements of the new dropdown list
            self.selectItems.each(function(index) {

                currentOption = $(this);

                optgroupClass = "";

                optgroupElement = "";

                dataDisabled = currentOption.prop("disabled");

                iconClass = currentOption.attr("data-icon") || "";

                iconUrl = currentOption.attr("data-iconurl") || "";

                iconUrlClass = iconUrl ? "selectboxit-option-icon-url": "";

                iconUrlStyle = iconUrl ? 'style="background-image:url(\'' + iconUrl + '\');"': "";

                currentDataSelectedText = currentOption.attr("data-selectedtext");

                currentDataText = currentOption.attr("data-text");

                currentText = currentDataText ? currentDataText: currentOption.text();

                parent = currentOption.parent();

                // If the current option being traversed is within an optgroup

                if(parent.is("optgroup")) {

                    optgroupClass = "selectboxit-optgroup-option";

                    if(currentOption.index() === 0) {

                         optgroupElement = '<span class="selectboxit-optgroup-header ' + parent.first().attr("class") + '"data-disabled="true">' + parent.first().attr("label") + '</span>';

                    }

                }

                currentOption.attr("value", this.value);

                // Uses string concatenation for speed (applies HTML attribute encoding)
                currentItem += optgroupElement + '<li data-id="' + index + '" data-val="' + this.value + '" data-disabled="' + dataDisabled + '" class="' + optgroupClass + " selectboxit-option " + ($(this).attr("class") || "") + '"><a class="selectboxit-option-anchor"><span class="selectboxit-option-icon-container"><i class="selectboxit-option-icon ' + iconClass + ' ' + (iconUrlClass || self.theme["container"]) + '"' + iconUrlStyle + '></i></span>' + (self.options["html"] ? currentText: self.htmlEscape(currentText)) + '</a></li>';

                currentDataSearch = currentOption.attr("data-search");

                // Stores all of the original select box options text inside of an array
                // (Used later in the `searchAlgorithm` method)
                self.textArray[index] = dataDisabled ? "": currentDataSearch ? currentDataSearch: currentText;

                // Checks the original select box option for the `selected` attribute
                if (this.selected) {

                    // Replaces the default text with the selected option text
                    self._setText(self.dropdownText, currentDataSelectedText || currentText);

                    //Set the currently selected option
                    self.currentFocus = index;

                }

            });

            // If the `defaultText` option is being used
            if ((self.options["defaultText"] || self.selectBox.attr("data-text"))) {

                var defaultedText = self.options["defaultText"] || self.selectBox.attr("data-text");

                // Overrides the current dropdown default text with the value the user specifies in the `defaultText` option
                self._setText(self.dropdownText, defaultedText);

                self.options["defaultText"] = defaultedText;

            }

            // Append the list item to the unordered list
            createdList.append(currentItem);

            // Stores the dropdown list options list inside of the `list` instance variable
            self.list = createdList;

            // Append the dropdown list options list to the dropdown container element
            self.dropdownContainer.append(self.list);

            // Stores the individual dropdown list options inside of the `listItems` instance variable
            self.listItems = self.list.children("li");

            self.listAnchors = self.list.find("a");

            // Sets the 'selectboxit-option-first' class name on the first drop down option
            self.listItems.first().addClass("selectboxit-option-first");

            // Sets the 'selectboxit-option-last' class name on the last drop down option
            self.listItems.last().addClass("selectboxit-option-last");

            // Set the disabled CSS class for select box options
            self.list.find("li[data-disabled='true']").not(".optgroupHeader").addClass(self.theme["disabled"]);

            self.dropdownImage.addClass(self.selectBox.attr("data-icon") || self.options["defaultIcon"] || self.listItems.eq(self.currentFocus).find("i").attr("class"));

            self.dropdownImage.attr("style", self.listItems.eq(self.currentFocus).find("i").attr("style"));

            //Maintains chainability
            return self;

        },

        // _Replace Select Box
        // -------------------
        //      Hides the original dropdown list and inserts
        //        the new DOM elements
        _replaceSelectBox: function() {

            var self = this,
                height,
                originalElemId = self.originalElem.id || "",
                size = self.selectBox.attr("data-size"),
                listSize = self.listSize = size === undefined ? "auto" : size === "0" || "size" === "auto" ? "auto" : +size,
                downArrowContainerWidth,
                dropdownImageWidth;

            // Hides the original select box
            self.selectBox.css("display", "none").

            // Adds the new dropdown list to the page directly after the hidden original select box element
            after(self.dropdownContainer);

            self.dropdownContainer.appendTo('body').

            addClass('selectboxit-rendering');

            // The height of the dropdown list
            height = self.dropdown.height();

            // The down arrow element of the dropdown list
            self.downArrow = $("<i/>", {

                // Dynamically sets the dropdown `id` attribute of the dropdown list down arrow
                "id": originalElemId && originalElemId + "SelectBoxItArrow",

                "class": "selectboxit-arrow",

                // IE specific attribute to not allow the dropdown list text to be selected
                "unselectable": "on"

            });

            // The down arrow container element of the dropdown list
            self.downArrowContainer = $("<span/>", {

                // Dynamically sets the dropdown `id` attribute for the down arrow container element
                "id": originalElemId && originalElemId + "SelectBoxItArrowContainer",

                "class": "selectboxit-arrow-container",

                // IE specific attribute to not allow the dropdown list text to be selected
                "unselectable": "on"

            }).

            // Inserts the down arrow element inside of the down arrow container element
            append(self.downArrow);

            // Appends the down arrow element to the dropdown list
            self.dropdown.append(self.downArrowContainer);

            // Adds the `selectboxit-selected` class name to the currently selected drop down option
            self.listItems.removeClass("selectboxit-selected").eq(self.currentFocus).addClass("selectboxit-selected");

            // The full outer width of the down arrow container
            downArrowContainerWidth = self.downArrowContainer.outerWidth(true);

            // The full outer width of the dropdown image
            dropdownImageWidth = self.dropdownImage.outerWidth(true);

            // If the `autoWidth` option is true
            if(self.options["autoWidth"]) {

                // Sets the auto width of the drop down
                self.dropdown.css({ "width": "auto" }).css({

                    "width": self.list.outerWidth(true) + downArrowContainerWidth + dropdownImageWidth

                });

                self.list.css({

                    "min-width": self.dropdown.width()

                });

            }

            // Dynamically adds the `max-width` and `line-height` CSS styles of the dropdown list text element
            self.dropdownText.css({

                "max-width": self.dropdownContainer.outerWidth(true) - (downArrowContainerWidth + dropdownImageWidth)

            });

            // Adds the new dropdown list to the page directly after the hidden original select box element
            self.selectBox.after(self.dropdownContainer);

            self.dropdownContainer.removeClass('selectboxit-rendering');

            if($.type(listSize) === "number") {

                // Stores the new `max-height` for later
                self.maxHeight = self.listAnchors.outerHeight(true) * listSize;

            }

            // Maintains chainability
            return self;

        },

        // _Scroll-To-View
        // ---------------
        //      Updates the dropdown list scrollTop value
        _scrollToView: function(type) {

            var self = this,

                currentOption = self.listItems.eq(self.currentFocus),

                // The current scroll positioning of the dropdown list options list
                listScrollTop = self.list.scrollTop(),

                // The height of the currently selected dropdown list option
                currentItemHeight = currentOption.height(),

                // The relative distance from the currently selected dropdown list option to the the top of the dropdown list options list
                currentTopPosition = currentOption.position().top,

                absCurrentTopPosition = Math.abs(currentTopPosition),

                // The height of the dropdown list option list
                listHeight = self.list.height(),

                currentText;

            // Scrolling logic for a text search
            if (type === "search") {

                // Increases the dropdown list options `scrollTop` if a user is searching for an option
                // below the currently selected option that is not visible
                if (listHeight - currentTopPosition < currentItemHeight) {

                    // The selected option will be shown at the very bottom of the visible options list
                    self.list.scrollTop(listScrollTop + (currentTopPosition - (listHeight - currentItemHeight)));

                }

                // Decreases the dropdown list options `scrollTop` if a user is searching for an option above the currently selected option that is not visible
                else if (currentTopPosition < -1) {

                    self.list.scrollTop(currentTopPosition - currentItemHeight);

                }
            }

            // Scrolling logic for the `up` keyboard navigation
            else if (type === "up") {

                // Decreases the dropdown list option list `scrollTop` if a user is navigating to an element that is not visible
                if (currentTopPosition < -1) {

                    self.list.scrollTop(listScrollTop - absCurrentTopPosition);

                }
            }

            // Scrolling logic for the `down` keyboard navigation
            else if (type === "down") {

                // Increases the dropdown list options `scrollTop` if a user is navigating to an element that is not fully visible
                if (listHeight - currentTopPosition < currentItemHeight) {

                    // Increases the dropdown list options `scrollTop` by the height of the current option item.
                    self.list.scrollTop((listScrollTop + (absCurrentTopPosition - listHeight + currentItemHeight)));

                }
            }

            // Maintains chainability
            return self;

        },

        // _Callback
        // ---------
        //      Call the function passed into the method
        _callbackSupport: function(callback) {

            var self = this;

            // Checks to make sure the parameter passed in is a function
            if ($.isFunction(callback)) {

                // Calls the method passed in as a parameter and sets the current `SelectBoxIt` object that is stored in the jQuery data method as the context(allows for `this` to reference the SelectBoxIt API Methods in the callback function. The `dropdown` DOM element that acts as the new dropdown list is also passed as the only parameter to the callback
                callback.call(self, self.dropdown);

            }

            // Maintains chainability
            return self;

        },

        // _setText
        // --------
        //      Set's the text or html for the drop down
        _setText: function(elem, currentText) {

            var self = this;

            if(self.options["html"]) {

                elem.html(currentText);

            }

            else {

                elem.text(currentText);

            }

            return self;

        },

        // Open
        // ----
        //      Opens the dropdown list options list
        open: function(callback) {

            var self = this,
                showEffect = self.options["showEffect"],
                showEffectSpeed = self.options["showEffectSpeed"],
                showEffectOptions = self.options["showEffectOptions"],
                isNative = self.options["native"],
                isMobile = self.isMobile;

            // If there are no select box options, do not try to open the select box
            if(!self.listItems.length || self.dropdown.hasClass(self.theme["disabled"])) {

                return self;

            }

            // If the new drop down is being used and is not visible
            if((!isNative && !isMobile) && !this.list.is(":visible")) {

                // Triggers a custom "open" event on the original select box
                self.triggerEvent("open");

                if (self._dynamicPositioning && self.options["dynamicPositioning"]) {

                    // Dynamically positions the dropdown list options list
                    self._dynamicPositioning();

                }

                // Uses `no effect`
                if(showEffect === "none") {

                    // Does not require a callback function because this animation will complete before the call to `scrollToView`
                    self.list.show();

                }

                // Uses the jQuery `show` special effect
                else if(showEffect === "show" || showEffect === "slideDown" || showEffect === "fadeIn") {

                    // Requires a callback function to determine when the `show` animation is complete
                    self.list[showEffect](showEffectSpeed);

                }

                // If none of the above options were passed, then a `jqueryUI show effect` is expected
                else {

                    // Allows for custom show effects via the [jQueryUI core effects](http://http://jqueryui.com/demos/show/)
                    self.list.show(showEffect, showEffectOptions, showEffectSpeed);

                }

                self.list.promise().done(function() {

                    // Updates the list `scrollTop` attribute
                    self._scrollToView("search");

                    // Triggers a custom "opened" event when the drop down list is done animating
                    self.triggerEvent("opened");

                });

            }

            // Provide callback function support
            self._callbackSupport(callback);

            // Maintains chainability
            return self;

        },

        // Close
        // -----
        //      Closes the dropdown list options list
        close: function(callback) {

            var self = this,
                hideEffect = self.options["hideEffect"],
                hideEffectSpeed = self.options["hideEffectSpeed"],
                hideEffectOptions = self.options["hideEffectOptions"],
                isNative = self.options["native"],
                isMobile = self.isMobile;

            // If the drop down is being used and is visible
            if((!isNative && !isMobile) && self.list.is(":visible")) {

                // Triggers a custom "close" event on the original select box
                self.triggerEvent("close");

                // Uses `no effect`
                if(hideEffect === "none") {

                    // Does not require a callback function because this animation will complete before the call to `scrollToView`
                    self.list.hide();

                }

                // Uses the jQuery `hide` special effect
                else if(hideEffect === "hide" || hideEffect === "slideUp" || hideEffect === "fadeOut") {

                    self.list[hideEffect](hideEffectSpeed);

                }

                // If none of the above options were passed, then a `jqueryUI hide effect` is expected
                else {

                    // Allows for custom hide effects via the [jQueryUI core effects](http://http://jqueryui.com/demos/hide/)
                    self.list.hide(hideEffect, hideEffectOptions, hideEffectSpeed);

                }

                // After the drop down list is done animating
                self.list.promise().done(function() {

                    // Triggers a custom "closed" event when the drop down list is done animating
                    self.triggerEvent("closed");

                });

            }

            // Provide callback function support
            self._callbackSupport(callback);

            // Maintains chainability
            return self;

        },

        toggle: function() {

            var self = this,
                listIsVisible = self.list.is(":visible");

            if(listIsVisible) {

                self.close();

            }

            else if(!listIsVisible) {

                self.open();

            }

        },

        // _Key Mappings
        // -------------
        //      Object literal holding the string representation of each key code
        _keyMappings: {

            "38": "up",

            "40": "down",

            "13": "enter",

            "8": "backspace",

            "9": "tab",

            "32": "space",

            "27": "esc"

        },

        // _Key Down Methods
        // -----------------
        //      Methods to use when the keydown event is triggered
        _keydownMethods: function() {

            var self = this,
                moveToOption = self.list.is(":visible") || !self.options["keydownOpen"];

            return {

                "down": function() {

                    // If the plugin options allow keyboard navigation
                    if (self.moveDown && moveToOption) {

                        self.moveDown();

                    }

                },

                "up": function() {

                     // If the plugin options allow keyboard navigation
                    if (self.moveUp && moveToOption) {

                        self.moveUp();

                    }

                },

                "enter": function() {

                    var activeElem = self.listItems.eq(self.currentFocus);

                    // Updates the dropdown list value
                    self._update(activeElem);

                    if (activeElem.attr("data-preventclose") !== "true") {

                        // Closes the drop down list options list
                        self.close();

                    }

                    // Triggers the `enter` events on the original select box
                    self.triggerEvent("enter");

                },

                "tab": function() {

                    // Triggers the custom `tab-blur` event on the original select box
                    self.triggerEvent("tab-blur");

                    // Closes the drop down list
                    self.close();

                },

                "backspace": function() {

                    // Triggers the custom `backspace` event on the original select box
                    self.triggerEvent("backspace");

                },

                "esc": function() {

                    // Closes the dropdown options list
                    self.close();

                }

            };

        },


        // _Event Handlers
        // ---------------
        //      Adds event handlers to the new dropdown and the original select box
        _eventHandlers: function() {

            // LOCAL VARIABLES
            var self = this,
                nativeMousedown = self.options["nativeMousedown"],
                customShowHideEvent = self.options["customShowHideEvent"],
                currentDataText,
                currentText,
                focusClass = self.focusClass,
                hoverClass = self.hoverClass,
                openClass = self.openClass;

            // Select Box events
            this.dropdown.on({

                // `click` event with the `selectBoxIt` namespace
                "click.selectBoxIt": function() {

                    // Used to make sure the dropdown becomes focused (fixes IE issue)
                    self.dropdown.trigger("focus", true);

                    // The `click` handler logic will only be applied if the dropdown list is enabled
                    if (!self.originalElem.disabled) {

                        // Triggers the `click` event on the original select box
                        self.triggerEvent("click");

                        if(!nativeMousedown && !customShowHideEvent) {

                            self.toggle();

                        }

                    }

                },

                // `mousedown` event with the `selectBoxIt` namespace
                "mousedown.selectBoxIt": function() {

                    // Stores data in the jQuery `data` method to help determine if the dropdown list gains focus from a click or tabstop.  The mousedown event fires before the focus event.
                    $(this).data("mdown", true);

                    self.triggerEvent("mousedown");

                    if(nativeMousedown && !customShowHideEvent) {

                        self.toggle();

                    }

                },

                // `mouseup` event with the `selectBoxIt` namespace
                "mouseup.selectBoxIt": function() {

                    self.triggerEvent("mouseup");

                },

                // `blur` event with the `selectBoxIt` namespace.  Uses special blur logic to make sure the dropdown list closes correctly
                "blur.selectBoxIt": function() {

                    // If `self.blur` property is true
                    if (self.blur) {

                        // Triggers both the `blur` and `focusout` events on the original select box.
                        // The `focusout` event is also triggered because the event bubbles
                        // This event has to be used when using event delegation (such as the jQuery `delegate` or `on` methods)
                        // Popular open source projects such as Backbone.js utilize event delegation to bind events, so if you are using Backbone.js, use the `focusout` event instead of the `blur` event
                        self.triggerEvent("blur");

                        // Closes the dropdown list options list
                        self.close();

                        $(this).removeClass(focusClass);

                    }

                },

                "focus.selectBoxIt": function(event, internal) {

                    // Stores the data associated with the mousedown event inside of a local variable
                    var mdown = $(this).data("mdown");

                    // Removes the jQuery data associated with the mousedown event
                    $(this).removeData("mdown");

                    // If a mousedown event did not occur and no data was passed to the focus event (this correctly triggers the focus event), then the dropdown list gained focus from a tabstop
                    if (!mdown && !internal) {

                        setTimeout(function() {

                            // Triggers the `tabFocus` custom event on the original select box
                            self.triggerEvent("tab-focus");

                        }, 0);

                    }

                    // Only trigger the `focus` event on the original select box if the dropdown list is hidden (this verifies that only the correct `focus` events are used to trigger the event on the original select box
                    if(!internal) {

                        if(!$(this).hasClass(self.theme["disabled"])) {

                            $(this).addClass(focusClass);

                        }

                        //Triggers the `focus` default event on the original select box
                        self.triggerEvent("focus");

                    }

                },

                // `keydown` event with the `selectBoxIt` namespace.  Catches all user keyboard navigations
                "keydown.selectBoxIt": function(e) {

                    // Stores the `keycode` value in a local variable
                    var currentKey = self._keyMappings[e.keyCode],

                        keydownMethod = self._keydownMethods()[currentKey];

                    if(keydownMethod) {

                        keydownMethod();

                        if(self.options["keydownOpen"] && (currentKey === "up" || currentKey === "down")) {

                            self.open();

                        }

                    }

                    if(keydownMethod && currentKey !== "tab") {

                        e.preventDefault();

                    }

                },

                // `keypress` event with the `selectBoxIt` namespace.  Catches all user keyboard text searches since you can only reliably get character codes using the `keypress` event
                "keypress.selectBoxIt": function(e) {

                    // Sets the current key to the `keyCode` value if `charCode` does not exist.  Used for cross
                    // browser support since IE uses `keyCode` instead of `charCode`.
                    var currentKey = e.charCode || e.keyCode,

                        key = self._keyMappings[e.charCode || e.keyCode],

                        // Converts unicode values to characters
                        alphaNumericKey = String.fromCharCode(currentKey);

                    // If the plugin options allow text searches
                    if (self.search && (!key || (key && key === "space"))) {

                        // Calls `search` and passes the character value of the user's text search
                        self.search(alphaNumericKey, true, true);

                    }

                    if(key === "space") {

                        e.preventDefault();

                    }

                },

                // `mousenter` event with the `selectBoxIt` namespace .The mouseenter JavaScript event is proprietary to Internet Explorer. Because of the event's general utility, jQuery simulates this event so that it can be used regardless of browser.
                "mouseenter.selectBoxIt": function() {

                    // Trigger the `mouseenter` event on the original select box
                    self.triggerEvent("mouseenter");

                },

                // `mouseleave` event with the `selectBoxIt` namespace. The mouseleave JavaScript event is proprietary to Internet Explorer. Because of the event's general utility, jQuery simulates this event so that it can be used regardless of browser.
                "mouseleave.selectBoxIt": function() {

                    // Trigger the `mouseleave` event on the original select box
                    self.triggerEvent("mouseleave");

                }

            });

            // Select box options events that set the dropdown list blur logic (decides when the dropdown list gets
            // closed)
            self.list.on({

                // `mouseover` event with the `selectBoxIt` namespace
                "mouseover.selectBoxIt": function() {

                    // Prevents the dropdown list options list from closing
                    self.blur = false;

                },

                // `mouseout` event with the `selectBoxIt` namespace
                "mouseout.selectBoxIt": function() {

                    // Allows the dropdown list options list to close
                    self.blur = true;

                },

                // `focusin` event with the `selectBoxIt` namespace
                "focusin.selectBoxIt": function() {

                    // Prevents the default browser outline border to flicker, which results because of the `blur` event
                    self.dropdown.trigger("focus", true);

                }

            });

            // Select box individual options events bound with the jQuery `delegate` method.  `Delegate` was used because binding indropdownidual events to each list item (since we don't know how many there will be) would decrease performance.  Instead, we bind each event to the unordered list, provide the list item context, and allow the list item events to bubble up (`event bubbling`). This greatly increases page performance because we only have to bind an event to one element instead of x number of elements. Delegates the `click` event with the `selectBoxIt` namespace to the list items
            self.list.on({

                "mousedown.selectBoxIt": function() {

                    self._update($(this));

                    self.triggerEvent("option-click");

                    // If the current drop down option is not disabled
                    if ($(this).attr("data-disabled") === "false" && $(this).attr("data-preventclose") !== "true") {

                        // Closes the drop down list
                        self.close();

                    }

                    setTimeout(function() {

                        self.dropdown.trigger('focus', true);

                    }, 0);

                },

               // Delegates the `focusin` event with the `selectBoxIt` namespace to the list items
               "focusin.selectBoxIt": function() {

                    // Removes the hover class from the previous drop down option
                    self.listItems.not($(this)).removeAttr("data-active");

                    $(this).attr("data-active", "");

                    var listIsHidden = self.list.is(":hidden");

                    if((self.options["searchWhenHidden"] && listIsHidden) || self.options["aggressiveChange"] || (listIsHidden && self.options["selectWhenHidden"])) {

                        self._update($(this));

                    }

                    // Adds the focus CSS class to the currently focused dropdown list option
                   $(this).addClass(focusClass);

                },

                // Delegates the `focus` event with the `selectBoxIt` namespace to the list items
                "mouseup.selectBoxIt": function() {

                    if(nativeMousedown && !customShowHideEvent) {

                        self._update($(this));

                        self.triggerEvent("option-mouseup");

                        // If the current drop down option is not disabled
                        if ($(this).attr("data-disabled") === "false" && $(this).attr("data-preventclose") !== "true") {

                            // Closes the drop down list
                            self.close();

                        }

                    }

                },

                // Delegates the `mouseenter` event with the `selectBoxIt` namespace to the list items
                "mouseenter.selectBoxIt": function() {

                    // If the currently moused over drop down option is not disabled
                    if($(this).attr("data-disabled") === "false") {

                        self.listItems.removeAttr("data-active");

                        $(this).addClass(focusClass).attr("data-active", "");

                        // Sets the dropdown list indropdownidual options back to the default state and sets the focus CSS class on the currently hovered option
                        self.listItems.not($(this)).removeClass(focusClass);

                        $(this).addClass(focusClass);

                        self.currentFocus = +$(this).attr("data-id");

                    }

                },

                // Delegates the `mouseleave` event with the `selectBoxIt` namespace to the list items
                "mouseleave.selectBoxIt": function() {

                    // If the currently moused over drop down option is not disabled
                    if($(this).attr("data-disabled") === "false") {

                        // Removes the focus class from the previous drop down option
                        self.listItems.not($(this)).removeClass(focusClass).removeAttr("data-active");

                        $(this).addClass(focusClass);

                        self.currentFocus = +$(this).attr("data-id");

                    }

                },

                // Delegates the `blur` event with the `selectBoxIt` namespace to the list items
                "blur.selectBoxIt": function() {

                    // Removes the focus CSS class from the previously focused dropdown list option
                    $(this).removeClass(focusClass);

                }

            }, ".selectboxit-option");

            // Select box individual option anchor events bound with the jQuery `delegate` method.  `Delegate` was used because binding indropdownidual events to each list item (since we don't know how many there will be) would decrease performance.  Instead, we bind each event to the unordered list, provide the list item context, and allow the list item events to bubble up (`event bubbling`). This greatly increases page performance because we only have to bind an event to one element instead of x number of elements. Delegates the `click` event with the `selectBoxIt` namespace to the list items
            self.list.on({

                "click.selectBoxIt": function(ev) {

                    // Prevents the internal anchor tag from doing anything funny
                    ev.preventDefault();

                }

            }, "a");

            // Original dropdown list events
            self.selectBox.on({

                // `change` event handler with the `selectBoxIt` namespace
                "change.selectBoxIt, internal-change.selectBoxIt": function(event, internal) {

                    var currentOption,
                        currentDataSelectedText;

                    // If the user called the change method
                    if(!internal) {

                        currentOption = self.list.find('li[data-val="' + self.originalElem.value + '"]');

                        // If there is a dropdown option with the same value as the original select box element
                        if(currentOption.length) {

                            self.listItems.eq(self.currentFocus).removeClass(self.focusClass);

                            self.currentFocus = +currentOption.attr("data-id");

                        }

                    }

                    currentOption = self.listItems.eq(self.currentFocus);

                    currentDataSelectedText = currentOption.attr("data-selectedtext");

                    currentDataText = currentOption.attr("data-text");

                    currentText = currentDataText ?  currentDataText: currentOption.find("a").text();

                    // Sets the new dropdown list text to the value of the current option
                    self._setText(self.dropdownText, currentDataSelectedText || currentText);

                    self.dropdownText.attr("data-val", self.originalElem.value);

                    if(currentOption.find("i").attr("class")) {

                        self.dropdownImage.attr("class", currentOption.find("i").attr("class")).addClass("selectboxit-default-icon");

                        self.dropdownImage.attr("style", currentOption.find("i").attr("style"));
                    }

                    // Triggers a custom changed event on the original select box
                    self.triggerEvent("changed");

                },

                // `disable` event with the `selectBoxIt` namespace
                "disable.selectBoxIt": function() {

                    // Adds the `disabled` CSS class to the new dropdown list to visually show that it is disabled
                    self.dropdown.addClass(self.theme["disabled"]);

                },

                // `enable` event with the `selectBoxIt` namespace
                "enable.selectBoxIt": function() {

                    // Removes the `disabled` CSS class from the new dropdown list to visually show that it is enabled
                    self.dropdown.removeClass(self.theme["disabled"]);

                },

                // `open` event with the `selectBoxIt` namespace
                "open.selectBoxIt": function() {

                    var currentElem = self.list.find("li[data-val='" + self.dropdownText.attr("data-val") + "']"),
                        activeElem;

                    // If no current element can be found, then select the first drop down option
                    if(!currentElem.length) {

                        // Sets the default value of the dropdown list to the first option that is not disabled
                        currentElem = self.listItems.not("[data-disabled=true]").first();

                    }

                    self.currentFocus = +currentElem.attr("data-id");

                    activeElem = self.listItems.eq(self.currentFocus);

                    self.dropdown.addClass(openClass).

                    // Removes the focus class from the dropdown list and adds the library focus class for both the dropdown list and the currently selected dropdown list option
                    removeClass(hoverClass).addClass(focusClass);

                    self.listItems.removeClass(self.selectedClass).

                    removeAttr("data-active").not(activeElem).removeClass(focusClass);

                    activeElem.addClass(self.selectedClass).addClass(focusClass);

                    if(self.options.hideCurrent) {

                        self.listItems.show();

                        activeElem.hide();

                    }

                },

                "close.selectBoxIt": function() {

                    // Removes the open class from the dropdown container
                    self.dropdown.removeClass(openClass);

                },

                "blur.selectBoxIt": function() {

                    self.dropdown.removeClass(focusClass);

                },

                // `mousenter` event with the `selectBoxIt` namespace
                "mouseenter.selectBoxIt": function() {

                    if(!$(this).hasClass(self.theme["disabled"])) {
                        self.dropdown.addClass(hoverClass);
                    }

                },

                // `mouseleave` event with the `selectBoxIt` namespace
                "mouseleave.selectBoxIt": function() {

                    // Removes the hover CSS class on the previously hovered dropdown list option
                    self.dropdown.removeClass(hoverClass);

                },

                // `destroy` event
                "destroy": function(ev) {

                    // Prevents the default action from happening
                    ev.preventDefault();

                    // Prevents the destroy event from propagating
                    ev.stopPropagation();

                }

            });

            // Maintains chainability
            return self;

        },

        // _update
        // -------
        //      Updates the drop down and select box with the current value
        _update: function(elem) {

            var self = this,
                currentDataSelectedText,
                currentDataText,
                currentText,
                defaultText = self.options["defaultText"] || self.selectBox.attr("data-text"),
                currentElem = self.listItems.eq(self.currentFocus);

            if (elem.attr("data-disabled") === "false") {

                currentDataSelectedText = self.listItems.eq(self.currentFocus).attr("data-selectedtext");

                currentDataText = currentElem.attr("data-text");

                currentText = currentDataText ? currentDataText: currentElem.text();

                // If the default text option is set and the current drop down option is not disabled
                if ((defaultText && self.options["html"] ? self.dropdownText.html() === defaultText: self.dropdownText.text() === defaultText) && self.selectBox.val() === elem.attr("data-val")) {

                    self.triggerEvent("change");

                }

                else {

                    // Sets the original dropdown list value and triggers the `change` event on the original select box
                    self.selectBox.val(elem.attr("data-val"));

                    // Sets `currentFocus` to the currently focused dropdown list option.
                    // The unary `+` operator casts the string to a number
                    // [James Padolsey Blog Post](http://james.padolsey.com/javascript/terse-javascript-101-part-2/)
                    self.currentFocus = +elem.attr("data-id");

                    // Triggers the dropdown list `change` event if a value change occurs
                    if (self.originalElem.value !== self.dropdownText.attr("data-val")) {

                        self.triggerEvent("change");

                    }

                }

            }

        },

        // _addClasses
        // -----------
        //      Adds SelectBoxIt CSS classes
        _addClasses: function(obj) {

            var self = this,

                focusClass = self.focusClass = obj.focus,

                hoverClass = self.hoverClass = obj.hover,

                buttonClass = obj.button,

                listClass = obj.list,

                arrowClass = obj.arrow,

                containerClass = obj.container,

                openClass = self.openClass = obj.open;

            self.selectedClass = "selectboxit-selected";

            self.downArrow.addClass(self.selectBox.attr("data-downarrow") || self.options["downArrowIcon"] || arrowClass);

            // Adds the correct container class to the dropdown list
            self.dropdownContainer.addClass(containerClass);

            // Adds the correct class to the dropdown list
            self.dropdown.addClass(buttonClass);

            // Adds the default class to the dropdown list options
            self.list.addClass(listClass);

            // Maintains chainability
            return self;

        },

        // Refresh
        // -------
        //    The dropdown will rebuild itself.  Useful for dynamic content.
        refresh: function(callback, internal) {

            var self = this;

            // Destroys the plugin and then recreates the plugin
            self._destroySelectBoxIt()._create(true);

            if(!internal) {
                self.triggerEvent("refresh");
            }

            self._callbackSupport(callback);

            //Maintains chainability
            return self;

        },

        // HTML Escape
        // -----------
        //      HTML encodes a string
        htmlEscape: function(str) {

            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

        },

        // triggerEvent
        // ------------
        //      Trigger's an external event on the original select box element
        triggerEvent: function(eventName) {

            var self = this,
                // Finds the currently option index
                currentIndex = self.options["showFirstOption"] ? self.currentFocus : ((self.currentFocus - 1) >= 0 ? self.currentFocus: 0);

            // Triggers the custom option-click event on the original select box and passes the select box option
            self.selectBox.trigger(eventName, { "selectbox": self.selectBox, "selectboxOption": self.selectItems.eq(currentIndex), "dropdown": self.dropdown, "dropdownOption": self.listItems.eq(self.currentFocus) });

            // Maintains chainability
            return self;

        },

        // _copyAttributes
        // ---------------
        //      Copies HTML attributes from the original select box to the new drop down
        _copyAttributes: function() {

            var self = this;

            if(self._addSelectBoxAttributes) {

                self._addSelectBoxAttributes();

            }

            return self;

        },

        // _realOuterWidth
        // ---------------
        //      Retrieves the true outerWidth dimensions of a hidden DOM element
        _realOuterWidth: function(elem) {

            if(elem.is(":visible")) {

                return elem.outerWidth(true);

            }

            var self = this,
                clonedElem = elem.clone(),
                outerWidth;

            clonedElem.css({

                "visibility": "hidden",

                "display": "block",

                "position": "absolute"

            }).appendTo("body");

            outerWidth = clonedElem.outerWidth(true);

            clonedElem.remove();

            return outerWidth;
        }

    });

    // Stores the plugin prototype object in a local variable
    var selectBoxIt = $.selectBox.selectBoxIt.prototype;

    // Add Options Module
    // ==================

    // add
    // ---
    //    Adds drop down options
    //    using JSON data, an array,
    //    a single object, or valid HTML string

    selectBoxIt.add = function(data, callback) {

        this._populate(data, function(data) {

            var self = this,
                dataType = $.type(data),
                value,
                x = 0,
                dataLength,
                elems = [],
                isJSON = self._isJSON(data),
                parsedJSON = isJSON && self._parseJSON(data);

            // If the passed data is a local or JSON array
            if(data && (dataType === "array" || (isJSON && parsedJSON.data && $.type(parsedJSON.data) === "array")) || (dataType === "object" && data.data && $.type(data.data) === "array")) {

                // If the data is JSON
                if(self._isJSON(data)) {

                    // Parses the JSON and stores it in the data local variable
                    data = parsedJSON;

                }

                // If there is an inner `data` property stored in the first level of the JSON array
                if(data.data) {

                    // Set's the data to the inner `data` property
                    data = data.data;

                }

                // Loops through the array
                for(dataLength = data.length; x <= dataLength - 1; x += 1) {

                    // Stores the currently traversed array item in the local `value` variable
                    value = data[x];

                    // If the currently traversed array item is an object literal
                    if($.isPlainObject(value)) {

                        // Adds an option to the elems array
                        elems.push($("<option/>", value));

                    }

                    // If the currently traversed array item is a string
                    else if($.type(value) === "string") {

                        // Adds an option to the elems array
                        elems.push($("<option/>", { text: value, value: value }));

                    }

                }

                // Appends all options to the drop down (with the correct object configurations)
                self.selectBox.append(elems);

            }

            // if the passed data is an html string and not a JSON string
            else if(data && dataType === "string" && !self._isJSON(data)) {

                // Appends the html string options to the original select box
                self.selectBox.append(data);

            }

            else if(data && dataType === "object") {

                // Appends an option to the original select box (with the object configurations)
                self.selectBox.append($("<option/>", data));

            }

            else if(data && self._isJSON(data) && $.isPlainObject(self._parseJSON(data))) {

                // Appends an option to the original select box (with the object configurations)
                self.selectBox.append($("<option/>", self._parseJSON(data)));

            }

            // If the dropdown property exists
            if(self.dropdown) {

                // Rebuilds the dropdown
                self.refresh(function() {

                    // Provide callback function support
                    self._callbackSupport(callback);

                }, true);

            } else {

                // Provide callback function support
                self._callbackSupport(callback);

            }

            // Maintains chainability
            return self;

        });

    };

    // parseJSON
    // ---------
    //      Detects JSON support and parses JSON data
    selectBoxIt._parseJSON = function(data) {

        return (JSON && JSON.parse && JSON.parse(data)) || $.parseJSON(data);

    };

    // isjSON
    // ------
    //    Determines if a string is valid JSON

    selectBoxIt._isJSON = function(data) {

        var self = this,
            json;

        try {

            json = self._parseJSON(data);

            // Valid JSON
            return true;

        } catch (e) {

            // Invalid JSON
            return false;

        }

    };

    // _populate
    // --------
    //    Handles asynchronous and synchronous data
    //    to populate the select box

    selectBoxIt._populate = function(data, callback) {

        var self = this;

        data = $.isFunction(data) ? data.call() : data;

        if(self.isDeferred(data)) {

            data.done(function(returnedData) {

                callback.call(self, returnedData);

            });

        }

        else {

            callback.call(self, data);

        }

        // Maintains chainability
        return self;

    };

    // Accessibility Module
    // ====================

    // _ARIA Accessibility
    // ------------------
    //      Adds ARIA (Accessible Rich Internet Applications)
    //      Accessibility Tags to the Select Box

    selectBoxIt._ariaAccessibility = function() {

        var self = this,
            dropdownLabel = $("label[for='" + self.originalElem.id + "']");

        // Adds `ARIA attributes` to the dropdown list
        self.dropdownContainer.attr({

            // W3C `combobox` description: A presentation of a select; usually similar to a textbox where users can type ahead to select an option.
            "role": "combobox",

            //W3C `aria-autocomplete` description: Indicates whether user input completion suggestions are provided.
            "aria-autocomplete": "list",

            "aria-haspopup": "true",

            // W3C `aria-expanded` description: Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.
            "aria-expanded": "false",

            // W3C `aria-owns` description: The value of the aria-owns attribute is a space-separated list of IDREFS that reference one or more elements in the document by ID. The reason for adding aria-owns is to expose a parent/child contextual relationship to assistive technologies that is otherwise impossible to infer from the DOM.
            "aria-owns": self.list[0].id

        });

        self.dropdownText.attr({

            "aria-live": "polite"

        });

        // Dynamically adds `ARIA attributes` if the new dropdown list is enabled or disabled
        self.dropdown.on({

            //Select box custom `disable` event with the `selectBoxIt` namespace
            "disable.selectBoxIt" : function() {

                // W3C `aria-disabled` description: Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
                self.dropdownContainer.attr("aria-disabled", "true");

            },

            // Select box custom `enable` event with the `selectBoxIt` namespace
            "enable.selectBoxIt" : function() {

                // W3C `aria-disabled` description: Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
                self.dropdownContainer.attr("aria-disabled", "false");

            }

        });

        if(dropdownLabel.length) {

            // MDN `aria-labelledby` description:  Indicates the IDs of the elements that are the labels for the object.
            self.dropdownContainer.attr("aria-labelledby", dropdownLabel[0].id);

        }

        // Adds ARIA attributes to the dropdown list options list
        self.list.attr({

            // W3C `listbox` description: A widget that allows the user to select one or more items from a list of choices.
            "role": "listbox",

            // Indicates that the dropdown list options list is currently hidden
            "aria-hidden": "true"

        });

        // Adds `ARIA attributes` to the dropdown list options
        self.listItems.attr({

            // This must be set for each element when the container element role is set to `listbox`
            "role": "option"

        });

        // Dynamically updates the new dropdown list `aria-label` attribute after the original dropdown list value changes
        self.selectBox.on({

            // Custom `open` event with the `selectBoxIt` namespace
            "open.selectBoxIt": function() {

                // Indicates that the dropdown list options list is currently visible
                self.list.attr("aria-hidden", "false");

                // Indicates that the dropdown list is currently expanded
                self.dropdownContainer.attr("aria-expanded", "true");

            },

            // Custom `close` event with the `selectBoxIt` namespace
            "close.selectBoxIt": function() {

                // Indicates that the dropdown list options list is currently hidden
                self.list.attr("aria-hidden", "true");

                // Indicates that the dropdown list is currently collapsed
                self.dropdownContainer.attr("aria-expanded", "false");

            }

        });

        // Maintains chainability
        return self;

    };

    // Copy Attributes Module
    // ======================

    // addSelectBoxAttributes
    // ----------------------
    //      Add's all attributes (excluding id, class names, and the style attribute) from the default select box to the new drop down

    selectBoxIt._addSelectBoxAttributes = function() {

        // Stores the plugin context inside of the self variable
        var self = this;

        // Add's all attributes to the currently traversed drop down option
        self._addAttributes(self.selectBox.prop("attributes"), self.dropdown);

        // Add's all attributes to the drop down items list
        self.selectItems.each(function(iterator) {

            // Add's all attributes to the currently traversed drop down option
            self._addAttributes($(this).prop("attributes"), self.listItems.eq(iterator));

        });

        // Maintains chainability
        return self;

    };

    // addAttributes
    // -------------
    //  Add's attributes to a DOM element
    selectBoxIt._addAttributes = function(arr, elem) {

        // Stores the plugin context inside of the self variable
        var self = this,
            whitelist = self.options["copyAttributes"];

        // If there are array properties
        if(arr.length) {

            // Iterates over all of array properties
            $.each(arr, function(iterator, property) {

                // Get's the property name and property value of each property
                var propName = (property.name).toLowerCase(), propValue = property.value;

                // If the currently traversed property value is not "null", is on the whitelist, or is an HTML 5 data attribute
                if(propValue !== "null" && ($.inArray(propName, whitelist) !== -1 || propName.indexOf("data") !== -1)) {

                    // Set's the currently traversed property on element
                    elem.attr(propName, propValue);

                }

            });

        }

        // Maintains chainability
        return self;

    };
// Destroy Module
// ==============

// Destroy
// -------
//    Removes the plugin from the page

selectBoxIt.destroy = function(callback) {

    // Stores the plugin context inside of the self variable
    var self = this;

    self._destroySelectBoxIt();

    // Calls the jQueryUI Widget Factory destroy method
    self.widgetProto.destroy.call(self);

    // Provides callback function support
    self._callbackSupport(callback);

    // Maintains chainability
    return self;

};

// Internal Destroy Method
// -----------------------
//    Removes the plugin from the page

selectBoxIt._destroySelectBoxIt = function() {

    // Stores the plugin context inside of the self variable
    var self = this;

    // Unbinds all of the dropdown list event handlers with the `selectBoxIt` namespace
    self.dropdown.off(".selectBoxIt");

    // If the original select box has been placed inside of the new drop down container
    if ($.contains(self.dropdownContainer[0], self.originalElem)) {

        // Moves the original select box before the drop down container
        self.dropdownContainer.before(self.selectBox);

    }

    // Remove all of the `selectBoxIt` DOM elements from the page
    self.dropdownContainer.remove();

    // Resets the style attributes for the original select box
    self.selectBox.removeAttr("style").attr("style", self.selectBoxStyles);

    // Triggers the custom `destroy` event on the original select box
    self.triggerEvent("destroy");

    // Maintains chainability
    return self;

};

    // Disable Module
    // ==============

    // Disable
    // -------
    //      Disables the new dropdown list

    selectBoxIt.disable = function(callback) {

        var self = this;

        if(!self.options["disabled"]) {

            // Makes sure the dropdown list is closed
            self.close();

            // Sets the `disabled` attribute on the original select box
            self.selectBox.attr("disabled", "disabled");

            // Makes the dropdown list not focusable by removing the `tabindex` attribute
            self.dropdown.removeAttr("tabindex").

            // Disables styling for enabled state
            removeClass(self.theme["enabled"]).

            // Enabled styling for disabled state
            addClass(self.theme["disabled"]);

            self.setOption("disabled", true);

            // Triggers a `disable` custom event on the original select box
            self.triggerEvent("disable");

        }

        // Provides callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Disable Option
    // --------------
    //      Disables a single drop down option

    selectBoxIt.disableOption = function(index, callback) {

        var self = this, currentSelectBoxOption, hasNextEnabled, hasPreviousEnabled, type = $.type(index);

        // If an index is passed to target an indropdownidual drop down option
        if(type === "number") {

            // Makes sure the dropdown list is closed
            self.close();

            // The select box option being targeted
            currentSelectBoxOption = self.selectBox.find("option").eq(index);

            // Triggers a `disable-option` custom event on the original select box and passes the disabled option
            self.triggerEvent("disable-option");

            // Disables the targeted select box option
            currentSelectBoxOption.attr("disabled", "disabled");

            // Disables the drop down option
            self.listItems.eq(index).attr("data-disabled", "true").

            // Applies disabled styling for the drop down option
            addClass(self.theme["disabled"]);

            // If the currently selected drop down option is the item being disabled
            if(self.currentFocus === index) {

                hasNextEnabled = self.listItems.eq(self.currentFocus).nextAll("li").not("[data-disabled='true']").first().length;

                hasPreviousEnabled = self.listItems.eq(self.currentFocus).prevAll("li").not("[data-disabled='true']").first().length;

                // If there is a currently enabled option beneath the currently selected option
                if(hasNextEnabled) {

                    // Selects the option beneath the currently selected option
                    self.moveDown();

                }

                // If there is a currently enabled option above the currently selected option
                else if(hasPreviousEnabled) {

                    // Selects the option above the currently selected option
                    self.moveUp();

                }

                // If there is not a currently enabled option
                else {

                    // Disables the entire drop down list
                    self.disable();

                }

            }

        }

        // Provides callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // _Is Disabled
    // -----------
    //      Checks the original select box for the
    //    disabled attribute

    selectBoxIt._isDisabled = function(callback) {

        var self = this;

        // If the original select box is disabled
        if (self.originalElem.disabled) {

            // Disables the dropdown list
            self.disable();

        }

        // Maintains chainability
        return self;

    };

    // Dynamic Positioning Module
    // ==========================

    // _Dynamic positioning
    // --------------------
    //      Dynamically positions the dropdown list options list

    selectBoxIt._dynamicPositioning = function() {

        var self = this;

        // If the `size` option is a number
        if($.type(self.listSize) === "number") {

            // Set's the max-height of the drop down list
            self.list.css("max-height", self.maxHeight || "none");

        }

        // If the `size` option is not a number
        else {

            // Returns the x and y coordinates of the dropdown list options list relative to the document
            var listOffsetTop = self.dropdown.offset().top,

                // The height of the dropdown list options list
                listHeight = self.list.data("max-height") || self.list.outerHeight(),

                // The height of the dropdown list DOM element
                selectBoxHeight = self.dropdown.outerHeight(),

                viewport = self.options["viewport"],

                viewportHeight = viewport.height(),

                viewportScrollTop = $.isWindow(viewport.get(0)) ? viewport.scrollTop() : viewport.offset().top,

                topToBottom = (listOffsetTop + selectBoxHeight + listHeight <= viewportHeight + viewportScrollTop),

                bottomReached = !topToBottom;

            if(!self.list.data("max-height")) {

              self.list.data("max-height", self.list.outerHeight());

            }

            // If there is room on the bottom of the viewport to display the drop down options
            if (!bottomReached) {

                self.list.css("max-height", listHeight);

                // Sets custom CSS properties to place the dropdown list options directly below the dropdown list
                self.list.css("top", "auto");

            }

            // If there is room on the top of the viewport
            else if((self.dropdown.offset().top - viewportScrollTop) >= listHeight) {

                self.list.css("max-height", listHeight);

                // Sets custom CSS properties to place the dropdown list options directly above the dropdown list
                self.list.css("top", (self.dropdown.position().top - self.list.outerHeight()));

            }

            // If there is not enough room on the top or the bottom
            else {

                var outsideBottomViewport = Math.abs((listOffsetTop + selectBoxHeight + listHeight) - (viewportHeight + viewportScrollTop)),

                    outsideTopViewport = Math.abs((self.dropdown.offset().top - viewportScrollTop) - listHeight);

                // If there is more room on the bottom
                if(outsideBottomViewport < outsideTopViewport) {

                    self.list.css("max-height", listHeight - outsideBottomViewport - (selectBoxHeight/2));

                    self.list.css("top", "auto");

                }

                // If there is more room on the top
                else {

                    self.list.css("max-height", listHeight - outsideTopViewport - (selectBoxHeight/2));

                    // Sets custom CSS properties to place the dropdown list options directly above the dropdown list
                    self.list.css("top", (self.dropdown.position().top - self.list.outerHeight()));

                }

            }

        }

        // Maintains chainability
        return self;

    };

    // Enable Module
    // =============

    // Enable
    // ------
    //      Enables the new dropdown list

    selectBoxIt.enable = function(callback) {

        var self = this;

        if(self.options["disabled"]) {

            // Triggers a `enable` custom event on the original select box
            self.triggerEvent("enable");

            // Removes the `disabled` attribute from the original dropdown list
            self.selectBox.removeAttr("disabled");

            // Make the dropdown list focusable
            self.dropdown.attr("tabindex", 0).

            // Disable styling for disabled state
            removeClass(self.theme["disabled"]).

            // Enables styling for enabled state
            addClass(self.theme["enabled"]);

            self.setOption("disabled", false);

            // Provide callback function support
            self._callbackSupport(callback);

        }

        // Maintains chainability
        return self;

    };

    // Enable Option
    // -------------
    //      Disables a single drop down option

    selectBoxIt.enableOption = function(index, callback) {

        var self = this, currentSelectBoxOption, currentIndex = 0, hasNextEnabled, hasPreviousEnabled, type = $.type(index);

        // If an index is passed to target an indropdownidual drop down option
        if(type === "number") {

            // The select box option being targeted
            currentSelectBoxOption = self.selectBox.find("option").eq(index);

            // Triggers a `enable-option` custom event on the original select box and passes the enabled option
            self.triggerEvent("enable-option");

            // Disables the targeted select box option
            currentSelectBoxOption.removeAttr("disabled");

            // Disables the drop down option
            self.listItems.eq(index).attr("data-disabled", "false").

            // Applies disabled styling for the drop down option
            removeClass(self.theme["disabled"]);

        }

        // Provides callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Keyboard Navigation Module
    // ==========================

    // Move Down
    // ---------
    //      Handles the down keyboard navigation logic

    selectBoxIt.moveDown = function(callback) {

        var self = this;

        // Increments `currentFocus`, which represents the currently focused list item `id` attribute.
        self.currentFocus += 1;

        // Determines whether the dropdown option the user is trying to go to is currently disabled
        var disabled = self.listItems.eq(self.currentFocus).attr("data-disabled") === "true" ? true: false,

            hasNextEnabled = self.listItems.eq(self.currentFocus).nextAll("li").not("[data-disabled='true']").first().length;

        // If the user has reached the top of the list
        if (self.currentFocus === self.listItems.length) {

            // Does not allow the user to continue to go up the list
            self.currentFocus -= 1;

        }

        // If the option the user is trying to go to is disabled, but there is another enabled option
        else if (disabled && hasNextEnabled) {

            // Blur the previously selected option
            self.listItems.eq(self.currentFocus - 1).blur();

           // Call the `moveDown` method again
            self.moveDown();

            // Exit the method
            return;

        }

        // If the option the user is trying to go to is disabled, but there is not another enabled option
        else if (disabled && !hasNextEnabled) {

            self.currentFocus -= 1;

        }

        // If the user has not reached the bottom of the unordered list
        else {

            // Blurs the previously focused list item
            // The jQuery `end()` method allows you to continue chaining while also using a different selector
            self.listItems.eq(self.currentFocus - 1).blur().end().

            // Focuses the currently focused list item
            eq(self.currentFocus).focusin();

            // Calls `scrollToView` to make sure the `scrollTop` is correctly updated. The `down` user action
            self._scrollToView("down");

            // Triggers the custom `moveDown` event on the original select box
            self.triggerEvent("moveDown");

        }

        // Provide callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Move Up
    // ------
    //      Handles the up keyboard navigation logic
    selectBoxIt.moveUp = function(callback) {

        var self = this;

        // Increments `currentFocus`, which represents the currently focused list item `id` attribute.
        self.currentFocus -= 1;

        // Determines whether the dropdown option the user is trying to go to is currently disabled
        var disabled = self.listItems.eq(self.currentFocus).attr("data-disabled") === "true" ? true: false,

            hasPreviousEnabled = self.listItems.eq(self.currentFocus).prevAll("li").not("[data-disabled='true']").first().length;

        // If the user has reached the top of the list
        if (self.currentFocus === -1) {

            // Does not allow the user to continue to go up the list
            self.currentFocus += 1;

        }

        // If the option the user is trying to go to is disabled and the user is not trying to go up after the user has reached the top of the list
        else if (disabled && hasPreviousEnabled) {

            // Blur the previously selected option
            self.listItems.eq(self.currentFocus + 1).blur();

            // Call the `moveUp` method again
            self.moveUp();

            // Exits the method
            return;

        }

        else if (disabled && !hasPreviousEnabled) {

            self.currentFocus += 1;

        }

        // If the user has not reached the top of the unordered list
        else {

            // Blurs the previously focused list item
            // The jQuery `end()` method allows you to continue chaining while also using a different selector
            self.listItems.eq(this.currentFocus + 1).blur().end().

            // Focuses the currently focused list item
            eq(self.currentFocus).focusin();

            // Calls `scrollToView` to make sure the `scrollTop` is correctly updated. The `down` user action
            self._scrollToView("up");

            // Triggers the custom `moveDown` event on the original select box
            self.triggerEvent("moveUp");

        }

        // Provide callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Keyboard Search Module
    // ======================

    // _Set Current Search Option
    // -------------------------
    //      Sets the currently selected dropdown list search option

    selectBoxIt._setCurrentSearchOption = function(currentOption) {

        var self = this;

        // Does not change the current option if `showFirstOption` is false and the matched search item is the hidden first option.
        // Otherwise, the current option value is updated
        if ((self.options["aggressiveChange"] || self.options["selectWhenHidden"] || self.listItems.eq(currentOption).is(":visible")) && self.listItems.eq(currentOption).data("disabled") !== true) {

            // Calls the `blur` event of the currently selected dropdown list option
            self.listItems.eq(self.currentFocus).blur();

            // Sets `currentIndex` to the currently selected dropdown list option
            self.currentIndex = currentOption;

            // Sets `currentFocus` to the currently selected dropdown list option
            self.currentFocus = currentOption;

            // Focuses the currently selected dropdown list option
            self.listItems.eq(self.currentFocus).focusin();

            // Updates the scrollTop so that the currently selected dropdown list option is visible to the user
            self._scrollToView("search");

            // Triggers the custom `search` event on the original select box
            self.triggerEvent("search");

        }

        // Maintains chainability
        return self;

    };

    // _Search Algorithm
    // -----------------
    //      Uses regular expressions to find text matches
    selectBoxIt._searchAlgorithm = function(currentIndex, alphaNumeric) {

        var self = this,

            // Boolean to determine if a pattern match exists
            matchExists = false,

            // Iteration variable used in the outermost for loop
            x,

            // Iteration variable used in the nested for loop
            y,

            // Variable used to cache the length of the text array (Small enhancement to speed up traversing)
            arrayLength,

            // Variable storing the current search
            currentSearch,

            // Variable storing the textArray property
            textArray = self.textArray,

            // Variable storing the current text property
            currentText = self.currentText;

        // Loops through the text array to find a pattern match
        for (x = currentIndex, arrayLength = textArray.length; x < arrayLength; x += 1) {

            currentSearch = textArray[x];

            // Nested for loop to help search for a pattern match with the currently traversed array item
            for (y = 0; y < arrayLength; y += 1) {

                // Searches for a match
                if (textArray[y].search(alphaNumeric) !== -1) {

                    // `matchExists` is set to true if there is a match
                    matchExists = true;

                    // Exits the nested for loop
                    y = arrayLength;

                }

            } // End nested for loop

            // If a match does not exist
            if (!matchExists) {

                // Sets the current text to the last entered character
                self.currentText = self.currentText.charAt(self.currentText.length - 1).

                // Escapes the regular expression to make sure special characters are seen as literal characters instead of special commands
                replace(/[|()\[{.+*?$\\]/g, "\\$0");

                currentText = self.currentText;

            }

            // Resets the regular expression with the new value of `self.currentText`
            alphaNumeric = new RegExp(currentText, "gi");

            // Searches based on the first letter of the dropdown list options text if the currentText < 3 characters
            if (currentText.length < 3) {

                alphaNumeric = new RegExp(currentText.charAt(0), "gi");

                // If there is a match based on the first character
                if ((currentSearch.charAt(0).search(alphaNumeric) !== -1)) {

                    // Sets properties of that dropdown list option to make it the currently selected option
                    self._setCurrentSearchOption(x);

                    if((currentSearch.substring(0, currentText.length).toLowerCase() !== currentText.toLowerCase()) || self.options["similarSearch"]) {

                        // Increments the current index by one
                        self.currentIndex += 1;

                    }

                    // Exits the search
                    return false;

                }

            }

            // If `self.currentText` > 1 character
            else {

                // If there is a match based on the entire string
                if ((currentSearch.search(alphaNumeric) !== -1)) {

                    // Sets properties of that dropdown list option to make it the currently selected option
                    self._setCurrentSearchOption(x);

                    // Exits the search
                    return false;

                }

            }

            // If the current text search is an exact match
            if (currentSearch.toLowerCase() === self.currentText.toLowerCase()) {

                // Sets properties of that dropdown list option to make it the currently selected option
                self._setCurrentSearchOption(x);

                // Resets the current text search to a blank string to start fresh again
                self.currentText = "";

                // Exits the search
                return false;

            }

        }

       // Returns true if there is not a match at all
        return true;

    };

    // Search
    // ------
    //      Calls searchAlgorithm()
    selectBoxIt.search = function(alphaNumericKey, callback, rememberPreviousSearch) {

        var self = this;

        // If the search method is being called internally by the plugin, and not externally as a method by a user
        if (rememberPreviousSearch) {

            // Continued search with history from past searches.  Properly escapes the regular expression
            self.currentText += alphaNumericKey.replace(/[|()\[{.+*?$\\]/g, "\\$0");

        }

        else {

            // Brand new search.  Properly escapes the regular expression
            self.currentText = alphaNumericKey.replace(/[|()\[{.+*?$\\]/g, "\\$0");

        }

        // Searches globally
        var searchResults = self._searchAlgorithm(self.currentIndex, new RegExp(self.currentText, "gi"));

        // Searches the list again if a match is not found.  This is needed, because the first search started at the array indece of the currently selected dropdown list option, and does not search the options before the current array indece.
        // If there are many similar dropdown list options, starting the search at the indece of the currently selected dropdown list option is needed to properly traverse the text array.
        if (searchResults) {

            // Searches the dropdown list values starting from the beginning of the text array
            self._searchAlgorithm(0, self.currentText);

        }

        // Provide callback function support
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Mobile Module
    // =============

    // Set Mobile Text
    // ---------------
    //      Updates the text of the drop down
    selectBoxIt._updateMobileText = function() {

        var self = this,
            currentOption,
            currentDataText,
            currentText;

        currentOption = self.selectBox.find("option").filter(":selected");

        currentDataText = currentOption.attr("data-text");

        currentText = currentDataText ? currentDataText: currentOption.text();

        // Sets the new dropdown list text to the value of the original dropdown list
        self._setText(self.dropdownText, currentText);

        if(self.list.find('li[data-val="' + currentOption.val() + '"]').find("i").attr("class")) {

           self.dropdownImage.attr("class", self.list.find('li[data-val="' + currentOption.val() + '"]').find("i").attr("class")).addClass("selectboxit-default-icon");

        }

    };

    // Apply Native Select
    // -------------------
    //      Applies the original select box directly over the new drop down

    selectBoxIt._applyNativeSelect = function() {

        // Stores the plugin context inside of the self variable
        var self = this;

        // Appends the native select box to the drop down (allows for relative positioning using the position() method)
        self.dropdownContainer.append(self.selectBox);

        self.dropdown.attr("tabindex", "-1");

        // Positions the original select box directly over top the new dropdown list using position absolute and "hides" the original select box using an opacity of 0.  This allows the mobile browser "wheel" interface for better usability.
        self.selectBox.css({

            "display": "block",

            "visibility": "visible",

            "width": self._realOuterWidth(self.dropdown),

            "height": self.dropdown.outerHeight(),

            "opacity": "0",

            "position": "absolute",

            "top": "0",

            "left": "0",

            "cursor": "pointer",

            "z-index": "999999",

            "margin": self.dropdown.css("margin"),

            "padding": "0",

            "-webkit-appearance": "menulist-button"

        });

        if(self.originalElem.disabled) {

            self.triggerEvent("disable");

        }

        return this;

    };

    // Mobile Events
    // -------------
    //      Listens to mobile-specific events
    selectBoxIt._mobileEvents = function() {

        var self = this;

        self.selectBox.on({

            "changed.selectBoxIt": function() {

                self.hasChanged = true;

                self._updateMobileText();

                // Triggers the `option-click` event on mobile
                self.triggerEvent("option-click");

            },

            "mousedown.selectBoxIt": function() {

                // If the select box has not been changed, the defaultText option is being used
                if(!self.hasChanged && self.options.defaultText && !self.originalElem.disabled) {

                    self._updateMobileText();

                    self.triggerEvent("option-click");

                }

            },

            "enable.selectBoxIt": function() {

                // Moves SelectBoxIt onto the page
                self.selectBox.removeClass('selectboxit-rendering');

            },

            "disable.selectBoxIt": function() {

                // Moves SelectBoxIt off the page
                self.selectBox.addClass('selectboxit-rendering');

            }

        });

    };

    // Mobile
    // ------
    //      Applies the native "wheel" interface when a mobile user is interacting with the dropdown

    selectBoxIt._mobile = function(callback) {

        // Stores the plugin context inside of the self variable
        var self = this;

            if(self.isMobile) {

                self._applyNativeSelect();

                self._mobileEvents();

            }

            // Maintains chainability
            return this;

    };

    // Remove Options Module
    // =====================

    // remove
    // ------
    //    Removes drop down list options
    //    using an index

    selectBoxIt.remove = function(indexes, callback) {

        var self = this,
            dataType = $.type(indexes),
            value,
            x = 0,
            dataLength,
            elems = "";

        // If an array is passed in
        if(dataType === "array") {

            // Loops through the array
            for(dataLength = indexes.length; x <= dataLength - 1; x += 1) {

                // Stores the currently traversed array item in the local `value` variable
                value = indexes[x];

                // If the currently traversed array item is an object literal
                if($.type(value) === "number") {

                    if(elems.length) {

                        // Adds an element to the removal string
                        elems += ", option:eq(" + value + ")";

                    }

                    else {

                        // Adds an element to the removal string
                        elems += "option:eq(" + value + ")";

                    }

                }

            }

            // Removes all of the appropriate options from the select box
            self.selectBox.find(elems).remove();

        }

        // If a number is passed in
        else if(dataType === "number") {

            self.selectBox.find("option").eq(indexes).remove();

        }

        // If anything besides a number or array is passed in
        else {

            // Removes all of the options from the original select box
            self.selectBox.find("option").remove();

        }

        // If the dropdown property exists
        if(self.dropdown) {

            // Rebuilds the dropdown
            self.refresh(function() {

                // Provide callback function support
                self._callbackSupport(callback);

            }, true);

        } else {

            // Provide callback function support
            self._callbackSupport(callback);

        }

        // Maintains chainability
        return self;

    };

    // Select Option Module
    // ====================

    // Select Option
    // -------------
    //      Programatically selects a drop down option by either index or value

    selectBoxIt.selectOption = function(val, callback) {

        // Stores the plugin context inside of the self variable
        var self = this,
            type = $.type(val);

        // Makes sure the passed in position is a number
        if(type === "number") {

            // Set's the original select box value and triggers the change event (which SelectBoxIt listens for)
            self.selectBox.val(self.selectItems.eq(val).val()).change();

        }

        else if(type === "string") {

            // Set's the original select box value and triggers the change event (which SelectBoxIt listens for)
            self.selectBox.val(val).change();

        }

        // Calls the callback function
        self._callbackSupport(callback);

        // Maintains chainability
        return self;

    };

    // Set Option Module
    // =================

    // Set Option
    // ----------
    //      Accepts an string key, a value, and a callback function to replace a single
    //      property of the plugin options object

    selectBoxIt.setOption = function(key, value, callback) {

        var self = this;

        //Makes sure a string is passed in
        if($.type(key) === "string") {

            // Sets the plugin option to the new value provided by the user
            self.options[key] = value;

        }

        // Rebuilds the dropdown
        self.refresh(function() {

            // Provide callback function support
            self._callbackSupport(callback);

        }, true);

        // Maintains chainability
        return self;

    };

    // Set Options Module
    // ==================

    // Set Options
    // ----------
    //      Accepts an object to replace plugin options
    //      properties of the plugin options object

    selectBoxIt.setOptions = function(newOptions, callback) {

        var self = this;

        // If the passed in parameter is an object literal
        if($.isPlainObject(newOptions)) {

            self.options = $.extend({}, self.options, newOptions);

        }

        // Rebuilds the dropdown
        self.refresh(function() {

            // Provide callback function support
            self._callbackSupport(callback);

        }, true);

        // Maintains chainability
        return self;

    };

    // Wait Module
    // ===========

    // Wait
    // ----
    //    Delays execution by the amount of time
    //    specified by the parameter

    selectBoxIt.wait = function(time, callback) {

        var self = this;

        self.widgetProto._delay.call(self, callback, time);

        // Maintains chainability
        return self;

    };
})); // End of all modules

$(document).ready(function(){

    // HEADER TOUCH POSITION FIXED FIX
    /* we need this only on touch devices */
    // if (Modernizr.touch) {
    //     /* cache dom references */
    //     var $topNav = jQuery('.top-nav');
    //
    //     /* bind events */
    //     $(document)
    //     .on('focus', 'input', function(e) {
    //         $topNav.addClass('fixfixed');
    //     })
    //     .on('blur', 'input', function(e) {
    //         $topNav.removeClass('fixfixed');
    //     });
    // }

  //SequenceJS
        var seqOpts = {
        fallback: {
            theme: "slide",
            speed: 2000
        },
        autoPlay: true,
        cycle: true,
        animateStartingFrameIn: true,
        reverseAnimationsWhenNavigatingBackwards: false,
        pagination: true,
        showPaginationOnInit: false, //uncommented this to stop it "blinking" on small screens
        preloader: true,
        preloadTheseFrames: [1,2,3]

    }

    // if exists
    if ($('#sequence').length > 0) {
      var sequence = $("#sequence").sequence(seqOpts).data("sequence");
        var texture = "url('" + sequence.container.data( 'texture' ) + "')";

        function sliderMq () {
            var pagi = document.querySelector( '.sequence-pagination' );
            var sz = 'small';
            if ( Modernizr.mq( 'screen and (max-width: 649px)' ) ) {
                pagi.style.display = 'none';
            }
            else {
                pagi.style.display = 'block';
                sz = 'large';
            }
            $('.slide', sequence.frames).each( function (i, elem) {
                elem = $(elem);
                elem.css( 'background-image', texture + ", url('" + elem.data( 'baseUri' ) + elem.data( sz + 'Image' ) + "')" );
            } );
        }
        $(window).resize( sliderMq );

      sequence.afterLoaded(
      setTimeout(
              sliderMq,
        300
      )
    );
        sequence.afterNextFrameAnimatesIn =
          function(){
             //trigger ga event.
              gaSlideEvent('#sequence li.animate-in','shown');
          };
  }

    if (!Modernizr.input.placeholder) {
        $('input, textarea').placeholder();
    }

    // metaQuery.onBreakpointChange( 'palm-only', function ( match ) {
    //     if( match ) {
    //         $('.overlay').css('width', 0);
    //     } else {
    //         $('.overlay').css('width', 150);
    //     }
    // });


});

$('select.navigation').on('change',
        function()
        {
            href=$(this).val();
            if( href != ''){
                window.location = href;
            }
        }
    );

var player_attrs = {
    // if the <video width> is not specified, this is the default
    defaultVideoWidth: 480,
    // if the <video height> is not specified, this is the default
    defaultVideoHeight: 270,
    // if set, overrides <video width>
    videoWidth: 'auto',
    // if set, overrides <video height>
    videoHeight: '100%',
    // width of audio player
    audioWidth: 400,
    // height of audio player
    audioHeight: 30,
    // initial volume when the player starts
    startVolume: 0.8,
    // useful for <audio> player loops
    loop: false,
    // enables Flash and Silverlight to resize to content size
    enableAutosize: true,
    // the order of controls you want on the control bar (and other plugins below)
    features: ['playpause','current','duration','tracks','volume','fullscreen', 'sourcechooser'],
    // Hide controls when playing and mouse is not over the video
    alwaysShowControls: false,
    // force iPad's native controls
    iPadUseNativeControls: false,
    // force iPhone's native controls
    iPhoneUseNativeControls: false,
    // force Android's native controls
    AndroidUseNativeControls: false,
    // forces the hour marker (##:00:00)
    alwaysShowHours: false,
    // show framecount in timecode (##:00:00:00)
    showTimecodeFrameCount: false,
    // used when showTimecodeFrameCount is set to true
    framesPerSecond: 25,
    // turns keyboard support on and off for this instance
    enableKeyboard: true,
    // when this player starts, it will pause other players
    pauseOtherPlayers: true,
    // array of keyboard commands
    keyActions: []
};

//High or low resolution video
function setVidRes(){
    var windowWidth = $(window).width(),
          res = 'lo';

     if(windowWidth > 600){
          res = 'hi';
     }

     return res;
}

function setVidType(){
    var  type = 'mp4';
    if ( Modernizr.video.ogg === 'probably' ){
        type = 'ogv';
    }

   return  type;
}

function setVideo(id){
    // debugger;
    elem = document.getElementById(id);

    var videoRes = setVidRes(),
          videoType = setVidType(),
          player = new MediaElementPlayer( elem, player_attrs );

    player.setSrc( $(elem).data( videoType + '-' + videoRes));
    player.load();
}

function videoInit(){

    if( !$('video').hasClass('bkg-video') ){
        var arr = [];
        $('video').each(function(index, elem){
            var vidId = $(elem).attr('id');

             setVideo(vidId);

        });
    }
}

$(function(){
    videoInit();
})


/*
 * Handles validating individual fields on blur.
 */

$(document).on('blur','form.blur-validation input[type=email], form.blur-validation input[type=number], form.blur-validation input[type=tel], form.blur-validation input[type=text], form.blur-validation textarea',
  function(e){
     that = $(this);
     //make an ajax call to validate the single field.
     $.ajax(
       {
         context: this,
         url: (is_dev ? '/app_dev.php':'')+'/ajax/blur-validation',
         type: 'POST',
         data: { field: that.attr('name'), value: that.val() }
       }
     )
     .done(
         function( data, textStatus, jqXHR ) {
             $(this)
               .removeClass('error')
               .addClass('valid')
               .attr('error-message', '');
         }
     )
     .fail(
         function( jqXHR, textStatus, errorThrown ) {
             $(this)
               .removeClass('valid')
               .addClass('error')
               .attr('error-message', jqXHR.responseText);
         }
     );
});

jQuery('document').ready(
    function(){
        //force input buttons with a class of submission to submit the form
        $(document).on('click','form input[type=button].submission',
            function(){
                that = $(this);
                if( elem_id = that.attr('data-element') ){
                    dv = that.attr('data-value');
                    if( dv )
                    {
                        $('#'+elem_id).val( dv );
                    }else{
                        $('#'+elem_id).val( that.val() );
                    }
                }
                that.closest('form').find('input.submission').prop('disabled',true);
                that.closest('form').submit();
            }
        );
    }
);
$(document).ready(function(){

    $(document).on('submit', 'form.ajax-form-simple',function(e){
        e.preventDefault();
        submitAjaxForm(this, 'simple');
        return false; // prevent default submission
    });

    $(document).on('submit', 'form.ajax-form-modal',function(e){
        e.preventDefault();
        submitAjaxForm(this, 'modal');
        return false; // prevent default submission
    });

    function submitAjaxForm(element, type){
        $(element).find('.block-double').attr('disabled',false);
        resultPane = $(element).attr('id')+'-results';

        if( type === 'simple' ){
            var options = {
                target:         '#'+resultPane,
                beforeSubmit:   showRequest,
                success:        showSimpleResponse
            };
        } else {
            var options = {
                beforeSubmit:   showRequest,
                success:        showModalResponse
            };
        }

        $(element).ajaxSubmit(options);
    }

    function showRequest(formData, jqForm, options){
        toggleLoading('loading');
    }

    function showSimpleResponse(responseText, statusText, xhr, $form)  {
        var displayStatus = $('.loading-animation').css('display');
        if(displayStatus !== 'none') {
            toggleLoading();
        }
    }

    function showModalResponse(responseText, statusText, xhr, $form)  {
        var displayStatus = $('.loading-animation').css('display');
        if(displayStatus !== 'none') {
            toggleLoading();
        }
        modal = $(responseText);
        $('body').append(modal);
        toggleModal(modal);
    }

    $('form.submit-on-load').submit();

    $(document).on('click','a.ajax-button-simple',
        function(e){
            that = $(this);
            e.preventDefault();
            target = '#'+that.attr('data-target');
            $.ajax(
                {
                target: target,
                url: that.attr('href')
                }
            )
            .done(
                function(data,textStatus,jqXHR){
                    $(target).html(data).find('form.ajax-form-simple').each(initSimpleAjaxForm);

                }
            )
            ;
        }
    );
});

/* 
 * jQuery plugin to allow for watching a form and seeing if changes have been made.
 * 
 * author: Micah Flatt <mflatt@flattware.net>
 * date: 2013-03-11
 * 
 * Loosely based on the protect-data plugin. That plugin though kept a global
 * property for changes across the board. I want to watch forms individually 
 * and not as a whole.
 * 
 * The structure of the plugin is based documentation on plugin authoring found here:
 * http://docs.jquery.com/Plugins/Authoring
 */

(function( $ ){
    var methods = {
        init : function( options ) {
            return this.each(function(){
                var $this = $(this),
                    data = $this.data('dataWatch');
                
                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    $this.data('dataWatch',{
                       initialData: methods.stripPlaceholders($this.serialize()) 
                    });
                    //console.log( $this.data('dataWatch') );
                    //bind to the form field methods.
                    $this.find(':input').bind('change.dataWatch', methods.watch );
                    //reset on submit.
                    $this.find(':submit').bind('submit.dataWatch' , methods.reset );
              }
           });
        },
        destroy : function(){
           var $this = $(this);
           $this.removeData('dataWatch');
           $this.find(':input').unbind('.dataWatch');
        },
        isChanged : function($form){
            if( $form !== undefined){
                $this = $form;
            }else{
                $this = $(this);
            }
            var data = $this.data('dataWatch');
            if( data == undefined ){
                return false;
            }else{
                return (data.initialData != methods.stripPlaceholders($this.serialize()) );
            }
        },
        reset : function(){
            var $this = $(this),
                data = $this.data('dataWatch');
            data.unsavedChanges = false;
            data.initialData = methods.stripPlaceholders($this.serialize());
        },
        watch : function(){
            var $this = $(this),
                $form = $this.closest('form');
                data = $form.data('dataWatch');
            if( methods.isChanged($form) ){
                //show message
                $form.find('div.requireSave').css('display','');
            }else{
                //hide any message.
                $form.find('div.requireSave').css('display','none');
            }
        },
        stripPlaceholders: function( data ){
            //ignore date placeholders getting removed.
            return data.replace(/MM%2FYYYY/gi,'');
        }
    }
    
    $.fn.dataWatch = function( method ){
        //does the requested method exist?
        //run it, otherwise assume initialization....
        // for initialization, an options object may be passed in.
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.dataWatch' );
        }
    }
    
})( jQuery );
$(document).ready(
   function(){
       $('form.nav-watch').dataWatch().on('submit',function(){$(this).dataWatch('reset');});
   }
);

$(document).ready(function(){
  // initSelectBox( $(document) );

    if ("ontouchstart" in document.documentElement)
    {
        // It's a touch screen device.
        return;
    } else {
        // Others devices.
        initSelectBox($(document));
    }
});

$(document).ajaxComplete(function(e,xhr,settings) {
    var target = $(settings.target);
    if( target.length ){
        if ("ontouchstart" in document.documentElement)
        {
            // It's a touch screen device.
            return;
        } else {
            // Others devices.
            initSelectBox(target);
        }
    }
});

function initSelectBox(target){
  target.find("select:not(#state-select, #ng-statepage-state-select)").chosen({
    disable_search_threshold: 15
  });

 //    $('.select2-arrow').addClass('icon-ng_point-down');
  // // Select2 places absolutely positioned dropdown at bottom of Body
  // // This makes sure the select2's dropdown text is responsive.
  // $("select").on('select2-opening', function(){
 //        	   var fontPx = $(this).css('font-size');
 //        	   $('.select2-drop').css('font-size', fontPx);
  // });

 //    $("select").on('select2-opening', function(e){
 //        $('#s2id_' + e.target.id).find('.select2-arrow').removeClass('icon-ng_point-down');
 //        $('#s2id_' + e.target.id).find('.select2-arrow').addClass('icon-ng_point-up');
 //     });

 //    $("select").on('select2-close', function(e){
 //        $('#s2id_' + e.target.id).find('.select2-arrow').removeClass('icon-ng_point-up');
 //        $('#s2id_' + e.target.id).find('.select2-arrow').addClass('icon-ng_point-down');
 //    });
}

$(document).ready(function(){

  if ("ontouchstart" in document.documentElement)
  {
    // It's a touch screen device.

    return;
  }
  else
  {
    // Others devices.
    initChosen();
  }
});

function initChosen(){
  $('.timeline-career-fields').chosen({
    disable_search: true
  });
}

//Handles any navigation related events.
window.onbeforeunload =
   function(){
       //check watched forms for unsaved changes.
       watched = $('form.nav-watch');
       if( watched.length )
       {
         for(var x=0;x< watched.length;x++)
         {
            if( $(watched[x]).dataWatch('isChanged') )
            {
                $msg = $(watched[x]).attr('nav-message');
                if( $msg == undefined ) $msg = 'You have unsaved changes on your form.';
                return $msg;
            }
         }
       }
   };
$(document).on('click','.quick-links',
    function(e){
        e.preventDefault();
        that = $(this);
        target = $(that.attr('data-toggle-target'));
        if( target.is(':visible') )
        {
            target.slideUp( 300, function(){

                 that.css('background-image', 'url("../images/SVG/ng_view-more-down.svg")' );
            });
             $('.footer__bottom .chat').show();
            that.html( that.attr('data-show-text') );
        }else{
            target.slideDown( 300, function(){
                 that.css('background-image', 'url("../images/SVG/ng_view-more-up.svg")' );
            });
            $('.footer__bottom .chat').hide();
            that.html( that.attr('data-hide-text') );
        }
    }
);

var eventCnt = 0;

function sendGaEvent(eventType, target, label){
    var that = $(target),
        component = that.closest('*[data-ga-component]').attr('data-ga-component'),
        node_id = that.closest('*[data-node-id]').attr('data-node-id')
    if ( node_id === undefined) { node_id = '0';}
    var ga_cat = gaCategoryWrap(component,node_id);

        //always keep going.
    ga('send', 'event', ga_cat, eventType, label, ++eventCnt );
}

$(document).on('click','a',
    function(e){
        //build component
        var that = $(this);

        sendGaEvent(e.type, e.target, that.attr('href'));
        // component = that.closest('*[data-ga-component]').attr('data-ga-component');
        // node_id = that.closest('*[data-node-id]').attr('data-node-id');
        // if( node_id === undefined){ node_id = '0';}
        // ga_cat = gaCategoryWrap(component,node_id);
        // //build label
        // ga_label = that.attr('href');
        // //always keep going.
        // ga('send', 'event', ga_cat, 'click', ga_label, ++eventCnt );
    }
);

function gaSlideEvent(selector,event)
{
    var that = $(selector);

    node = that.closest('*[data-node-id]').attr('data-node-id');
    ga_cat = gaCategoryWrap('sliders',node);

    ga_label = that.closest('*[data-ga-label]').attr('data-ga-label');
    ga('send', 'event', ga_cat, 'shown', ga_label);
}

function gaCategoryWrap(component,node_id)
{
    page_node = $('body').attr('data-ga-page-node');
    geo_id = $('body').attr('data-ga-geo');
    return page_node+'_'+component+'_'+node_id+'_'+geo_id;
}

$(document).ready(
    function(){
        footerForm = $('footer .get-started-footer form');
        if( footerForm.length )
        {
            ga_cat = gaCategoryWrap('footer-get-started',footerForm.attr('data-node-id'));
            ga('send', 'event', ga_cat, 'shown');
        }
    }
);


function videoPPETracking(e){
    var that = $(this);
    sendGaEvent(e.type, e.target, that.attr('data-title') );

    if( e.type === 'ended'){
        $(e.target).data('savedProgress',0);
    }
}

function videoTimeUpdateTracking(e){
    var savedProgress = $(e.target).data('savedProgress');
    if( !savedProgress )
    {
        savedProgress = 0;
    }
    var currentProgress = e.target.currentTime/e.target.duration * 100 ;
    var that = $(this);
    if( currentProgress > 25 && currentProgress < 50 && savedProgress !== 25 ){
        $(e.target).data('savedProgress',25);
        sendGaEvent('25% Progress', e.target, that.attr('data-title') );
    } else if( currentProgress > 50 && currentProgress < 75 && savedProgress !== 50 ){
         $(e.target).data('savedProgress',50);
         sendGaEvent('50% Progress', e.target, that.attr('data-title') );
    } else if( currentProgress > 75 && currentProgress < 100 && savedProgress !== 75  ){
         $(e.target).data('savedProgress',75);
         sendGaEvent('75% Progress', e.target, that.attr('data-title') );
    }
}

//Video GA tracking
$('video')
    .on('play pause ended',videoPPETracking)
    .on("timeupdate", videoTimeUpdateTracking);

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
function toggleModal(selector)
{
    var that = $(selector);
    if( that.hasClass('shown') )
    {
        $('html').removeClass('stop-scrolling')
        that.fadeOut(500, function(){that.toggleClass('shown')} );

    }else{
      $('html').addClass('stop-scrolling')
        that.toggleClass('shown').fadeIn(500);
    }
}

function toggleLoading(txt)
{
    var that = $('#loading-modal');
    if( txt == undefined )
    {
        $('.loading-animation').velocity('fadeOut', {duration: 150});
    }else{
        $('.loading-animation').velocity('fadeIn', {duration: 150});
        $('.ring-svg').velocity({
                rotateZ: "360deg"
           },{duration: 1000, loop: true, easing: 'linear'});
    }
}

$(document)
.on('click',"a[href='/newsletter'], a[href='/app_dev.php/newsletter']",
  function(e){
      e.preventDefault();
      toggleModal('#newsletter-modal');
  }
)
.on('click', '.modal a.close-box',
  function(e){
      e.preventDefault();
      toggleModal( $(this).data('target') );
  }
)
.on('click','.modal-link',function(e){
    e.preventDefault();

    if( !$(this).hasClass('disabled') )
    {
        $(this).addClass('disabled');
        //find any existing dynamic modal and remove it.
        modal = $('#dynamic_modal');

        if( modal.length > 0)
        {
            modal.remove();
        }

        tmpUrl = $(this).attr('href');
        if( is_dev && tmpUrl.split('/')[1] != 'app_dev.php')
        {
            tmpUrl = '/app_dev.php'+tmpUrl;
        }
        $.ajax({
            url: tmpUrl,
            context: this
        })
        .done(function( data, textStatus, jqXHR){
            $(this).removeClass('disabled');
            modal = $(data);
            $('body').append(modal);
            setHeroImage();
            toggleModal(modal);
        });
    }
});

//watch forms within modals.
$(document).on('submit','#dynamic_modal form.ajax_submit', function(e){
    e.preventDefault();
    $(this).ajaxSubmit({
        success: function(responseText, statusText, xhr, $form){
            switch(xhr.status)
            {
                case 200:
                    $('#dynamic_modal').replaceWith(responseText);
                    toggleModal('#dynamic_modal');
                    break;
                case 201:
                    location.reload();
                    break;
            }
        },
        error:   function(xhr, err, statusText, $form){
            if( xhr.status == 422)
            {
                //replace the modal with this response.
                $('#dynamic_modal').replaceWith(xhr.responseText);
                toggleModal('#dynamic_modal');
            }
        }
    });
});

 $(document).on('click', '.share',
    function (e) {
        e.preventDefault();
        //console.log('fire');
//        if ( io.mobileSafari ){ //on mobile safari, we open the window ourselves
//            var addthis = $('#share').attr('href');
//            window.open(addthis, '_blank');
//        }else{
            $('#share').trigger('click');
//        }
    }
);

$(document).on('click',"a[href='/chat'], a[href='/app_dev.php/chat']",
  function(e){
      e.preventDefault();
      // window.open(
      //   'https://home-c7.incontact.com/inContact/ChatClient/ChatClient.aspx?bu=4593267&poc='+window.chatPoc,
      //   '',
      //   'width=495,height=685,resizable=0'
      // );

	var poc = 'aa1c4cbb-776d-43e9-8697-d01b7f26fa36';

	if( window.screen.width < 1025){
		poc = '1417a266-94db-4e35-96b7-51150a96564b';
	}

	window.open(
        'https://home-c7.incontact.com/inContact/ChatClient/ChatClient.aspx?bu=4593267&poc='+poc,
        '',
        'width=495,height=685,resizable=0'
      );
  }
);

function setHeroImage(){
    //console.log('Hero Image Called');
    var  windowWidth = $(window).width();
    that = $('*[data-letterbox]').each(function(){
       that = $(this);
        var bgUrl = '';
        var bgRepeat = '';
        var bgPosition = '';
        var bgSize = '';
        if( that.data('texture') )
        {
            //console.log('texture found');
            bgUrl = 'url(' +that.data('texture') +'),';
            bgRepeat = 'repeat,';
            bgPosition = '0%,';
            bgSize = 'auto,';
        }
        //get the width
        if(windowWidth < 650){
            //square
            //console.log('small window');
            bgUrl    += 'url(' +that.data('square') +')';
            bgRepeat += 'no-repeat';
            bgPosition += 'center';
            bgSize += 'cover';
        }else{
            //letterbox
            //console.log('letterbox image');
            bgUrl    += 'url(' +that.data('letterbox') +')';
            bgRepeat += 'no-repeat';
            bgPosition += 'center';
            bgSize += 'cover';
        }
        if(that.css('background-image') != bgUrl && !that.attr('data-resize')){
            //console.log('Setting background...'+bgUrl);
            that.css('background-image', bgUrl);
            that.css('background-size', bgSize);
            that.css('background-position', bgPosition);
            that.css('background-repeat', bgRepeat);
        }
    });
}
$(window).resize(setHeroImage);
$(document).ready(
    function(){
        setHeroImage();
    }
);

function initShowHide(target){

    target.find('a.show-info').on('click',
        function(e){
            e.preventDefault();

            var that = $(this);
            if ( !$('.get-started__info-list').is(':visible') ){
                $('.get-started__info.optional').animate({
                    'padding-bottom': '+=75%'
                }, function(){
                    $('.get-started__info-list').css({
                       'display': 'block'
                    });
                    that.html(that.data('hide-text'));
                });
            } else {
                $('.get-started__info-list').css({
                       'display': 'none'
                });
                $('.get-started__info.optional').animate({
                    'padding-bottom': '-=75%'
                });
                that.html(that.data('show-text'));
            }

    });
}

$(document).ready(function(){
    initShowHide( $(document) );
});

$(document).ajaxComplete(function(e,xhr,settings) {
    var target = $(settings.target);
    if( target.length ){
        initShowHide(target);
    }
});

$(document).ready(function(){

  var $lightbox = $('.slider-content');
  var $lightboxWrapper = $('.slider-content-wrapper');
  var $overlay = $('.slider-boundary');
  var $slider = $('.slider-container');
  var $slide = $('.slider-slide');
  $('.slider-slide:last-child').prependTo('.slider-container');

  var slideLimit = $slide.length;
  setSliderWidth(slideLimit);

  var moveThrottled = _.throttle(move, 400, {trailing: false});
  $('.control').on('click', moveThrottled);
  $('.video-slide').on('click', function(e){ e.stopPropagation();})
  $('.slider-boundary').on('click', initLightBox);

  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      closeLightBox();
    }   // esc
  });

  function initLightBox(e){
    if ($(this).hasClass('_is-fullscreen')) {
      if(!$(event.target).parents('.slider-container').length){
        closeLightBox(e);
      }
    } else if (!$('html').hasClass('breakpoint-palm-only')) {
      e.preventDefault();
      openLightBox(e);
    }
  }

  function closeLightBox(){
    if($overlay.hasClass('_is-fullscreen')){
      $lightboxWrapper.velocity('transition.shrinkOut', 200, function(){
        $overlay.velocity({opacity: 0}, 50, function(){
          $overlay.removeClass('_is-fullscreen').attr('style', '');
          $lightboxWrapper.velocity('transition.shrinkIn', 200, function(){
            $lightboxWrapper.attr('style', '');
            $('body').css({
              'overflow':'scroll',
              'height': 'auto',
              'position':'static',
              'top': 'auto',
              'bottom': 'auto',
              'right': 'auto',
              'left': 'auto'
            });
          });
        });
      });
    }
  }

  function openLightBox(e){
    e.preventDefault();
    e.stopPropagation();
    $('body').css({
      'overflow':'hidden',
      'height': '100%',
      'position':'fixed',
      'top': 0,
      'bottom': 0,
      'right': 0,
      'left': 0
    });
    $overlay.addClass('_is-fullscreen');
    $overlay.velocity({opacity:1}, 200);
    $('.slider-content-wrapper').velocity('transition.shrinkIn', 300);
  }

  function getSliderWidth(slideLimit){
    width = slideLimit * 100
    return width; //gets width that full slider needs to be
  }

  function move(e){
    // e.preventDefault();
    e.stopPropagation();
    $('.slider-boundary').off('click');
    var direction = $(this).attr('data-direction');

    if (direction === 'next') {
      $slider.velocity({
        left: '-=100%'
      }, function(){
        $('.slider-slide:first-child').appendTo($slider);
        $slider.css('left', '');
        $('.slider-boundary').on('click', initLightBox);
      });
    } else {
      $slider.velocity({
        left: '+=100%'
      }, function(){
        $('.slider-slide:last-child').prependTo($slider);
        $slider.css('left', '');
        $('.slider-boundary').on('click', initLightBox);
      });
    }
  }

  function setSliderWidth(numberOfSlides){
    $slider.css('width', (getSliderWidth(numberOfSlides) + "%")); // sets the full wide slider width
    slideWidth = (100 / numberOfSlides);
    $slide.css('width', (slideWidth + "%")); //set slide width so LI fills properly
  }

});

$(document).ready(function(){

  //$(".top-nav").headroom({tolerance : 10});

  var $menu = $('#side-menu');
  var width = $menu.width();
  var isTouchDevice = 'ontouchstart' in document.documentElement;
  var tapEvent = isTouchDevice ? 'touchend' : 'click';

  $('.sb-toggle-left').on(tapEvent, function(e){
    e.stopPropagation();
    updateMenu(e);
  });

  function updateMenu(){
    if($menu.hasClass('side-nav__hidden')){
      openMenu();
    } else {
      closeMenu();
    }
  }

  function closeMenu(){
    $menu.addClass('side-nav__hidden');
    $menu.velocity("reverse");
    if($('html').hasClass('breakpoint-palm-only')){
      $('body').css('overflow', 'scroll');

      $(document).unbind('touchmove');

      $('#sb-site').off(tapEvent);

    }
  }

  function openMenu(){
    $menu.removeClass('side-nav__hidden');
    $menu.velocity({
      translateZ: 0,
      translateX: [0, "-" + width + "px"]
    });
    if($('html').hasClass('breakpoint-palm-only')){
      $('body').css('overflow', 'hidden');

      $('#sb-site').on(tapEvent, function(e){
        e.preventDefault();
        e.stopPropagation();
        updateMenu(e);
      });

      // Uses document because document will be topmost level in bubbling
      $(document).on('touchmove',function(e){
        e.preventDefault();
      });

      var scrolling = false;

      // Uses body because jquery on events are called off of the element they are
      // added to, so bubbling would not work if we used document instead.
      $('body').on('touchstart','.scrollable',function(e) {

          // Only execute the below code once at a time
          if (!scrolling) {
              scrolling = true;
              if (e.currentTarget.scrollTop === 0) {
                e.currentTarget.scrollTop = 1;
              } else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
                e.currentTarget.scrollTop -= 1;
              }
              scrolling = false;
          }
      });

      // Prevents preventDefault from being called on document if it sees a scrollable div
      $('body').on('touchmove','.scrollable',function(e) {
        e.stopPropagation();
      });
    }
  }
});

;(function($) {

  $.ioAccordion = function(el, options) {

    var defaults = {
      activeBreakpoints: [], // empty array means always active
      status: 'closed',
      singleItemOpen: false,
      duration: 200,
      easing: 'swing',
      open: $.noop,
      opened: $.noop,
      close: $.noop,
      closed: $.noop,
      parentClass: null
    };

    // Create CUSTOM TOGGLE event.
    var openingEvent = document.createEvent('Event');
    var openedEvent = document.createEvent('Event');
    var closingEvent = document.createEvent('Event');
    var closedEvent = document.createEvent('Event');

    // Define that the event name is 'ioAccordion-opened'.
    openingEvent.initEvent('ioAccordion-opening', true, true);
    openedEvent.initEvent('ioAccordion-opened', true, true);
    closingEvent.initEvent('ioAccordion-closing', true, true);
    closedEvent.initEvent('ioAccordion-closed', true, true);

    var cssClasses = {
        ITEM: 'io-accordion__item',
        HEADER: 'io-accordion__item__header',
        OPENED: 'io-accordion__item--is-open',
        OPENING: 'io-accordion__item--is-opening',
        CLOSING: 'io-accordion__item--is-closing',
        DISABLED: 'io-accordion__item--is-disabled'
    };

    var selectors = {
      ITEM_HEADER: '> .io-accordion__item > .io-accordion__item__header',
      ITEM_CONTENT_WRAPPER: '> .io-accordion__content-wrapper',
      ITEM_CONTENT: '> .io-accordion__item > .io-accordion__item__content'
    };

    var plugin = this;

    plugin.settings = {};

    var init = function() {
      plugin.settings = $.extend({}, defaults, options);
      plugin.el = el;
      plugin.$ioAccordion = $(el);

      // code goes here
      plugin._wrapContent(plugin.$ioAccordion);
      plugin._bindEvents();

      if(plugin.settings.status === 'closed' && plugin._isActiveBreakpoint()){
        plugin.closeAll(true);
      }
    };

    plugin._isActiveBreakpoint = function(){
      if( plugin.settings.activeBreakpoints.length > 0 ){
        for(var i = 0; i < plugin.settings.activeBreakpoints.length; i++ ){
          var breakpoint = plugin.settings.activeBreakpoints[i];
          if( $('html').hasClass(breakpoint) ) {
            return true;
          }
        }
        return false;
      } else {
        return true;
      }
    };

    plugin._wrapContent = function($items){
      $items
        .find(selectors.ITEM_CONTENT)
        // wrap content section of each item to facilitate padding
        .wrap('<div class="io-accordion__content-wrapper" />')
        // add aria-hidden attribute to all hidden content wrappers
        .parents('.io-accordion__item:not(.io-accordion--is-open)')
        .find(selectors.ITEM_CONTENT_WRAPPER)
        .attr('aria-hidden', true);
    };

    plugin._bindEvents = function() {
      $('.io-accordion')
        .on('click', function(e) {
          var $target = $(e.target);
          var $closestAccordion = $target.closest('.io-accordion');

          // We don't want to continue if we're clicking on an anchor
          if ($target.is('a') || !!$target.parents('a').length) {
            return;
          }

          // cancel click if active breakpoint is not present
          if(!plugin._isActiveBreakpoint()){
            return;
          }

          // We need to verify not only that we're inside the direct bellows of the item, but also if the item is a header/child of a header
          if ($closestAccordion[0] === plugin.$ioAccordion[0] && ($target.hasClass(cssClasses.HEADER) || !!$target.closest('.io-accordion__item__header').length)) {
            e.preventDefault();
            e.stopPropagation();
            plugin.toggle($target.closest('.io-accordion__item'));
          }
        });
    };

    plugin._isOpen = function($item) {
        return $item.hasClass(cssClasses.OPENED);
    };

    plugin._isDisabled = function($item) {
        return $item.hasClass(cssClasses.DISABLED);
    };

    plugin.toggle = function($item) {

      if( $item.hasClass(cssClasses.OPENED) ){
        plugin.close($item);
      } else {
        plugin.open($item);
      }
    };

    plugin.open = function($item) {

      if (this._isOpen($item) || this._isDisabled($item)) {
        return;
      }

      var $content = $item.find(selectors.ITEM_CONTENT_WRAPPER);

      if (plugin.settings.singleItemOpen) {
        this.closeAll();
      }

      $content.velocity('slideDown', {
        begin: function(){
          $item.addClass(cssClasses.OPENING);
          document.dispatchEvent(openingEvent);
        },
        duration: plugin.settings.duration,
        easing: plugin.settings.easing,
        complete: function() {
          // FIRE CUSTOM EVENT
          document.dispatchEvent(openedEvent);
          $item
            .removeClass(cssClasses.OPENING)
            .addClass(cssClasses.OPENED)
            .find(selectors.ITEM_CONTENT_WRAPPER)
            .attr('aria-hidden', false);
        }
      });
    };

    plugin.close = function($item, custom) {

      if(!custom){
        if (!this._isOpen($item) || this._isDisabled($item)) {
          return;
        }
      }

      var $content = $item.find(selectors.ITEM_CONTENT_WRAPPER);

      $content.velocity('slideUp', {
        begin: function(){
          $item
            .removeClass(cssClasses.OPENED)
            .addClass(cssClasses.CLOSING);
            document.dispatchEvent(closingEvent);
        },
        duration: plugin.settings.duration,
        easing: plugin.settings.easing,
        complete: function() {
          $item
            .removeClass(cssClasses.CLOSING)
            .find(selectors.ITEM_CONTENT_WRAPPER)
            .attr('aria-hidden', true);
            document.dispatchEvent(closedEvent);
        }
      });
    };

    plugin.toggleAll = function() {
    plugin.$ioAccordion.find('.' + cssClasses.ITEM).each(function() {
          plugin.toggle($(this));
      });
    };

    plugin.openAll = function() {
      plugin.$ioAccordion.find('.' + cssClasses.ITEM + ':not(.' + cssClasses.OPENED + ')').each(function() {
          plugin.open($(this));
      });
    };

    plugin.closeAll = function(custom) {
      plugin.$ioAccordion.find('.' + cssClasses.ITEM).each(function() {
          if(custom){
            plugin.close($(this), true);
          } else {
            plugin.close($(this));
          }
      });
    };

    init();

  };

})(jQuery);

;(function($) {

  $.ioPagination = function(el, options) {

    var defaults = {
      first: true,
      last: false,
      pageLength: 5,
      pageNumber: 1
    };

    var plugin = this;
    plugin.settings = {};

    var init = function() {
      plugin.settings = $.extend({}, defaults, options);
      plugin.el = el;

      plugin.paginationItems = $(el).find('.io-pagination__item');
      plugin.settings.arrayOffset = 0;
      plugin.settings.arrayLength = plugin.paginationItems.length;

      // hide all items except the first set
      $(plugin.paginationItems).slice(plugin.settings.pageLength).hide();

      plugin._bindEvents();

    };

    plugin._bindEvents = function(){
      $(el).on('click', function(e) {
        var $target = $(e.target);

        // We don't want to continue if we're clicking on an anchor
        if ($target.is('a') || !!$target.parents('a').length) {
          return;
        }

        if($target.is('.io-pagination__controls__next')){
          var lastPage = (plugin.settings.arrayLength / plugin.settings.pageLength);
          // if not on last page
          if(plugin.settings.pageNumber !== lastPage){
            plugin.showNext();
          }
        } else if($target.is('.io-pagination__controls__previous')) {
          // if not on first page
          if(plugin.settings.pageNumber !== 1){
            plugin.showPrevious();
          }
        } else {
          return;
        }

      });
    };

    plugin.movePage = function(direction) {
      plugin.paginationItems.hide();
      var sliceBegin;
      var sliceEnd;

      if(direction === 'forward') {
        sliceBegin = plugin.settings.pageNumber * plugin.settings.pageLength;
        sliceEnd = sliceBegin + plugin.settings.pageLength;
        plugin.settings.pageNumber++;
        plugin.settings.arrayOffset += plugin.settings.pageLength;
      } else if(direction === 'back') {
        sliceBegin = plugin.settings.arrayOffset - plugin.settings.pageLength;
        sliceEnd = sliceBegin + plugin.settings.pageLength;
        plugin.settings.pageNumber--;
        plugin.settings.arrayOffset -= plugin.settings.pageLength;
      }

      $(plugin.paginationItems).slice(sliceBegin, sliceEnd).show();
    };

    plugin.showNext = function() {
      plugin.movePage('forward');
    };

    plugin.showPrevious = function() {
      plugin.movePage('back');
    };

    init();

  };

})(jQuery);

var navContainer;

$(document).ready(function(){
  $(".ng-global-nav__topbar").headroom({tolerance : 10});

  function GlobalNavigation(){

    var isMobileDevice = false;
    if($('html').hasClass('breakpoint-palm-only')){
      isMobileDevice = true;
    }

    var isTouchDevice = Modernizr.touch;
    var tapEvent = isTouchDevice ? 'touchstart' : 'click';

    var $overlayWrapper = $('.ng-global-nav__dropdowns-wrapper'),
        $dropdownsWrapper = $('.ng-global-nav__dropdowns-content'),
        $collectionsWrapper = $('.ng-global-nav__promo-collections-content'),
        $dropdownElements = $('.ng-global-nav__dropdown'),
        $navPromoCollectionElements = $('.global-nav__promo-collection__wrapper'),
        $dropdownClose = $('.ng-global-nav__close');

    function disableBodyScrolling(){
      $('html, body').css('overflow', 'hidden');

      // Uses document because document will be topmost level in bubbling
      $(document).on('touchmove',function(e){
        e.preventDefault();
      });

      // Prevents preventDefault from being called on document if it sees a scrollable div
      $('body').on('touchmove','.scrollable',function(e) {
        e.stopPropagation();
      });
    }

    function enableBodyScrolling(){
      $('html, body').css('overflow', 'auto');
      $(document).unbind('touchmove');
    }

    // object to manage states
    this.menuManager = {
      activeElement: null,
      activeWrapper: null,
      visible: false,
      animating: false,
      wrapper: $overlayWrapper,
      hoverTarget: null
    };

    // set menuManager in another variable to get it out of 'this' restrictions
    var manager = this.menuManager,
        navTimer = null,
        navTimerManager = null;

    // set global object on external variable for other files to access it
    navContainer = this;

    function killTimer(){
      clearTimeout(navTimer);
      navTimer = null;
      navTimerManager = null;
    }

    this.openMenu = function($contentWrapper, $element){
      killTimer();
      disableBodyScrolling();
      manager.animating = true;

      if(manager.activeWrapper){
        // if menu is open with wrong content wrapper, close it
        if( manager.activeWrapper[0] !== $contentWrapper[0] ){
          this.closeDropdown(manager.activeElement);
          setTimeout(function(){
            $contentWrapper.removeClass('dropdown__closed');
            $dropdownClose.css('display', 'block').removeClass('opacity-0');
            // wait for animation time
            setTimeout(function(){
              manager.animating = false;
            }, 200);
          }, 200);
        }
      } else {
        // velocity fade in new wrapper
        manager.wrapper.css('display', 'block').removeClass('opacity-0');
        setTimeout(function(){
          $contentWrapper.removeClass('dropdown__closed');
          $dropdownClose.css('display', 'block').removeClass('opacity-0');
          // wait for animation time
          setTimeout(function(){
            manager.animating = false;
          }, 200);
        }, 250);
      }

      manager.visible = true;
      manager.activeWrapper = $contentWrapper;
    };

    this.closeMenu = function(){
      killTimer();
      enableBodyScrolling();
      manager.animating = true;
      $('.collection-link, .dropdown-link').removeClass('inactive-link active-link');
      $('.collection-link').css('background-color', 'transparent').css('background-color', '');

      function closeMenuStates(){
        navContainer.closeDropdown(manager.activeElement);
        manager.activeWrapper.addClass('dropdown__closed');

        // wait close dropdown for animation
        setTimeout(function(){
          manager.wrapper.addClass('opacity-0');
          setTimeout(function(){
            manager.wrapper.css('display', 'none');
            manager.visible = false;
            manager.activeWrapper = null;
            manager.animating = false;
          }, 100);
        },200);
      }

      if( manager.activeWrapper[0] === $dropdownsWrapper[0] ){
        // if closing the dropdown wrapper (not collection wrapper) fade out the close button also
        $dropdownClose.addClass('opacity-0');
        setTimeout(function(){
          $dropdownClose.css('display', 'none');
          closeMenuStates();
        }, 100);
      } else {
        closeMenuStates();
      }
    };

    this.openDropdown = function($wrapper, $element, e){
      killTimer();

      if( !manager.activeElement ){
        this.openMenu($wrapper);
        manager.activeElement = $element;
        setTimeout(function(){
          $element.show();
          setTimeout(function(){
            $element.removeClass('dropdown-content__hidden');
          }, 50);
        }, 50);

      } else {
        //check the existing wrapper, open new one if needed
        if( manager.activeWrapper !== $wrapper ){
          this.openMenu($wrapper);
        }

        if( manager.activeElement ){
          this.closeDropdown(manager.activeElement);
        }

        manager.activeElement = $element;
        setTimeout(function(){
          $element.show();
          // set delay to wait on closing animation
          setTimeout(function(){
            $element.removeClass('dropdown-content__hidden');
          }, 10);
        }, 200);
      }

      // add active-link class to the proper topbar link
      var dropdownId = $element.data('dropdown');
      var $link = $('.ng-global-nav__topbar-link[data-dropdown-id="'+dropdownId+'"]');
      if($link.length){
        $('.active-link').removeClass('active-link');
        $link.addClass('active-link');
      }

      // if type is dropdown, disable the promo collection links (not on touch devices)
      var type = $element.data('type');
      if(!isTouchDevice){
        if(type === 'dropdown'){
          $('.collection-link').addClass('inactive-link');
        }
      }

      // if user opened the search dropdown, add focus to the input
      if( dropdownId === 'search' ){
        setTimeout(function(){
          $("#global-nav__search-input").focus();
        }, 400);
      }

      if( type === 'promo-collection' ){
        sendGaEvent(e.type, e.target, 'expand');
      }
    };

    this.closeDropdown = function($element){
      killTimer();
      $element.addClass('dropdown-content__hidden');
      setTimeout(function(){
        $element.hide();
      }, 200);
      manager.activeElement = null;
    };

    function clickEventNavClose(e){
      e.preventDefault();
      e.stopPropagation();
      sendGaEvent(e.type, e.target, 'close');
      navContainer.closeMenu();
    }

    function clickEventDropdownWrapper(e){
      // dont change behavior if target is input
      if($(e.target).is('input')){
        return;
      }

      //weird touch bug add active-link class back to button
      if(isTouchDevice){
        $('.dropdown-link[data-dropdown-id="'+manager.activeElement.data('dropdown')+'"]').addClass('active-link');
      }

      if(!isMobileDevice){
        // if target is not an anchor tag, override the default behavior
        if(!$(e.target).is('a') && !$(e.target).parents('a').length > 0){
          e.preventDefault();
          // close menu if clicking in overlay area
          if( manager.visible === true ){
            if( $(e.target)[0] === $overlayWrapper[0] ){
              navContainer.closeMenu();
            } else {
              return;
            }
          }
        }
      }
    }

    function clickEventCollectionLink(e){
      e.preventDefault();
      if(!isTouchDevice){
        //window.location.assign($(e.target).closest('a').attr('href'));
        if(manager.visible === true && manager.activeWrapper[0] === $dropdownsWrapper[0]){
          navContainer.closeMenu();
        }
      }
    }

    function clickEventDropdownLink(e){
      e.preventDefault();
      var gaEventSent = null;
      var gaDropdownId = $(e.target).data('dropdown-id');

      var $element = $('.ng-global-nav__dropdown[data-dropdown="'+$(e.target).data('dropdown-id')+'"]');

      $('.active-link').removeClass('active-link');
      $(e.target).addClass('active-link');

      // if menu is already open, figure out what to do
      if( manager.activeElement ){

        var activeId = manager.activeElement.data('dropdown'),
            clickId = $(e.target).data('dropdown-id'),
            activeType =  manager.activeElement.data('type'),
            clickType;

        if( $(e.target).hasClass('dropdown-link') ){
          clickType = 'dropdown';
        } else if ( $(e.target).hasClass('collection-link') ){
          clickType = 'promo-collection';
        }

        if( activeId === clickId ) {
          // you clicked the link of the current open menu item
          navContainer.closeMenu();
          sendGaEvent('close', e.target, gaDropdownId);
          gaEventSent = true;
        } else {
          // if you clicked a different dropdown link
          if( activeType !== clickType && activeType === 'dropdown') {
            navContainer.closeMenu();
            sendGaEvent('close', e.target, gaDropdownId);
            gaEventSent = true;
          } else {
            var $newElement = $('.ng-global-nav__dropdown[data-dropdown="'+clickId+'"]');
            navContainer.openDropdown($dropdownsWrapper, $newElement, e);
          }
        }

      } else {
        // menu not already open
        navContainer.openDropdown($dropdownsWrapper, $element, e);
      }

      if(!gaEventSent){
        sendGaEvent('expand', e.target, gaDropdownId);
      }
    }

    function bindClickEvents(){
      // setup click event listeners
      var navCloseButtons = document.getElementsByClassName('ng-global-nav__close');
      var dropdownWrappers = document.getElementsByClassName('ng-global-nav__dropdowns-wrapper');
      var collectionLinks = document.getElementsByClassName('collection-link');
      var dropdownLinks = document.getElementsByClassName('dropdown-link');

      _.forEach(navCloseButtons, function(el){
        el.addEventListener(tapEvent, function(e){
          clickEventNavClose(e);
        }, false);
      });

      _.forEach(dropdownWrappers, function(el){
        el.addEventListener(tapEvent, function(e){
          clickEventDropdownWrapper(e);
        }, false);
      });

      _.forEach(collectionLinks, function(el){
        el.addEventListener(tapEvent, function(e){
          clickEventCollectionLink(e);
        }, false);
      });

      _.forEach(dropdownLinks, function(el){
        el.addEventListener(tapEvent, function(e){
          clickEventDropdownLink(e);
        }, false);
      });
    }

    function bindHoverEvents(){

      function killCollectionTimerCheck($element, action){
        if( navTimerManager.selector[0] === $element[0] && navTimerManager.action === action){
          killTimer();
        }
      }

      function buildNavTimer($element, action, e){
        if( action === 'openMenu' ){
          navTimer = setTimeout(function(){
            navContainer.openDropdown($collectionsWrapper, $element, e);
          }, 350);
        } else if( action === 'closeMenu' ) {
          navTimer = setTimeout(function(){
            //navContainer.openDropdown($collectionsWrapper, $element, e);
            navContainer.closeMenu();
          }, 350);
        }
        navTimerManager = {
          timerID: navTimer,
          action: action,
          selector: $element
        };
      }

      function linkMouseEnterEvents($el, e){
        killTimer();
        if( manager.activeWrapper !== $dropdownsWrapper ){
          manager.hoverTarget = $('.ng-global-nav__dropdown[data-dropdown="'+$el.data('dropdown-id')+'"]');

          if(navTimer){
            // if current timer is not going to open the target element, cancel it
            if( navTimerManager.selector[0] !== manager.hoverTarget[0] && navTimerManager.action === 'openMenu'){
              killTimer();
            } else if ( navTimerManager.selector[0] === manager.hoverTarget[0] ){
              // if current timer is going to close target element, cancel it
              killTimer();
            }
          }

          // if target element is not already open, schedule it to be opened
          if( !manager.activeElement ){
            buildNavTimer(manager.hoverTarget, 'openMenu', e);
          } else {
            if( manager.activeElement[0] !== manager.hoverTarget[0] ){
              buildNavTimer(manager.hoverTarget, 'openMenu', e);
            }
          }
        }
      }

      function linkMouseLeaveEvents($el, e){
        killTimer();
        if( manager.activeWrapper !== $dropdownsWrapper ){
          manager.hoverTarget = $('.ng-global-nav__dropdown[data-dropdown="'+$el.data('dropdown-id')+'"]');

          // if current timer is not closing target element, cancel it
          if(navTimer){
            killCollectionTimerCheck(manager.hoverTarget, 'closeMenu');
          }

          // if target element is open, schedule it to be closed
          if( manager.activeElement ){
            if( manager.activeElement[0] === manager.hoverTarget[0] ){
              // condition for short time before menu is show, in case of quick mouseleave
              if(!manager.animating){
                buildNavTimer(manager.hoverTarget, 'closeMenu', e);
              }
            }
          }
        }
      }

      function collectionMouseEnterEvents($el, e){
        manager.hoverTarget = $el;
        if( manager.activeWrapper !== $dropdownsWrapper ){
          // if timer will close current collection, cancel it
          if(navTimer){
            killCollectionTimerCheck(manager.hoverTarget, 'closeMenu');
          }
        }
      }

      function collectionMouseLeaveEvents($el, e){
        manager.hoverTarget = $el;
        // schedule timer to close collection, this will get cancelled it entering correct link
        if( manager.activeWrapper !== $dropdownsWrapper ){
          buildNavTimer(manager.hoverTarget, 'closeMenu', e);
        }
      }

      // setup mouseenter mouseleave functions
      if(isTouchDevice){
        $(document).on('touchstart', '.collection-link', function(e){
          if(manager.activeWrapper){
            if(manager.activeWrapper[0] !== $dropdownsWrapper[0]){
              if($(this).hasClass('active-link')){
                $('.active-link').removeClass('active-link');
                navContainer.closeMenu();
              }
            }
          }
          var $targetElement = $('.ng-global-nav__dropdown[data-dropdown="'+$(this).data('dropdown-id')+'"]');
          navContainer.openDropdown($collectionsWrapper, $targetElement, e);
        });
      } else {
        $('.collection-link').mouseenter(function(e){
          linkMouseEnterEvents($(this), e);
        }).mouseleave(function(e){
          linkMouseLeaveEvents($(this), e);
        });

        $('.ng-global-nav__dropdown').mouseenter(function(e){
          collectionMouseEnterEvents($(this), e);
        }).mouseleave(function(e){
          collectionMouseLeaveEvents($(this), e);
        });
      }
    }

    bindClickEvents();
    bindHoverEvents();
  }
  var globalNav = new GlobalNavigation();
});

  var windowWidth = $(window).width();

  // INSTANTIATE ACCORDION
  var globalNavAccordion = new $.ioAccordion($('.global-nav__explore-content.io-accordion'),{ activeBreakpoints:['breakpoint-palm-only'] });

  //if user resizes from tablet to mobile this function fixes the things that invisible accordion sections cant handle
  //namely correcting opacity and setting sizes for responsive slider
  var isMobileOnLoad = false;
  if($('html').hasClass('breakpoint-palm-only')){
    isMobileOnLoad = true;
  }

  $('.global-nav__explore__main-menu__link.io-accordion__item__header').on('click', function(e){
    if($('html').hasClass('breakpoint-palm-only')){
      var $element = $(this).find('.global-nav__accordion-status');
      toggleAccordionStatus($element, e);
    }
  });

  function toggleAccordionStatus($element, e){
    var toggleState = $element.attr('data-state');
    var label = $(e.target).text().trim();
    if(toggleState === 'closed'){
      sendGaEvent('expand', e.target, label);
      $element.css('transform', 'rotate(-90deg)');
      $element.attr('data-state', 'open');
    } else {
      $element.css('transform', 'rotate(90deg)');
      $element.attr('data-state', 'closed');
      sendGaEvent('collapse', e.target, label);
    }
  }

  var globalNavResizeFunction = _.debounce(function() {
    //console.log('resize function fire');
    // All the taxing stuff i do
    if(!isMobileOnLoad){
      metaQuery.onBreakpointChange( 'palm-only', function ( match ) {
        if( match ) {
          // phawor! media query matches.
          globalNavAccordion.closeAll(true);
          if(navContainer.menuManager.activeWrapper){
            navContainer.closeMenu();
          }
        }
      });
    }

    // metaQuery.onBreakpointChange( 'tablet-up', function ( match ) {
    //   if( match ) {
    //     //console.log('DIS BE AT LEAST TABLET SIZE');
    //   }
    // });
  }, 500);

  setTimeout(function(){
    window.addEventListener('resize', globalNavResizeFunction);
  }, 1000);
