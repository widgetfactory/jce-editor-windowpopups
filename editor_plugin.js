/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var Dispatcher = tinymce.util.Dispatcher,
        each = tinymce.each;

    tinymce.create('tinymce.plugins.WindowPopups', {
        init: function (ed, url) {
            // Replace window manager
            ed.onBeforeRenderUI.add(function () {
                ed.windowManager = new tinymce.WindowPopupsManager(ed);
            });
        }
    });

    tinymce.create('tinymce.WindowPopupsManager:tinymce.WindowManager', {
        WindowPopupsManager: function (ed) {
            var self = this;

            self.editor = ed;
            self.onOpen = new Dispatcher(self);
            self.onClose = new Dispatcher(self);
            self.params = {};
            self.features = {};
        },

        /**
		 * Opens a new window.
		 *
		 * @method open
		 * @param {Object} s Optional name/value settings collection contains things like width/height/url etc.
		 * @option {String} title Window title. 
		 * @option {String} file URL of the file to open in the window. 
		 * @option {Number} width Width in pixels. 
		 * @option {Number} height Height in pixels. 
		 * @option {Boolean} resizable Specifies whether the popup window is resizable or not. 
		 * @option {Boolean} maximizable Specifies whether the popup window has a "maximize" button and can get maximized or not. 
		 * @option {Boolean} inline Specifies whether to display in-line (set to 1 or true for in-line display; requires inlinepopups plugin). 
		 * @option {String/Boolean} popup_css Optional CSS to use in the popup. Set to false to remove the default one. 
		 * @option {Boolean} translate_i18n Specifies whether translation should occur or not of i18 key strings. Default is true. 
		 * @option {String/bool} close_previous Specifies whether a previously opened popup window is to be closed or not (like when calling the file browser window over the advlink popup). 
		 * @option {String/bool} scrollbars Specifies whether the popup window can have scrollbars if required (i.e. content larger than the popup size specified). 
		 * @param {Object} p Optional parameters/arguments collection can be used by the dialogs to retrive custom parameters.
		 * @option {String} plugin_url url to plugin if opening plugin window that calls tinyMCEPopup.requireLangPack() and needs access to the plugin language js files 
		 */
        open: function (s, p) {
            var self = this, f = '', w, sw, sh, u;

            u = s.url || s.file;

            // Run inline windows
            if (!u) {
                return self.parent(s, p);
            }

            u = tinymce._addVer(u);

            // Default some options
            s = s || {};
            p = p || {};
            sw = screen.width;
            sh = screen.height;
            s.name = s.name || 'mc_' + new Date().getTime();
            s.width = parseInt(s.width || 320);
            s.height = parseInt(s.height || 240);
            s.resizable = true;
            s.left = s.left || parseInt(sw / 2.0) - (s.width / 2.0);
            s.top = s.top || parseInt(sh / 2.0) - (s.height / 2.0);
            p.inline = false;
            p.mce_width = s.width;
            p.mce_height = s.height;
            p.mce_auto_focus = s.auto_focus;

            // Build features string
            each(s, function (v, k) {
                if (tinymce.is(v, 'boolean')) {
                    v = v ? 'yes' : 'no';
                }

                if (!/^(name|url)$/.test(k)) {
                    f += (f ? ',' : '') + k + '=' + v;
                }
            });

            self.features = s;
            self.params = p;
            self.onOpen.dispatch(self, s, p);

            try {
                w = window.open(u, s.name, f);
            } catch (ex) {
                // Ignore
            }

            if (!w) {
                alert(self.editor.getLang('popup_blocked'));
            }
        },

		/**
		 * Closes the specified window. This will also dispatch out a onClose event.
		 *
		 * @method close
		 * @param {Window} w Native window object to close.
		 */
        close: function (w) {
            if (w) {
                w.close();
                this.onClose.dispatch(this);
            }
        },

        focus: function () {
            window.focus();
        },

		/**
		 * Creates a instance of a class. This method was needed since IE can't create instances
		 * of classes from a parent window due to some reference problem. Any arguments passed after the class name
		 * will be passed as arguments to the constructor.
		 *
		 * @method createInstance
		 * @param {String} cl Class name to create an instance of.
		 * @return {Object} Instance of the specified class.
		 * @example
		 * var uri = tinyMCEPopup.editor.windowManager.createInstance('tinymce.util.URI', 'http://www.somesite.com');
		 * alert(uri.getURI());
		 */
        createInstance: function (cl, a, b, c, d, e) {
            var f = tinymce.resolve(cl);

            return new f(a, b, c, d, e);
        },

		/**
		 * Creates a confirm dialog. Please don't use the blocking behavior of this
		 * native version use the callback method instead then it can be extended.
		 *
		 * @method confirm
		 * @param {String} self Title for the new confirm dialog.
		 * @param {function} cb Callback function to be executed after the user has selected ok or cancel.
		 * @param {Object} s Optional scope to execute the callback in.
		 * @example
		 * // Displays an confirm box and an alert message will be displayed depending on what you choose in the confirm
		 * tinyMCE.activeEditor.windowManager.confirm("Do you want to do something", function(s) {
		 *  if (s) {
		 *      tinyMCE.activeEditor.windowManager.alert("Ok");
         *  } else {
		 *      tinyMCE.activeEditor.windowManager.alert("Cancel");
         *  }
		 * });
		 */
        confirm: function (self, cb, s, w) {
            w = w || window;

            cb.call(s || this, w.confirm(this._decode(this.editor.getLang(self, self))));
        },

		/**
		 * Creates a alert dialog. Please don't use the blocking behavior of this
		 * native version use the callback method instead then it can be extended.
		 *
		 * @method alert
		 * @param {String} self Title for the new alert dialog.
		 * @param {function} cb Callback function to be executed after the user has selected ok.
		 * @param {Object} s Optional scope to execute the callback in.
		 * @example
		 * // Displays an alert box using the active editors window manager instance
		 * tinyMCE.activeEditor.windowManager.alert('Hello world!');
		 */
        alert: function (tx, cb, s, w) {
            var self = this;

            w = w || window;
            w.alert(self._decode(self.editor.getLang(tx, tx)));

            if (cb) {
                cb.call(s || self);
            }
        },

		/**
		 * Resizes the specified window or id.
		 *
		 * @param {Number} dw Delta width.
		 * @param {Number} dh Delta height.
		 * @param {window/id} win Window if the dialog isn't inline. Id if the dialog is inline.
		 */
        resizeBy: function (dw, dh, win) {
            win.resizeBy(dw, dh);
        },

        // Internal functions

        _decode: function (s) {
            return tinymce.DOM.decode(s).replace(/\\n/g, '\n');
        }
    });

    // Register plugin
    tinymce.PluginManager.add('windowpopups', tinymce.plugins.WindowPopups);
})();