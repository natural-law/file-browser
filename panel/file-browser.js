
var fs = require('fs');
var path = require('path');
var Chokidar = require('chokidar');

Editor.registerPanel( 'file-browser.panel', {
    is : 'file-browser',

    ready : function() {
        this._selectId = null;
        this._fileWatcher = null;
    },

    'file-browser:open-folder' : function( thePath ) {
        // set the path value to the input box
        this.$.folderPath.inputValue = thePath;

        // refresh the tree view
        this._openPath();
    },

    _addItem2Tree : function ( itemPath ) {
        if (this.$.folderView._id2el[itemPath]) {
            return;
        }

        var theRootPath = path.normalize(this.$.folderPath.inputValue);
        var parentId = path.dirname(itemPath);
        var theName = path.basename(itemPath);

        var parentEL = null;
        if (theRootPath == parentId) {
            parentEL = this.$.folderView;
        } else {
            parentEL = this.$.folderView._id2el[parentId];
            if (!parentEL) {
                parentEL = this._addItem2Tree(parentId);
            }
        }

        return this._addElement(parentEL, {
            path: itemPath,
            name: theName
        });
    },

    _openPath : function() {
        console.time('refreshFolderView');
        var thePath = path.normalize(this.$.folderPath.inputValue);
        if (! fs.existsSync(thePath)) {
            Editor.log('Path "%s" is not existed!', thePath);
            return;
        }

        Editor.log('path : %s', thePath);
        var viewData = this._dirTree(thePath);

        this.$.folderView.clear();

        if (viewData.children) {
            viewData.children.forEach(function (entry) {
                this._addElement(this.$.folderView, entry);
            }.bind(this));
        }
        else
        {
            this._addElement(this.$.folderView, viewData);
        }
        console.timeEnd('refreshFolderView');

        // watch the folder
        if (this._fileWatcher) {
            this._fileWatcher.close();
        }
        this._fileWatcher = Chokidar.watch(thePath, {
            persistent: true,
            ignoreInitial: true
        });
        this._fileWatcher
            .on('add', function ( path ) {
                this._addItem2Tree(path);
            }.bind(this))
            .on('addDir', function( path ) {
                this._addItem2Tree(path);
            }.bind(this))
            .on('unlink', function( path) {
                this.$.folderView.removeItemById(path);
            }.bind(this))
            .on('unlinkDir', function( path) {
                this.$.folderView.removeItemById(path);
            }.bind(this));
    },

    _dirTree : function (filename) {
        var stats = fs.lstatSync(filename);
        var info = {
            path: filename,
            name: path.basename(filename)
        };

        if (stats.isDirectory()) {
            info.type = "folder";
            info.children = fs.readdirSync(filename).map(function(child) {
                return this._dirTree(path.join(filename, child));
            }.bind(this));
        } else {
            // Assuming it's a file. In real life it could be a symlink or
            // something else!
            info.type = "file";
        }

        return info;
    },

    _addElement : function (parent, data) {
        var newEL = this.newEntryRecursively(data);
        this.$.folderView.addItem(parent, newEL, {
            id: data.path,
            name: data.name
        });
        newEL.folded = true;
        newEL.addEventListener('click', function( event ) {
            event.stopPropagation();
            if (this._selectId) {
                this.$.folderView.unselectItemById(this._selectId);
            }
            this.$.folderView.selectItemById(data.path);
            this._selectId = data.path;
        }.bind(this));

        return newEL;
    },

    newEntryRecursively: function ( entry ) {
        var ctor = Editor.widgets['tree-item'];
        var el = new ctor();

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                this._addElement(el, childEntry)
            }.bind(this) );
        }

        return el;
    },

    deleteItem : function () {
        if (this._selectId) {
            Editor.sendToCore('file-browser:delete', this._selectId);
        }
    }

});
