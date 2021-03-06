
var Fs = require('fs');
var Path = require('path');

Editor.registerPanel( 'file-browser.panel', {
    is : 'file-browser',

    ready : function() {
        this._selectId = null;
        this._inputPath = null;
    },

    'file-browser:open-folder' : function( thePath ) {
        // set the path value to the input box
        this.$.folderPath.inputValue = thePath;

        // refresh the tree view
        this._openPath();
    },

    'file-browser:add-item' : function( thePath ) {
        this._addItem2Tree(thePath);
    },

    'file-browser:remove-item' : function ( thePath ) {
        this.$.folderView.removeItemById(thePath);
    },

    _addItem2Tree : function ( itemPath ) {
        if (this.$.folderView._id2el[itemPath]) {
            return;
        }

        var parentId = Path.dirname(itemPath);

        var parentEL = null;
        if (this._inputPath === parentId) {
            parentEL = this.$.folderView;
        } else {
            parentEL = this.$.folderView._id2el[parentId];
            if (!parentEL) {
                parentEL = this._addItem2Tree(parentId);
            }
        }

        var elData = null;
        if (Fs.lstatSync(itemPath).isDirectory()) {
            elData = this._dirTree(itemPath);
        } else {
            elData = {
                path : itemPath,
                name : Path.basename(itemPath)
            }
        }
        return this._addElement(parentEL, elData);
    },

    _openPath : function() {
        console.time('refreshFolderView');
        var inputValue = this.$.folderPath.inputValue;
        if (inputValue.length === 0) {
            Editor.log('Please input the path first!');
            return;
        }

        var thePath = Path.normalize(inputValue);
        if (! Fs.existsSync(thePath)) {
            Editor.log('Path "%s" is not existed!', thePath);
            return;
        }

        if (thePath === this._inputPath) {
            // not changed
            return;
        }

        this._inputPath = thePath;
        Editor.log('path : %s', this._inputPath);
        var viewData = this._dirTree(this._inputPath);

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
        Editor.sendToCore('file-browser:watch-path', this._inputPath);
    },

    _dirTree : function (filename) {
        var stats = Fs.lstatSync(filename);
        var info = {
            path: filename,
            name: Path.basename(filename)
        };

        if (stats.isDirectory()) {
            info.type = 'folder';
            info.children = Fs.readdirSync(filename).map(function(child) {
                return this._dirTree(Path.join(filename, child));
            }.bind(this));
        } else {
            // Assuming it's a file. In real life it could be a symlink or
            // something else!
            info.type = 'file';
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
        var el = document.createElement('tree-item');

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                this._addElement(el, childEntry)
            }.bind(this) );
        }

        return el;
    },

    deletePath : function () {
        if (this._selectId) {
            Editor.sendToCore('file-browser:delete-path', this._selectId);
        }
    }

});
