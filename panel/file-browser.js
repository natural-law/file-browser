
var fs = require('fs');
var path = require('path');
function dirTree(filename) {
    var stats = fs.lstatSync(filename);
    var info = {
        path: filename,
        name: path.basename(filename)
    };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(path.join(filename, child));
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}

Editor.registerPanel( 'file-browser.panel', {
    is : 'file-browser',

    ready : function() {
        //this.$.loader.clear();
    },

    'file-browser:open-folder' : function( thePath ) {
        // set the path value to the input box
        this.$.folderPath.inputValue = thePath;

        // refresh the tree view
        this._openPath();
    },

    _openPath : function() {
        //this.$.loader.attached();

        console.time('refreshFolderView');
        var thePath = this.$.folderPath.inputValue;
        Editor.log('path : %s', thePath);
        var viewData = dirTree(thePath);

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

        //this.$.loader.clear();
    },

    _addElement : function (parent, data) {
        var newEL = this.newEntryRecursively(data);
        this.$.folderView.addItem(parent, newEL, {
            id: data.path,
            name: data.name
        });
        newEL.folded = true;
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

});
