var Chokidar = Editor.require('app:node_modules/chokidar');

module.exports = {
    load: function () {
        this._pathWatcher = null;
    },

    unload: function () {
        if (this._pathWatcher) {
            this._pathWatcher.close();
            this._pathWatcher = null;
        }
    },

    'file-browser:open': function () {
        Editor.Panel.open('file-browser.panel');
    },

    'file-browser:watch-path' : function ( thePath ) {
        if (this._pathWatcher) {
            this._pathWatcher.close();
        }
        this._pathWatcher = Chokidar.watch(thePath, {
            persistent: true,
            ignoreInitial: true
        });
        this._pathWatcher
            .on('add', function ( path ) {
                Editor.sendToPanel('file-browser.panel', 'file-browser:add-item', path);
            }.bind(this))
            .on('addDir', function( path ) {
                Editor.sendToPanel('file-browser.panel', 'file-browser:add-item', path);
            }.bind(this))
            .on('unlink', function( path) {
                Editor.sendToPanel('file-browser.panel', 'file-browser:remove-item', path);
            }.bind(this))
            .on('unlinkDir', function( path) {
                Editor.sendToPanel('file-browser.panel', 'file-browser:remove-item', path);
            }.bind(this));
    },

    'file-browser:delete-path': function ( thePath ) {
        var Fs = require('fs');
        var Path = require('path');

        var deleteFolderRecursive = function(_path) {
            var files = [];
            if( Fs.existsSync(_path) ) {
                files = Fs.readdirSync(_path);
                files.forEach(function(file,index){
                    var curPath = Path.join(_path, file);
                    if(Fs.lstatSync(curPath).isDirectory()) {
                        // recurse
                        deleteFolderRecursive(curPath);
                    } else {
                        // delete file
                        Fs.unlinkSync(curPath);
                    }
                });
            }

            Fs.rmdirSync(_path);
        };

        try {
            if (! Fs.existsSync(thePath)) {
                return;
            }

            Editor.log('Deleting %s', thePath);
            var stats = Fs.lstatSync(thePath);
            if (stats.isDirectory()) {
                deleteFolderRecursive(thePath);
            } else {
                Fs.unlinkSync(thePath);
            }
            Editor.log('Delete %s succeed!', thePath);
        } catch (err) {
            Editor.log('Delete %s failed!', thePath);
        }
    }
};
